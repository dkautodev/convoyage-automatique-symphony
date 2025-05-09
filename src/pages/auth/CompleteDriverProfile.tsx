
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
import { useAuth } from '@/hooks/useAuth';
import { formatSiret } from '@/utils/validation';
import AddressAutocomplete from '@/components/AddressAutocomplete';

// Schema de validation pour le profil chauffeur
const driverProfileSchema = z.object({
  fullName: z.string().min(2, { message: 'Le nom complet est requis' }),
  companyName: z.string().min(2, { message: 'Le nom de la société est requis' }),
  billingAddress: z.string().min(5, { message: "L'adresse de facturation est requise" }),
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

type FormData = z.infer<typeof driverProfileSchema>;

export default function CompleteDriverProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeDriverProfile, profile } = useAuth();
  const [formInitialized, setFormInitialized] = useState(false);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<{
    street: string;
    city: string;
    postal_code: string;
    country: string;
    formatted_address: string;
  } | null>(null);
  const navigate = useNavigate();
  
  const form = useForm<FormData>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      fullName: '',
      companyName: '',
      billingAddress: '',
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
      
      form.setValue('fullName', profile.full_name || '');
      form.setValue('companyName', profile.company_name || '');
      
      // Set billing address if available
      if (profile.billing_address) {
        const address = profile.billing_address as any;
        const formattedAddress = address.formatted_address || 
          `${address.street}, ${address.postal_code} ${address.city}, ${address.country}`;
        form.setValue('billingAddress', formattedAddress);
      }
      
      form.setValue('siret', profile.siret || '');
      form.setValue('tvaApplicable', false); // Par défaut à false car la colonne n'existe pas
      form.setValue('tvaNumb', profile.tva_number || '');
      form.setValue('phone1', profile.phone_1 || '');
      form.setValue('phone2', profile.phone_2 || '');
      
      setFormInitialized(true);
    }
  }, [profile, form, formInitialized]);

  const handleSiretChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSiret(e.target.value);
    form.setValue('siret', formatted);
  };
  
  const handleSelectAddress = (address: string, selectedPlaceId: string) => {
    setPlaceId(selectedPlaceId);
    
    // Extraire les composants de l'adresse
    const parts = address.split(',');
    
    // Essayer de parser l'adresse
    let street = parts[0]?.trim() || "";
    let postalCode = "";
    let city = "";
    let country = "France";
    
    if (parts.length > 1) {
      const cityPart = parts[1]?.trim().split(' ');
      postalCode = cityPart[0] || "";
      city = cityPart.slice(1).join(' ') || "";
    }
    
    if (parts.length > 2) {
      country = parts[2]?.trim() || "France";
    }
    
    setSelectedAddress({
      street,
      city,
      postal_code: postalCode,
      country,
      formatted_address: address
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting driver profile data:", data);
      
      try {
        // Simplifier la structure des données envoyées pour correspondre au nouveau format d'inscription
        await completeDriverProfile({
          fullName: data.fullName,
          companyName: data.companyName,
          billingAddress: selectedAddress || {
            street: data.billingAddress.split(',')[0] || "",
            city: data.billingAddress.split(',')[1]?.trim().split(' ')[1] || "",
            postal_code: data.billingAddress.split(',')[1]?.trim().split(' ')[0] || "",
            country: data.billingAddress.split(',')[2]?.trim() || "France",
            formatted_address: data.billingAddress
          },
          siret: data.siret.replace(/\s/g, ''),
          tvaApplicable: data.tvaApplicable,
          tvaNumb: data.tvaApplicable && data.tvaNumb ? data.tvaNumb : undefined,
          phone1: data.phone1,
          phone2: data.phone2 || undefined,
        });
        
        toast.success("Profil complété avec succès!");
        // Redirection vers le tableau de bord
        navigate('/driver/dashboard');
        
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

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Compléter votre profil chauffeur</CardTitle>
              <CardDescription>
                Renseignez vos informations professionnelles
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
                      
                      {/* Adresse de facturation */}
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
                                onSelect={handleSelectAddress}
                                placeholder="123 rue du Commerce, 75001 Paris, France"
                                error={form.formState.errors.billingAddress?.message}
                              />
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
