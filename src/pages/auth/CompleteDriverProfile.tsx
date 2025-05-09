
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AddressMap from '@/components/AddressMap';
import { useAuth } from '@/hooks/useAuth';
import { formatSiret } from '@/utils/validation';

// Schema de validation pour la première étape du profil chauffeur (informations de base)
const driverBasicProfileSchema = z.object({
  companyName: z.string().min(2, { message: 'Le nom de la société est requis' }),
  fullName: z.string().min(2, { message: 'Le nom complet est requis' }),
  billingAddress: z.string().min(5, { message: "L'adresse de facturation est requise" }),
  placeId: z.string().optional(),
  siret: z.string().refine(val => /^\d{14}$/.test(val.replace(/\s/g, '')), {
    message: 'Le SIRET doit contenir exactement 14 chiffres',
  }),
  tvaApplicable: z.boolean(),
  tvaNumb: z.string().optional(),
  phone1: z.string().refine(val => /^\+\d{1,4}\s?\d{6,14}$/.test(val.replace(/\s/g, '')), {
    message: 'Veuillez entrer un numéro de téléphone international valide',
  }),
  phone2: z.string().optional(),
});

type FormData = z.infer<typeof driverBasicProfileSchema>;

export default function CompleteDriverProfile() {
  const [mapCoords, setMapCoords] = useState<{lat: number; lng: number}>({ lat: 48.8566, lng: 2.3522 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeDriverBasicProfile, profile } = useAuth();
  const [formInitialized, setFormInitialized] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(driverBasicProfileSchema),
    defaultValues: {
      companyName: '',
      fullName: '',
      billingAddress: '',
      placeId: '',
      siret: '',
      tvaApplicable: false,
      tvaNumb: '',
      phone1: '',
      phone2: '',
    },
  });

  // S'assurer que les valeurs du formulaire sont mises à jour quand le profil est chargé
  useEffect(() => {
    if (profile && !formInitialized) {
      console.log("Setting form values from profile:", profile);
      
      form.setValue('companyName', profile.company_name || '');
      form.setValue('fullName', profile.full_name || '');
      form.setValue('siret', profile.siret || '');
      form.setValue('tvaApplicable', profile.tva_applicable || false);
      form.setValue('tvaNumb', profile.tva_number || '');
      form.setValue('phone1', profile.phone_1 || '');
      form.setValue('phone2', profile.phone_2 || '');
      
      // Définir une adresse par défaut si elle est disponible
      if (profile.billing_address && typeof profile.billing_address === 'object') {
        const address = profile.billing_address.formatted_address || '';
        
        if (address) {
          form.setValue('billingAddress', address);
          
          // Si on a aussi les coordonnées, mettre à jour la carte
          if (profile.billing_address.lat && profile.billing_address.lng) {
            setMapCoords({
              lat: profile.billing_address.lat,
              lng: profile.billing_address.lng
            });
          }
        }
      }
      
      setFormInitialized(true);
    }
  }, [profile, form, formInitialized]);
  
  const onAddressSelect = async (address: string, placeId: string) => {
    console.log("Address selected:", address, "placeId:", placeId);
    form.setValue('billingAddress', address);
    form.setValue('placeId', placeId);
    
    // Simuler l'obtention des coordonnées depuis l'API Google Maps
    setMapCoords({
      lat: 48.8566 + Math.random() * 0.01,
      lng: 2.3522 + Math.random() * 0.01,
    });
  };

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSiret(e.target.value);
    form.setValue('siret', formatted);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting driver basic profile data:", data);
      
      // S'assurer que billingAddress est non vide
      if (!data.billingAddress) {
        toast.error("L'adresse de facturation est obligatoire");
        setIsSubmitting(false);
        return;
      }
      
      // Préparer les données pour l'envoi
      const billingAddress = {
        street: data.billingAddress,
        city: "Paris", // Valeur par défaut si l'API ne retourne pas la ville
        postal_code: "75000", // Valeur par défaut si l'API ne retourne pas le code postal
        country: "France", // Valeur par défaut si l'API ne retourne pas le pays
        formatted_address: data.billingAddress,
        lat: mapCoords.lat,
        lng: mapCoords.lng
      };
      
      console.log("Formatted address data:", billingAddress);
      
      try {
        await completeDriverBasicProfile({
          companyName: data.companyName,
          fullName: data.fullName,
          billingAddress,
          siret: data.siret.replace(/\s/g, ''),
          tvaApplicable: data.tvaApplicable,
          tvaNumb: data.tvaApplicable && data.tvaNumb ? data.tvaNumb : undefined,
          phone1: data.phone1,
          phone2: data.phone2 || undefined,
          documents: undefined
        });
        
        toast.success("Première étape complétée avec succès!");
        // Redirect to the next step
        window.location.href = '/complete-driver-config';
        
      } catch (error: any) {
        console.error("Error submitting driver profile:", error);
        toast.error(`Erreur lors de la création du profil: ${error.message || 'Erreur inconnue'}`);
      }
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(`Erreur lors de la soumission du formulaire: ${error.message || 'Vérifiez les champs'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Débogage des valeurs du formulaire
  console.log("Current form values:", form.getValues());
  console.log("Form errors:", form.formState.errors);

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Compléter votre profil chauffeur</CardTitle>
              <CardDescription>
                Étape 1/2 : Informations professionnelles de base
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informations personnelles</h3>
                    
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
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informations de l'entreprise</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
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
                      
                      {/* TVA Applicable */}
                      <FormField
                        control={form.control}
                        name="tvaApplicable"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                              <FormLabel>TVA Applicable?</FormLabel>
                              <FormDescription>
                                Sélectionnez si vous devez facturer la TVA
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Numéro TVA - conditionnel */}
                      {form.watch('tvaApplicable') && (
                        <FormField
                          control={form.control}
                          name="tvaNumb"
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
                      )}
                      
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
                        <span>Enregistrement en cours...</span>
                      </div>
                    ) : (
                      'Continuer à l\'étape suivante'
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
