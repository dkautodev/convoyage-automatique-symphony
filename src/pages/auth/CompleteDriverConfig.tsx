
import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { LegalStatusType } from '@/hooks/auth/types';

// Définir les types acceptés de fichiers
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

// Définir les libellés des statuts juridiques
const legalStatusLabels: Record<LegalStatusType, string> = {
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

// Schema de validation pour la configuration du chauffeur
const driverConfigSchema = z.object({
  legalStatus: z.string().min(1, 'Veuillez sélectionner un statut juridique'),
  kbis: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => !file || file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .optional(),
  vigilanceAttestation: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => !file || file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .optional(),
  driverLicenseFront: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => !file || file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .optional(),
  idDocument: typeof window === 'undefined' 
    ? z.any() 
    : z.instanceof(File)
      .refine(file => !file || file.size <= 5000000, { message: 'Le fichier doit faire moins de 5MB' })
      .optional(),
});

type FormData = z.infer<typeof driverConfigSchema>;

export default function CompleteDriverConfig() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { completeDriverConfig } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(driverConfigSchema),
    defaultValues: {
      legalStatus: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log(`File selected for ${fieldName}:`, file.name, file.size);
      form.setValue(fieldName as any, file);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      console.log("Submitting driver config data:", data);
      
      // Collecte des documents
      const documents: Record<string, File> = {};
      if (data.kbis) documents.kbis = data.kbis;
      if (data.driverLicenseFront) documents.driverLicenseFront = data.driverLicenseFront;
      if (data.vigilanceAttestation) documents.vigilanceAttestation = data.vigilanceAttestation;
      if (data.idDocument) documents.idDocument = data.idDocument;
      
      console.log("Documents to upload:", Object.keys(documents).length);
      
      // Envoyer la configuration
      try {
        await completeDriverConfig(
          data.legalStatus as LegalStatusType,
          Object.keys(documents).length > 0 ? documents : undefined
        );
        
        toast.success("Configuration du chauffeur complétée avec succès!");
        
      } catch (error: any) {
        console.error("Error submitting driver config:", error);
        toast.error(`Erreur lors de la configuration: ${error.message || 'Erreur inconnue'}`);
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
                Étape 2/2 : Configuration légale et documents
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Statut juridique</h3>
                    
                    <FormField
                      control={form.control}
                      name="legalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut juridique de votre entreprise</FormLabel>
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
                          <FormDescription>
                            Sélectionnez le statut juridique de votre entreprise
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-medium">Documents légaux (facultatifs)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vous pouvez télécharger ces documents maintenant ou plus tard depuis votre tableau de bord.
                      Formats acceptés : PDF, JPEG, PNG (max 5MB par fichier)
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
                            <FormDescription>
                              Document officiel prouvant l'existence de votre entreprise
                            </FormDescription>
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
                            <FormDescription>
                              Attestation prouvant que l'entreprise est à jour de ses cotisations
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Permis de conduire */}
                      <FormField
                        control={form.control}
                        name="driverLicenseFront"
                        render={({ field: { value, onChange, ...fieldProps } }) => (
                          <FormItem>
                            <FormLabel>Permis de conduire</FormLabel>
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
                  
                  <div className="flex justify-between space-x-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => window.history.back()}
                    >
                      Retour
                    </Button>
                    
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                          <span>Finalisation...</span>
                        </div>
                      ) : (
                        'Finaliser mon profil'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
