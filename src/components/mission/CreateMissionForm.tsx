import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Address } from '@/types/supabase';
import { Loader2, Save, MapPin, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { calculateMissionPrice } from '@/lib/mission-pricing';
import { useToast } from '@/components/ui/use-toast';
import { typedSupabase } from '@/types/database';
import { Client } from '@/types/supabase';
import { Checkbox } from '@/components/ui/checkbox';
import { MissionDocumentsSection } from './sections/MissionDocumentsSection';
import MissionAttachments from './MissionAttachments';

// Définition du schéma de validation pour le formulaire
const missionSchema = z.object({
  mission_type: z.enum(['LIV', 'RES']),
  pickup_address: z.string().min(2, { message: 'L\'adresse de départ doit contenir au moins 2 caractères' }),
  delivery_address: z.string().min(2, { message: 'L\'adresse de livraison doit contenir au moins 2 caractères' }),
  pickup_contact_name: z.string().min(2, { message: 'Le nom du contact de départ doit contenir au moins 2 caractères' }),
  delivery_contact_name: z.string().min(2, { message: 'Le nom du contact de livraison doit contenir au moins 2 caractères' }),
  pickup_contact_phone: z.string().optional(),
  delivery_contact_phone: z.string().optional(),
  pickup_date: z.date({
    required_error: "Une date de départ est requise."
  }),
  delivery_date: z.date({
    required_error: "Une date de livraison est requise."
  }),
  number_of_packages: z.number().min(1, { message: 'Le nombre de colis doit être au moins 1' }).default(1),
  package_description: z.string().optional(),
  vehicle_type: z.enum(['CAR', 'VAN', 'TRUCK']),
  price: z.number().optional(),
  client_id: z.string().optional(),
  is_urgent: z.boolean().default(false),
  is_fragile: z.boolean().default(false),
  notes: z.string().optional(),
});

type MissionFormValues = z.infer<typeof missionSchema>;

interface CreateMissionFormProps {
  onSuccess: (missionId: string) => void;
  onDirtyChange: (isDirty: boolean) => void;
  livMission?: any;
}

const CreateMissionForm = ({ onSuccess, onDirtyChange, livMission }) => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialiser le formulaire avec React Hook Form
  const form = useForm<MissionFormValues>({
    resolver: zodResolver(missionSchema),
    defaultValues: {
      mission_type: 'RES',
      pickup_address: '',
      delivery_address: '',
      pickup_contact_name: '',
      delivery_contact_name: '',
      pickup_contact_phone: '',
      delivery_contact_phone: '',
      pickup_date: new Date(),
      delivery_date: new Date(),
      number_of_packages: 1,
      package_description: '',
      vehicle_type: 'CAR',
      is_urgent: false,
      is_fragile: false,
      notes: '',
    },
  });

  // Récupérer la liste des clients
  useEffect(() => {
    const fetchClients = async () => {
      if (!user) return;
      try {
        const { data, error } = await typedSupabase
          .from('clients')
          .select('*');
        if (error) {
          console.error('Erreur lors de la récupération des clients:', error);
        } else {
          setClients(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des clients:', error);
      }
    };

    fetchClients();
  }, [user]);

  // Surveiller les changements du formulaire pour activer/désactiver le bouton de sauvegarde
  useEffect(() => {
    const subscription = form.watch((data, { name, type }) => {
      setIsFormDirty(true);
      onDirtyChange(true);
    });
    return () => subscription.unsubscribe();
  }, [form, onDirtyChange]);

  // Handle address selection from Google Maps autocomplete
  const handlePickupAddressSelect = (address: string, placeId: string, addressData?: any) => {
    form.setValue('pickup_address', address);
  };

  const handleDeliveryAddressSelect = (address: string, placeId: string, addressData?: any) => {
    form.setValue('delivery_address', address);
  };

  // Fonction de soumission du formulaire
  const onSubmit = async (data: MissionFormValues) => {
    try {
      setIsLoading(true);

      // Calcul du prix de la mission
      let missionPrice = calculateMissionPrice(data.vehicle_type, data.is_urgent, data.is_fragile);

      // Appliquer une réduction de 30% si c'est une mission RES liée à une mission LIV
      if (livMission) {
        missionPrice = missionPrice * 0.7;
      }

      // Préparer les données à enregistrer
      const missionData = {
        ...data,
        price: missionPrice,
        client_id: profile?.role === 'admin' ? data.client_id : profile?.id,
        created_by: user?.id,
        mission_status: 'pending',
      };

      // Enregistrer la mission dans la base de données
      const { data: newMission, error } = await typedSupabase
        .from('missions')
        .insert([missionData])
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création de la mission:', error);
        toast({
          title: "Erreur lors de la création de la mission.",
          description: "Veuillez vérifier les informations saisies et réessayer.",
          variant: "destructive",
        });
      }

      if (newMission) {
        // Si on crée une mission RES à partir d'une mission LIV, on met à jour la mission LIV
        if (livMission) {
          const { error: updateError } = await typedSupabase
            .from('missions')
            .update({ linked_mission_id: newMission.id })
            .eq('id', livMission.id);

          if (updateError) {
            console.error('Erreur lors de la mise à jour de la mission LIV:', updateError);
            toast({
              title: "Erreur lors de la mise à jour de la mission LIV.",
              description: "Veuillez contacter l'administrateur.",
              variant: "destructive",
            });
          }
        }

        toast({
          title: "Mission créée avec succès.",
          description: "La mission a été créée avec succès.",
        });
        onSuccess(newMission.id);
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la mission:', error);
      toast({
        title: "Erreur inattendue.",
        description: error.message || "Une erreur est survenue lors de la création de la mission.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsFormDirty(false);
      onDirtyChange(false);
    }
  };

  const handleClientChange = useCallback((value: string) => {
    form.setValue('client_id', value);
  }, [form.setValue]);

  // Fonction pour échanger les deux champs
  const handleSwapAddresses = () => {
    setPickupAddress(deliveryAddress);
    setDeliveryAddress(pickupAddress);
    // Si vous stockez dans react-hook-form, pensez à échanger aussi les valeurs du formulaire :
    if (form?.setValue) {
      const prevPickup = form.getValues('pickup_address');
      const prevDelivery = form.getValues('delivery_address');
      form.setValue('pickup_address', prevDelivery);
      form.setValue('delivery_address', prevPickup);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="mission_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de mission</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="RES">RES</SelectItem>
                    <SelectItem value="LIV">LIV</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Sélectionnez le type de mission.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {profile?.role === 'admin' && (
            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select onValueChange={handleClientChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>{client.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Sélectionnez le client pour cette mission.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            )}
          )}
        </div>

        <Separator className="my-4" />

        <h3 className="text-lg font-medium">Informations de départ</h3>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="pickup_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse de départ</FormLabel>
                <AddressAutocomplete
                  value={pickupAddress}
                  onChange={setPickupAddress}
                  onSelect={handlePickupAddressSelect}
                  placeholder="Recherchez une adresse..."
                  className="w-full"
                  error={form.formState.errors.pickup_address?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-center my-2">
          {/* Bouton échange */}
          <button
            type="button"
            aria-label="Échanger les adresses"
            onClick={handleSwapAddresses}
            className="bg-white border border-gray-200 rounded-full shadow hover:bg-gray-50 p-2 transition-colors"
          >
            <X className="h-5 w-5 rotate-90 text-gray-500" /> {/* À remplacer par une vraie icône swap */}
          </button>
        </div>

        <h3 className="text-lg font-medium">Informations de livraison</h3>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="delivery_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adresse de livraison</FormLabel>
                <AddressAutocomplete
                  value={deliveryAddress}
                  onChange={setDeliveryAddress}
                  onSelect={handleDeliveryAddressSelect}
                  placeholder="Recherchez une adresse..."
                  className="w-full"
                  error={form.formState.errors.delivery_address?.message}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pickup_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du contact de départ</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_contact_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom du contact de livraison</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Smith" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pickup_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone du contact de départ</FormLabel>
                <FormControl>
                  <Input placeholder="+33 6 12 34 56 78" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone du contact de livraison</FormLabel>
                <FormControl>
                  <Input placeholder="+33 6 98 76 54 32" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="pickup_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de départ</FormLabel>
                <DatePicker
                  onSelect={field.onChange}
                  defaultMonth={field.value}
                  mode="single"
                  className="rounded-md border"
                />
                <FormDescription>
                  Sélectionnez la date de départ.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="delivery_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de livraison</FormLabel>
                <DatePicker
                  onSelect={field.onChange}
                  defaultMonth={field.value}
                  mode="single"
                  className="rounded-md border"
                />
                <FormDescription>
                  Sélectionnez la date de livraison.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <h3 className="text-lg font-medium">Informations sur le colis</h3>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="number_of_packages"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de colis</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="1"
                    {...field}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        field.onChange(value);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="vehicle_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de véhicule</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CAR">Voiture</SelectItem>
                    <SelectItem value="VAN">Fourgonnette</SelectItem>
                    <SelectItem value="TRUCK">Camion</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Sélectionnez le type de véhicule.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="package_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description du colis</FormLabel>
                <FormControl>
                  <Textarea placeholder="Décrivez le contenu du colis..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="is_urgent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Livraison Urgente</FormLabel>
                  <FormDescription>
                    Cochez si la livraison est urgente.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_fragile"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Colis Fragile</FormLabel>
                  <FormDescription>
                    Cochez si le colis est fragile.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6">
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ajouter des notes..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-4" />

        <h3 className="text-lg font-medium">Pièces jointes</h3>
        <MissionAttachments />

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isLoading || !isFormDirty}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateMissionForm;
