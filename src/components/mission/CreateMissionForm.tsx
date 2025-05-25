import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, Calculator, Loader2, RotateCcw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { typedSupabase } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { VehicleCategory, vehicleCategoryLabels, Mission } from '@/types/supabase';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import ContactSelector from '@/components/mission/ContactSelector';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  vehicleCategory: z.string().refine((val) => Object.keys(vehicleCategoryLabels).includes(val), {
    message: "Veuillez sélectionner une catégorie de véhicule valide.",
  }),
  pickupAddress: z.string().min(2, {
    message: "L'adresse de prise en charge est requise.",
  }),
  deliveryAddress: z.string().min(2, {
    message: "L'adresse de livraison est requise.",
  }),
  D1_PEC: z.date({
    required_error: "La date de prise en charge est requise.",
  }),
  D2_LIV: z.date().optional(),
  H1_PEC: z.string().optional(),
  H2_PEC: z.string().optional(),
  H1_LIV: z.string().optional(),
  H2_LIV: z.string().optional(),
  contactPickupName: z.string().optional(),
  contactPickupPhone: z.string().optional(),
  contactPickupEmail: z.string().optional(),
  contactDeliveryName: z.string().optional(),
  contactDeliveryPhone: z.string().optional(),
  contactDeliveryEmail: z.string().optional(),
  vehicleMake: z.string().optional(),
  vehicleModel: z.string().optional(),
  vehicleRegistration: z.string().optional(),
  vehicleFuel: z.string().optional(),
  vehicleYear: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? undefined : parsed;
  }),
  vehicleVin: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateMissionFormProps {
  onSuccess?: (missionId: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  livMission?: Mission | null;
}

export default function CreateMissionForm({ onSuccess, onDirtyChange, livMission }: CreateMissionFormProps) {
  const { profile } = useAuth();
  const { computePrice, prices, loading: pricingLoading } = usePricing();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);
  const [pickupAddressData, setPickupAddressData] = useState<any>(null);
  const [deliveryAddressData, setDeliveryAddressData] = useState<any>(null);
  
  const [isResMode, setIsResMode] = useState(!!livMission);
  const [allowVehicleChange, setAllowVehicleChange] = useState(false);
  const [allowAddressChange, setAllowAddressChange] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vehicleCategory: 'citadine',
      pickupAddress: '',
      deliveryAddress: '',
      D1_PEC: new Date(),
      D2_LIV: new Date(),
      H1_PEC: '',
      H2_PEC: '',
      H1_LIV: '',
      H2_LIV: '',
      contactPickupName: '',
      contactPickupPhone: '',
      contactPickupEmail: '',
      contactDeliveryName: '',
      contactDeliveryPhone: '',
      contactDeliveryEmail: '',
      vehicleMake: '',
      vehicleModel: '',
      vehicleRegistration: '',
      vehicleFuel: '',
      vehicleYear: undefined,
      vehicleVin: '',
      notes: '',
    },
  });

  const { watch, setValue, formState: { isDirty } } = form;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Fonction pour inverser les adresses
  const invertAddresses = () => {
    if (!livMission) return;
    
    const currentPickup = form.getValues('pickupAddress');
    const currentDelivery = form.getValues('deliveryAddress');
    
    // Inverser les adresses
    const deliveryAddr = livMission.delivery_address as any;
    const pickupAddr = livMission.pickup_address as any;
    
    form.setValue('pickupAddress', deliveryAddr?.formatted_address || '');
    form.setValue('deliveryAddress', pickupAddr?.formatted_address || '');
    
    // Stocker les données d'adresse inversées
    if (livMission.delivery_address) {
      setPickupAddressData(livMission.delivery_address);
    }
    if (livMission.pickup_address) {
      setDeliveryAddressData(livMission.pickup_address);
    }
  };

  // Fonction pour vider les champs d'adresse
  const clearAddresses = () => {
    form.setValue('pickupAddress', '');
    form.setValue('deliveryAddress', '');
    setPickupAddressData(null);
    setDeliveryAddressData(null);
  };

  // Fonction pour inverser les contacts
  const invertContacts = () => {
    if (!livMission) return;
    
    // Inverser les contacts de prise en charge et de livraison
    form.setValue('contactPickupName', livMission.contact_delivery_name || '');
    form.setValue('contactPickupPhone', livMission.contact_delivery_phone || '');
    form.setValue('contactPickupEmail', livMission.contact_delivery_email || '');
    
    form.setValue('contactDeliveryName', livMission.contact_pickup_name || '');
    form.setValue('contactDeliveryPhone', livMission.contact_pickup_phone || '');
    form.setValue('contactDeliveryEmail', livMission.contact_pickup_email || '');
  };

  // Fonction pour vider les contacts
  const clearContacts = () => {
    form.setValue('contactPickupName', '');
    form.setValue('contactPickupPhone', '');
    form.setValue('contactPickupEmail', '');
    form.setValue('contactDeliveryName', '');
    form.setValue('contactDeliveryPhone', '');
    form.setValue('contactDeliveryEmail', '');
  };

  // Initialisation pour les missions RES
  useEffect(() => {
    if (livMission && isResMode) {
      // Pré-remplir automatiquement avec les données inversées
      invertAddresses();
      invertContacts();
      
      // Définir la catégorie de véhicule par défaut
      if (livMission.vehicle_category) {
        form.setValue('vehicleCategory', livMission.vehicle_category);
      }
      
      // Verrouiller la date de prise en charge sur la date de livraison de la LIV
      if (livMission.D2_LIV) {
        const livDeliveryDate = new Date(livMission.D2_LIV as string);
        form.setValue('D1_PEC', livDeliveryDate);
      }
      
      // Verrouiller les créneaux de prise en charge sur les créneaux de livraison de la LIV
      if (livMission.H1_LIV) {
        form.setValue('H1_PEC', livMission.H1_LIV as string);
      }
      if (livMission.H2_LIV) {
        form.setValue('H2_PEC', livMission.H2_LIV as string);
      }
    }
  }, [livMission, isResMode, form]);

  useEffect(() => {
    const pickup = watch('pickupAddress');
    const delivery = watch('deliveryAddress');
    const vehicleType = watch('vehicleCategory');

    if (pickupAddressData && deliveryAddressData && vehicleType) {
      // Calculer la distance entre les deux adresses
      const distance = calculateDistance(
        pickupAddressData.geometry.location.lat(),
        pickupAddressData.geometry.location.lng(),
        deliveryAddressData.geometry.location.lat(),
        deliveryAddressData.geometry.location.lng()
      );
      setCalculatedDistance(distance);

      // Calculer le prix estimé
      computePrice(distance, vehicleType as VehicleCategory);
    } else {
      setCalculatedDistance(null);
    }
  }, [watch('pickupAddress'), watch('deliveryAddress'), watch('vehicleCategory'), pickupAddressData, deliveryAddressData, computePrice]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);

      if (!pickupAddressData || !deliveryAddressData) {
        toast.error('Veuillez sélectionner des adresses valides.');
        return;
      }

      // Calculer le prix avec remise de 30% pour les missions RES
      let finalPriceHT = prices?.priceHT || 0;
      let finalPriceTTC = prices?.priceTTC || 0;
      
      if (isResMode && livMission) {
        finalPriceHT = finalPriceHT * 0.7; // Remise de 30%
        finalPriceTTC = finalPriceTTC * 0.7; // Remise de 30%
      }

      const missionData = {
        client_id: profile?.id!,
        status: 'en_acceptation' as const,
        pickup_address: pickupAddressData,
        delivery_address: deliveryAddressData,
        distance_km: calculatedDistance!,
        price_ht: finalPriceHT,
        price_ttc: finalPriceTTC,
        vat_rate: 20,
        scheduled_date: data.D1_PEC.toISOString(),
        created_by: profile?.id!,
        mission_type: isResMode ? 'RES' : 'LIV',
        vehicle_category: data.vehicleCategory as VehicleCategory,
        vehicle_make: data.vehicleMake || null,
        vehicle_model: data.vehicleModel || null,
        vehicle_registration: data.vehicleRegistration || null,
        vehicle_fuel: data.vehicleFuel || null,
        vehicle_year: data.vehicleYear || null,
        vehicle_vin: data.vehicleVin || null,
        vehicle_id: prices?.vehicleId || null,
        notes: data.notes || null,
        D1_PEC: data.D1_PEC ? format(data.D1_PEC, 'yyyy-MM-dd') : null,
        D2_LIV: data.D2_LIV ? format(data.D2_LIV, 'yyyy-MM-dd') : null,
        H1_PEC: data.H1_PEC || null,
        H1_LIV: data.H1_LIV || null,
        H2_PEC: data.H2_PEC || null,
        H2_LIV: data.H2_LIV || null,
        contact_pickup_name: data.contactPickupName || null,
        contact_pickup_phone: data.contactPickupPhone || null,
        contact_pickup_email: data.contactPickupEmail || null,
        contact_delivery_name: data.contactDeliveryName || null,
        contact_delivery_phone: data.contactDeliveryPhone || null,
        contact_delivery_email: data.contactDeliveryEmail || null,
        linked_mission_id: isResMode ? livMission?.id : null,
        is_linked: isResMode
      };

      const { data: mission, error } = await typedSupabase
        .from('missions')
        .insert(missionData)
        .select()
        .single();

      if (error) throw error;

      // Si c'est une mission RES, mettre à jour la mission LIV pour indiquer qu'elle est liée
      if (isResMode && livMission && mission) {
        const { error: updateError } = await typedSupabase
          .from('missions')
          .update({ 
            linked_mission_id: mission.id,
            is_linked: true 
          })
          .eq('id', livMission.id);

        if (updateError) {
          console.error('Erreur lors de la mise à jour de la mission LIV:', updateError);
        }
      }

      toast.success(
        isResMode 
          ? 'Mission de restitution créée avec succès!' 
          : 'Mission créée avec succès!'
      );
      
      if (onSuccess && mission?.id) {
        onSuccess(mission.id);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section spéciale pour les missions RES */}
      {isResMode && livMission && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Options de restitution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllowVehicleChange(!allowVehicleChange)}
                className={allowVehicleChange ? 'bg-green-100' : ''}
              >
                {allowVehicleChange ? 'Verrouiller' : 'Changer'} catégorie véhicule
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAllowAddressChange(!allowAddressChange)}
                className={allowAddressChange ? 'bg-green-100' : ''}
              >
                {allowAddressChange ? 'Verrouiller' : 'Modifier'} adresses
              </Button>
              
              {allowAddressChange && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={invertAddresses}
                  >
                    Inverser adresses
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAddresses}
                  >
                    Vider adresses
                  </Button>
                </>
              )}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={invertContacts}
              >
                Inverser contacts
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearContacts}
              >
                Vider contacts
              </Button>
            </div>
            
            <div className="text-sm text-blue-600">
              <p><strong>Prix appliqué :</strong> 30% de remise automatique</p>
              <p><strong>Date/créneau PEC :</strong> Verrouillés sur ceux de livraison LIV</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section Catégorie de véhicule */}
        <Card>
          <CardHeader>
            <CardTitle>Catégorie de véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vehicleCategory">Catégorie *</Label>
              <Select
                value={form.watch('vehicleCategory') || ''}
                onValueChange={(value) => form.setValue('vehicleCategory', value)}
                disabled={isResMode && !allowVehicleChange}
              >
                <SelectTrigger className={isResMode && !allowVehicleChange ? 'bg-gray-100' : ''}>
                  <SelectValue placeholder="Sélectionner une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.vehicleCategory && (
                <p className="text-red-500 text-sm mt-1">{form.formState.errors.vehicleCategory.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section Adresses */}
        <Card>
          <CardHeader>
            <CardTitle>Adresses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickupAddress">Adresse de prise en charge *</Label>
              <AddressAutocomplete
                value={form.watch('pickupAddress') || ''}
                onChange={(value) => form.setValue('pickupAddress', value)}
                onSelect={(address, placeId, addressData) => {
                  form.setValue('pickupAddress', address);
                  setPickupAddressData(addressData);
                }}
                placeholder="Entrer l'adresse de prise en charge"
                error={form.formState.errors.pickupAddress?.message}
                disabled={isResMode && !allowAddressChange}
              />
            </div>

            <div>
              <Label htmlFor="deliveryAddress">Adresse de livraison *</Label>
              <AddressAutocomplete
                value={form.watch('deliveryAddress') || ''}
                onChange={(value) => form.setValue('deliveryAddress', value)}
                onSelect={(address, placeId, addressData) => {
                  form.setValue('deliveryAddress', address);
                  setDeliveryAddressData(addressData);
                }}
                placeholder="Entrer l'adresse de livraison"
                error={form.formState.errors.deliveryAddress?.message}
                disabled={isResMode && !allowAddressChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Planification */}
        <Card>
          <CardHeader>
            <CardTitle>Planification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date de prise en charge *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('D1_PEC') && "text-muted-foreground",
                        isResMode && "bg-gray-100 cursor-not-allowed"
                      )}
                      disabled={isResMode}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('D1_PEC') ? (
                        format(form.watch('D1_PEC')!, 'PPP', { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('D1_PEC') || undefined}
                      onSelect={(date) => form.setValue('D1_PEC', date || new Date())}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Date de livraison</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('D2_LIV') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('D2_LIV') ? (
                        format(form.watch('D2_LIV')!, 'PPP', { locale: fr })
                      ) : (
                        <span>Sélectionner une date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={form.watch('D2_LIV') || undefined}
                      onSelect={(date) => form.setValue('D2_LIV', date || undefined)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Créneaux horaires */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="H1_PEC">Créneau PEC début</Label>
                <Input
                  id="H1_PEC"
                  type="time"
                  {...form.register('H1_PEC')}
                  disabled={isResMode}
                  className={isResMode ? 'bg-gray-100' : ''}
                />
              </div>
              <div>
                <Label htmlFor="H2_PEC">Créneau PEC fin</Label>
                <Input
                  id="H2_PEC"
                  type="time"
                  {...form.register('H2_PEC')}
                  disabled={isResMode}
                  className={isResMode ? 'bg-gray-100' : ''}
                />
              </div>
              <div>
                <Label htmlFor="H1_LIV">Créneau LIV début</Label>
                <Input
                  id="H1_LIV"
                  type="time"
                  {...form.register('H1_LIV')}
                />
              </div>
              <div>
                <Label htmlFor="H2_LIV">Créneau LIV fin</Label>
                <Input
                  id="H2_LIV"
                  type="time"
                  {...form.register('H2_LIV')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Contacts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact prise en charge */}
            <div>
              <h4 className="text-sm font-medium mb-3">Contact prise en charge</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactPickupName">Nom</Label>
                  <Input
                    id="contactPickupName"
                    {...form.register('contactPickupName')}
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPickupPhone">Téléphone</Label>
                  <Input
                    id="contactPickupPhone"
                    {...form.register('contactPickupPhone')}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div>
                  <Label htmlFor="contactPickupEmail">Email</Label>
                  <Input
                    id="contactPickupEmail"
                    type="email"
                    {...form.register('contactPickupEmail')}
                    placeholder="Adresse email"
                  />
                </div>
              </div>
            </div>

            {/* Contact livraison */}
            <div>
              <h4 className="text-sm font-medium mb-3">Contact livraison</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="contactDeliveryName">Nom</Label>
                  <Input
                    id="contactDeliveryName"
                    {...form.register('contactDeliveryName')}
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <Label htmlFor="contactDeliveryPhone">Téléphone</Label>
                  <Input
                    id="contactDeliveryPhone"
                    {...form.register('contactDeliveryPhone')}
                    placeholder="Numéro de téléphone"
                  />
                </div>
                <div>
                  <Label htmlFor="contactDeliveryEmail">Email</Label>
                  <Input
                    id="contactDeliveryEmail"
                    type="email"
                    {...form.register('contactDeliveryEmail')}
                    placeholder="Adresse email"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section Détails du véhicule */}
        <Card>
          <CardHeader>
            <CardTitle>Détails du véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicleMake">Marque</Label>
                <Input
                  id="vehicleMake"
                  {...form.register('vehicleMake')}
                  placeholder="Marque du véhicule"
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Modèle</Label>
                <Input
                  id="vehicleModel"
                  {...form.register('vehicleModel')}
                  placeholder="Modèle du véhicule"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleRegistration">Immatriculation</Label>
                <Input
                  id="vehicleRegistration"
                  {...form.register('vehicleRegistration')}
                  placeholder="Numéro d'immatriculation"
                />
              </div>
              <div>
                <Label htmlFor="vehicleFuel">Carburant</Label>
                <Input
                  id="vehicleFuel"
                  {...form.register('vehicleFuel')}
                  placeholder="Type de carburant"
                />
              </div>
              <div>
                <Label htmlFor="vehicleYear">Année</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  {...form.register('vehicleYear')}
                  placeholder="Année de fabrication"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="vehicleVin">Numéro VIN</Label>
              <Input
                id="vehicleVin"
                {...form.register('vehicleVin')}
                placeholder="Numéro d'identification du véhicule"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Informations complémentaires</Label>
              <Textarea
                id="notes"
                placeholder="Ajouter des notes ou informations importantes"
                {...form.register('notes')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section Prix */}
        {prices && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Estimation tarifaire
                {isResMode && <Badge variant="secondary">30% de remise appliquée</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix HT</Label>
                  <div className="text-2xl font-bold">
                    {isResMode ? (prices.priceHT * 0.7).toFixed(2) : prices.priceHT.toFixed(2)} €
                  </div>
                </div>
                <div>
                  <Label>Prix TTC</Label>
                  <div className="text-2xl font-bold">
                    {isResMode ? (prices.priceTTC * 0.7).toFixed(2) : prices.priceTTC.toFixed(2)} €
                  </div>
                </div>
              </div>
              {calculatedDistance && (
                <p className="text-sm text-gray-600 mt-2">
                  Distance estimée: {calculatedDistance.toFixed(1)} km
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          <Button
            type="submit"
            disabled={isSubmitting || pricingLoading || !prices}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              `Créer la mission${isResMode ? ' RES' : ''}`
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// Function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180)
}
