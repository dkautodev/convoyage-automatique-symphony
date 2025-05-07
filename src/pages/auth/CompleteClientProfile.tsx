
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AddressMap from '@/components/AddressMap';
import { useAuth } from '@/hooks/useAuth';
import { formatSiret } from '@/utils/validation';

const clientProfileSchema = z.object({
  companyName: z.string().min(2, { message: 'Le nom de la société est requis' }),
  fullName: z.string().min(2, { message: 'Le nom complet est requis' }),
  billingAddress: z.string().min(5, { message: "L'adresse de facturation est requise" }),
  placeId: z.string().optional(),
  siret: z.string().refine(val => /^\d{14}$/.test(val.replace(/\s/g, '')), {
    message: 'Le SIRET doit contenir exactement 14 chiffres',
  }),
  tvaNumb: z.string().optional(),
  phone1: z.string().refine(val => /^\+\d{1,4}\s?\d{6,14}$/.test(val.replace(/\s/g, '')), {
    message: 'Veuillez entrer un numéro de téléphone international valide',
  }),
  phone2: z.string().optional(),
});

type FormData = z.infer<typeof clientProfileSchema>;

export default function CompleteClientProfile() {
  const [mapCoords, setMapCoords] = useState<{lat: number; lng: number} | null>(null);
  const [addressDetails, setAddressDetails] = useState<{
    city: string;
    postal_code: string;
    country: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeClientProfile, profile } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(clientProfileSchema),
    defaultValues: {
      companyName: '',
      fullName: profile?.full_name || '',
      billingAddress: '',
      placeId: '',
      siret: '',
      tvaNumb: '',
      phone1: '',
      phone2: '',
    },
  });
  
  const onAddressSelect = async (address: string, placeId: string) => {
    form.setValue('billingAddress', address);
    form.setValue('placeId', placeId);
    
    // Utiliser l'API Google Maps pour récupérer les coordonnées
    if (window.google && placeId) {
      try {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ placeId }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            const coords = {
              lat: location.lat(),
              lng: location.lng()
            };
            setMapCoords(coords);
            
            // Extraire les détails de l'adresse
            let city = '';
            let postal_code = '';
            let country = '';
            
            results[0].address_components.forEach(component => {
              if (component.types.includes('locality')) {
                city = component.long_name;
              } else if (component.types.includes('postal_code')) {
                postal_code = component.long_name;
              } else if (component.types.includes('country')) {
                country = component.long_name;
              }
            });
            
            setAddressDetails({ city, postal_code, country });
            console.log("Détails d'adresse extraits:", { city, postal_code, country });
          }
        });
      } catch (error) {
        console.error("Erreur lors de la récupération des coordonnées:", error);
      }
    }
  };

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSiret(e.target.value);
    form.setValue('siret', formatted);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      await completeClientProfile({
        companyName: data.companyName,
        fullName: data.fullName,
        billingAddress: {
          street: data.billingAddress,
          city: addressDetails?.city || "",
          postal_code: addressDetails?.postal_code || "",
          country: addressDetails?.country || "",
          formatted_address: data.billingAddress,
          lat: mapCoords?.lat,
          lng: mapCoords?.lng
        },
        siret: data.siret.replace(/\s/g, ''),
        tvaNumb: data.tvaNumb,
        phone1: data.phone1,
        phone2: data.phone2,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Compléter votre profil</CardTitle>
              <CardDescription>
                Renseignez les informations de votre entreprise pour finaliser votre inscription
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Nom complet */}
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom complet</FormLabel>
                          <FormControl>
                            <Input placeholder="Jean Dupont" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Nom de l'entreprise */}
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de l'entreprise</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre Société SAS" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Numéro SIRET */}
                    <FormField
                      control={form.control}
                      name="siret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro SIRET</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123 456 789 00012" 
                              value={field.value}
                              onChange={handleSiretChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Numéro TVA */}
                    <FormField
                      control={form.control}
                      name="tvaNumb"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Numéro TVA (optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="FR12345678901" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Téléphone 1 */}
                    <FormField
                      control={form.control}
                      name="phone1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone (principal)</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 612345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Téléphone 2 */}
                    <FormField
                      control={form.control}
                      name="phone2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone (secondaire - optionnel)</FormLabel>
                          <FormControl>
                            <Input placeholder="+33 612345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {/* Adresse avec carte */}
                  <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse de facturation</FormLabel>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={field.onChange}
                            onSelect={onAddressSelect}
                            placeholder="Commencez à taper votre adresse..."
                            error={form.formState.errors.billingAddress?.message}
                          />
                        </FormControl>
                        {mapCoords && <div className="mt-2">
                          <AddressMap lat={mapCoords.lat} lng={mapCoords.lng} />
                        </div>}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        <span>Finalisation du profil...</span>
                      </div>
                    ) : (
                      'Finaliser mon profil'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
