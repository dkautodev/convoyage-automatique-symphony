
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useDriverConfig } from '@/hooks/useDriverConfig';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Address } from '@/types/supabase';
import { Loader2, Save } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import DocumentsSection from '@/components/dashboard/driver/DocumentsSection';

// Helper function to convert JSON to Address
function jsonToAddress(json: Json | null): Address {
  if (!json) return {
    formatted_address: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'France'
  };
  
  if (Array.isArray(json)) {
    return {
      formatted_address: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    };
  }
  
  if (typeof json !== 'object' || json === null) {
    return {
      formatted_address: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    };
  }
  
  const jsonObj = json as Record<string, Json>;
  
  return {
    formatted_address: typeof jsonObj.formatted_address === 'string' ? jsonObj.formatted_address : '',
    street: typeof jsonObj.street === 'string' ? jsonObj.street : '',
    city: typeof jsonObj.city === 'string' ? jsonObj.city : '',
    postal_code: typeof jsonObj.postal_code === 'string' ? jsonObj.postal_code : '',
    country: typeof jsonObj.country === 'string' ? jsonObj.country : 'France',
    place_id: typeof jsonObj.place_id === 'string' ? jsonObj.place_id : undefined,
    lat: typeof jsonObj.lat === 'number' ? jsonObj.lat : undefined,
    lng: typeof jsonObj.lng === 'number' ? jsonObj.lng : undefined
  };
}

// Définition du schéma de validation pour le formulaire
const profileSchema = z.object({
  full_name: z.string().min(2, { message: 'Le nom complet doit contenir au moins 2 caractères' }),
  email: z.string().email({ message: 'Email invalide' }).optional(),
  company_name: z.string().optional(),
  phone_1: z.string().optional(),
  phone_2: z.string().optional(),
  siret: z.string().optional(),
  tva_number: z.string().optional(),
  // Adresse de facturation
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('France'),
  // Champs spécifiques aux chauffeurs
  license_number: z.string().optional(),
  id_number: z.string().optional(),
  legal_status: z.enum(['EI', 'EURL', 'SARL', 'SA', 'SAS', 'SASU', 'SNC', 'Scop', 'Association']).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const legalStatusLabels = {
  'EI': 'Entreprise individuelle',
  'EURL': 'Entreprise unipersonnelle à responsabilité limitée',
  'SARL': 'Société à responsabilité limitée',
  'SA': 'Société anonyme',
  'SAS': 'Société par actions simplifiée',
  'SASU': 'Société par actions simplifiée unipersonnelle',
  'SNC': 'Société en nom collectif',
  'Scop': 'Société coopérative de production',
  'Association': 'Association'
};

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const { updateDriverConfig, getDriverConfig, loading: driverConfigLoading } = useDriverConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [driverConfig, setDriverConfig] = useState<any>(null);

  // Initialiser le formulaire avec React Hook Form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      company_name: '',
      phone_1: '',
      phone_2: '',
      siret: '',
      tva_number: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France',
      license_number: '',
      id_number: '',
      legal_status: 'EI',
    },
  });

  // Charger la configuration du chauffeur
  useEffect(() => {
    const loadDriverConfig = async () => {
      if (profile && profile.role === 'chauffeur') {
        try {
          const config = await getDriverConfig(profile.id);
          setDriverConfig(config);
          
          if (config) {
            form.setValue('license_number', config.license_number || '');
            form.setValue('id_number', config.id_number || '');
            form.setValue('legal_status', config.legal_status || 'EI');
          }
        } catch (error) {
          console.error('Error loading driver config:', error);
        }
      }
    };

    loadDriverConfig();
  }, [profile, getDriverConfig, form]);

  // Remplir le formulaire avec les données du profil quand elles sont disponibles
  useEffect(() => {
    if (profile) {
      const billingAddress = jsonToAddress(profile.billing_address);
      
      setAddressInput(billingAddress.formatted_address || '');
      
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        company_name: profile.company_name || '',
        phone_1: profile.phone_1 || '',
        phone_2: profile.phone_2 || '',
        siret: profile.siret || '',
        tva_number: profile.tva_number || '',
        street: billingAddress.street || '',
        city: billingAddress.city || '',
        postal_code: billingAddress.postal_code || '',
        country: billingAddress.country || 'France',
        license_number: driverConfig?.license_number || '',
        id_number: driverConfig?.id_number || '',
        legal_status: driverConfig?.legal_status || 'EI',
      });
    }
  }, [profile, driverConfig, form]);

  // Handle address selection from Google Maps autocomplete
  const handleAddressSelect = (address: string, placeId: string, addressData?: any) => {
    if (addressData && addressData.extracted_data) {
      form.setValue('street', addressData.extracted_data.street);
      form.setValue('city', addressData.extracted_data.city);
      form.setValue('postal_code', addressData.extracted_data.postal_code);
      form.setValue('country', addressData.extracted_data.country);
    }
  };

  // Fonction de soumission du formulaire
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);

      if (!profile) {
        toast.error('Profil utilisateur non trouvé');
        return;
      }

      // Construire l'objet d'adresse
      const billingAddress: Address = {
        formatted_address: addressInput || `${data.street || ''}, ${data.postal_code || ''} ${data.city || ''}, ${data.country || 'France'}`,
        street: data.street || '',
        city: data.city || '',
        postal_code: data.postal_code || '',
        country: data.country || 'France',
      };

      // Préparer les données à mettre à jour
      const updateData = {
        full_name: data.full_name,
        company_name: data.company_name,
        phone_1: data.phone_1,
        phone_2: data.phone_2,
        siret: data.siret,
        tva_number: data.tva_number,
        billing_address: billingAddress as any,
      };

      // Appeler la fonction de mise à jour du profil
      await updateProfile(updateData);

      // Si c'est un chauffeur, mettre à jour aussi la configuration driver
      if (profile.role === 'chauffeur') {
        try {
          await updateDriverConfig(profile.id, {
            license_number: data.license_number,
            id_number: data.id_number,
            legal_status: data.legal_status,
          });
        } catch (driverError: any) {
          console.error('Error updating driver config:', driverError);
          toast.warning('Profil mis à jour mais erreur lors de la sauvegarde des informations chauffeur');
          return;
        }
      }

      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isDriver = profile?.role === 'chauffeur';

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations Personnelles</CardTitle>
            <CardDescription>
              Mettez à jour vos informations personnelles et coordonnées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="john.doe@example.com" 
                            {...field} 
                            disabled 
                          />
                        </FormControl>
                        <FormDescription>
                          L'email ne peut pas être modifié
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="phone_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone principal</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 6 12 34 56 78" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Téléphone secondaire</FormLabel>
                        <FormControl>
                          <Input placeholder="+33 6 98 76 54 32" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium">Informations Entreprise</h3>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom de l'entreprise</FormLabel>
                        <FormControl>
                          <Input placeholder="Entreprise SAS" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="siret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro SIRET</FormLabel>
                        <FormControl>
                          <Input placeholder="12345678901234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {isDriver && (
                  <>
                    <Separator className="my-4" />
                    <h3 className="text-lg font-medium">Configuration Chauffeur</h3>
                    
                    <div className="grid gap-6 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="legal_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Statut juridique</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez votre statut juridique" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(legalStatusLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="license_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de permis</FormLabel>
                            <FormControl>
                              <Input placeholder="12AB34567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid gap-6 sm:grid-cols-1">
                      <FormField
                        control={form.control}
                        name="id_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro document d'identité</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789012" {...field} />
                            </FormControl>
                            <FormDescription>
                              Numéro de carte d'identité ou de passeport
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tva_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro TVA</FormLabel>
                        <FormControl>
                          <Input placeholder="FR12345678901" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-4" />
                
                <h3 className="text-lg font-medium">Adresse de facturation</h3>
                
                <div className="grid gap-6">
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <AddressAutocomplete
                      value={addressInput}
                      onChange={setAddressInput}
                      onSelect={handleAddressSelect}
                      placeholder="Recherchez une adresse..."
                      className="w-full"
                      error={form.formState.errors.street?.message}
                    />
                  </FormItem>
                </div>

                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rue</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Rue de la Paix" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading || driverConfigLoading}
                    className="w-full sm:w-auto"
                  >
                    {(isLoading || driverConfigLoading) ? (
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
          </CardContent>
        </Card>
        
        {/* Ajout de la section Documents pour les chauffeurs */}
        {isDriver && <DocumentsSection />}
      </div>
    </div>
  );
};

export default Profile;
