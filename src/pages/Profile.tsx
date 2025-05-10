
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
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
import { Address } from '@/types/supabase';
import { Loader2, Save } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// Helper function to convert JSON to Address
function jsonToAddress(json: Json | null): Address {
  if (!json) return {
    formatted_address: '',
    street: '',
    city: '',
    postal_code: '',
    country: 'France'
  };
  
  // Handle if json is an array
  if (Array.isArray(json)) {
    return {
      formatted_address: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    };
  }
  
  // Make sure json is an object and not a string/number/boolean
  if (typeof json !== 'object' || json === null) {
    return {
      formatted_address: '',
      street: '',
      city: '',
      postal_code: '',
      country: 'France'
    };
  }
  
  // Now we know json is an object, we can safely access its properties
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
  tva_applicable: z.boolean().optional(),
  // Adresse de facturation
  street: z.string().optional(),
  city: z.string().optional(),
  postal_code: z.string().optional(),
  country: z.string().default('France'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [addressInput, setAddressInput] = useState('');

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
    },
  });

  // Remplir le formulaire avec les données du profil quand elles sont disponibles
  useEffect(() => {
    if (profile) {
      // Convert billing_address from Json to Address type
      const billingAddress = jsonToAddress(profile.billing_address);
      
      // Set the formatted address for the autocomplete input
      setAddressInput(billingAddress.formatted_address || '');
      
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        company_name: profile.company_name || '',
        phone_1: profile.phone_1 || '',
        phone_2: profile.phone_2 || '',
        siret: profile.siret || '',
        tva_number: profile.tva_number || '',
        tva_applicable: profile.tva_applicable || false,
        street: billingAddress.street || '',
        city: billingAddress.city || '',
        postal_code: billingAddress.postal_code || '',
        country: billingAddress.country || 'France',
      });
    }
  }, [profile, form]);

  // Handle address selection from Google Maps autocomplete
  const handleAddressSelect = (address: string, placeId: string, addressData?: any) => {
    // Update the form fields with the selected address data
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
        tva_applicable: data.tva_applicable,
        billing_address: billingAddress as any, // Type assertion to handle Json conversion
      };

      // Appeler la fonction de mise à jour du profil
      await updateProfile(updateData);
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setIsLoading(false);
    }
  };

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
                    disabled={isLoading}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
