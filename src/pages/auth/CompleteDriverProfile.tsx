
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import AddressMap from '@/components/AddressMap';
import { useAuth } from '@/hooks/useAuth';
import { formatSiret } from '@/utils/validation';
import { vehicleCategoryLabels } from '@/types/supabase';

// Définir les types acceptés de fichiers
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

// Schema de validation pour le profil chauffeur
const driverProfileSchema = z.object({
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
  licenseNumber: z.string().min(2, { message: 'Le numéro de permis est requis' }),
  idNumber: z.string().min(2, { message: 'Le numéro de CNI/passeport est requis' }),
  vehicleType: z.string(),
  // Document fields
  kbis: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => file && file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .refine(
        file => ACCEPTED_FILE_TYPES['application/pdf'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/jpeg'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/png'].some(ext => file.name.endsWith(ext)),
        { message: 'Format de fichier non supporté' }
      ).optional(),
  driverLicenseFront: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => file && file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .refine(
        file => ACCEPTED_FILE_TYPES['application/pdf'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/jpeg'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/png'].some(ext => file.name.endsWith(ext)),
        { message: 'Format de fichier non supporté' }
      ).optional(),
  driverLicenseBack: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => file && file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .refine(
        file => ACCEPTED_FILE_TYPES['application/pdf'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/jpeg'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/png'].some(ext => file.name.endsWith(ext)),
        { message: 'Format de fichier non supporté' }
      ).optional(),
  vigilanceAttestation: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => file && file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .refine(
        file => ACCEPTED_FILE_TYPES['application/pdf'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/jpeg'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/png'].some(ext => file.name.endsWith(ext)),
        { message: 'Format de fichier non supporté' }
      ).optional(),
  idDocument: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => file && file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .refine(
        file => ACCEPTED_FILE_TYPES['application/pdf'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/jpeg'].some(ext => file.name.endsWith(ext)) || 
                ACCEPTED_FILE_TYPES['image/png'].some(ext => file.name.endsWith(ext)),
        { message: 'Format de fichier non supporté' }
      ).optional(),
});

type FormData = z.infer<typeof driverProfileSchema>;

export default function CompleteDriverProfile() {
  const [mapCoords, setMapCoords] = useState<{lat: number; lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeDriverProfile, profile } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(driverProfileSchema),
    defaultValues: {
      companyName: '',
      fullName: profile?.full_name || '',
      billingAddress: '',
      placeId: '',
      siret: '',
      tvaApplicable: false,
      tvaNumb: '',
      phone1: '',
      phone2: '',
      licenseNumber: '',
      idNumber: '',
      vehicleType: '',
    },
  });
  
  const onAddressSelect = async (address: string, placeId: string) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      form.setValue(fieldName as any, file);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      
      const documents: Record<string, File> = {};
      if (data.kbis) documents.kbis = data.kbis;
      if (data.driverLicenseFront) documents.driverLicenseFront = data.driverLicenseFront;
      if (data.driverLicenseBack) documents.driverLicenseBack = data.driverLicenseBack;
      if (data.vigilanceAttestation) documents.vigilanceAttestation = data.vigilanceAttestation;
      if (data.idDocument) documents.idDocument = data.idDocument;
      
      await completeDriverProfile({
        companyName: data.companyName,
        fullName: data.fullName,
        billingAddress: {
          street: data.billingAddress,
          city: "", // Ces valeurs seront complétées par l'API Google Maps
          postal_code: "",
          country: "",
          formatted_address: data.billingAddress,
          lat: mapCoords?.lat,
          lng: mapCoords?.lng
        },
        siret: data.siret.replace(/\s/g, ''),
        tvaApplicable: data.tvaApplicable,
        tvaNumb: data.tvaApplicable ? data.tvaNumb : undefined,
        phone1: data.phone1,
        phone2: data.phone2,
        licenseNumber: data.licenseNumber,
        vehicleType: data.vehicleType,
        idNumber: data.idNumber,
        documents: documents as any,
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
              <CardTitle className="text-2xl">Compléter votre profil chauffeur</CardTitle>
              <CardDescription>
                Renseignez vos informations professionnelles pour finaliser votre inscription
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
                      
                      {/* Numéro CNI/Passeport */}
                      <FormField
                        control={form.control}
                        name="idNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro CNI/Passeport</FormLabel>
                            <FormControl>
                              <Input placeholder="123456789012" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Numéro de permis */}
                      <FormField
                        control={form.control}
                        name="licenseNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Numéro de permis de conduire</FormLabel>
                            <FormControl>
                              <Input placeholder="12AB34567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Type de véhicule */}
                      <FormField
                        control={form.control}
                        name="vehicleType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type de véhicule</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un type de véhicule" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(vehicleCategoryLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Documents légaux</h3>
                    <p className="text-sm text-muted-foreground">
                      Veuillez télécharger les documents suivants au format PDF, JPEG ou PNG (max 5MB par fichier)
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Kbis */}
                      <FormField
                        control={form.control}
                        name="kbis"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Extrait Kbis</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => handleFileChange(e, 'kbis')}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Attestation de vigilance */}
                      <FormField
                        control={form.control}
                        name="vigilanceAttestation"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Attestation de vigilance</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => handleFileChange(e, 'vigilanceAttestation')}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Permis de conduire (recto) */}
                      <FormField
                        control={form.control}
                        name="driverLicenseFront"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Permis de conduire (recto)</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => handleFileChange(e, 'driverLicenseFront')}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Permis de conduire (verso) */}
                      <FormField
                        control={form.control}
                        name="driverLicenseBack"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Permis de conduire (verso)</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => handleFileChange(e, 'driverLicenseBack')}
                                {...fieldProps}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* CNI / Passeport */}
                      <FormField
                        control={form.control}
                        name="idDocument"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>CNI/Passeport</FormLabel>
                            <FormControl>
                              <Input 
                                type="file" 
                                accept=".pdf,.jpg,.jpeg,.png" 
                                onChange={(e) => handleFileChange(e, 'idDocument')}
                                {...fieldProps}
                              />
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
