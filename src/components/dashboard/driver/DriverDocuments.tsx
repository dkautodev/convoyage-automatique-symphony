
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Upload, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { LegalStatusType } from '@/hooks/auth/types';
import { updateDriverDocumentPath } from '@/utils/documentUtils';

// Types for driver configuration
interface DriverConfig {
  id: string;
  legal_status: LegalStatusType;
  license_number: string | null;
  id_number: string | null;
  kbis_document_path: string | null;
  vigilance_document_path: string | null;
  license_document_path: string | null;
  id_document_path: string | null;
}

// List of legal status options
const legalStatusOptions: { value: LegalStatusType; label: string }[] = [
  { value: 'EI', label: 'Entreprise Individuelle' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SA', label: 'SA' },
  { value: 'SAS', label: 'SAS' },
  { value: 'SASU', label: 'SASU' },
  { value: 'SNC', label: 'SNC' },
  { value: 'Scop', label: 'Scop' },
  { value: 'Association', label: 'Association' }
];

// Document types for upload
interface DocumentType {
  id: string;
  label: string;
  pathField: keyof Pick<DriverConfig, 'kbis_document_path' | 'vigilance_document_path' | 'license_document_path' | 'id_document_path'>;
  required: boolean;
}

const documentTypes: DocumentType[] = [
  { id: 'kbis', label: 'KBIS', pathField: 'kbis_document_path', required: true },
  { id: 'vigilance', label: 'Attestation de vigilance', pathField: 'vigilance_document_path', required: true },
  { id: 'license', label: 'Permis de conduire', pathField: 'license_document_path', required: true },
  { id: 'id', label: "Document d'identité", pathField: 'id_document_path', required: true },
];

const DriverDocuments = () => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverConfig, setDriverConfig] = useState<DriverConfig | null>(null);
  
  // Form state
  const [licenseNumber, setLicenseNumber] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [legalStatus, setLegalStatus] = useState<LegalStatusType>('EI');
  const [uploadLoading, setUploadLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user?.id) {
      fetchDriverConfig();
    }
  }, [user?.id]);

  const fetchDriverConfig = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('drivers_config')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116: No rows returned (not an error for us)
        throw error;
      }
      
      if (data) {
        setDriverConfig(data);
        setLicenseNumber(data.license_number || '');
        setIdNumber(data.id_number || '');
        setLegalStatus(data.legal_status);
      }
      
    } catch (error) {
      console.error('Error fetching driver config:', error);
      toast.error('Impossible de récupérer vos informations');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!user?.id) return;
    
    try {
      setSaving(true);
      
      const configData = {
        id: user.id,
        legal_status: legalStatus,
        license_number: licenseNumber,
        id_number: idNumber,
      };
      
      const { error } = await supabase
        .from('drivers_config')
        .upsert(configData, { onConflict: 'id' });
      
      if (error) throw error;
      
      toast.success('Informations sauvegardées avec succès');
      
    } catch (error) {
      console.error('Error saving driver config:', error);
      toast.error('Erreur lors de la sauvegarde des informations');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (docType: DocumentType, file: File) => {
    if (!user?.id || !file) return;
    
    try {
      // Set loading state for this document type
      setUploadLoading(prev => ({ ...prev, [docType.id]: true }));
      
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType.id}_${Date.now()}.${fileExt}`;
      
      // Upload to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('driver_doc_config')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Update the driver config with the new file path using our utility function
      const success = await updateDriverDocumentPath(user.id, docType.id as 'kbis' | 'vigilance' | 'license' | 'id', fileName, legalStatus);
      
      if (!success) {
        throw new Error('Failed to update document path');
      }
      
      // Refresh the config
      fetchDriverConfig();
      toast.success(`Document ${docType.label} téléchargé avec succès`);
      
    } catch (error) {
      console.error(`Error uploading ${docType.label}:`, error);
      toast.error(`Erreur lors du téléchargement du document ${docType.label}`);
    } finally {
      setUploadLoading(prev => ({ ...prev, [docType.id]: false }));
    }
  };

  const isDocumentUploaded = (docType: DocumentType) => {
    if (!driverConfig) return false;
    return !!driverConfig[docType.pathField];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="license_number">Numéro de permis</Label>
              <Input 
                id="license_number" 
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="Entrez votre numéro de permis"
              />
            </div>
            <div>
              <Label htmlFor="id_number">Numéro document identité</Label>
              <Input 
                id="id_number" 
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Entrez votre numéro de carte d'identité/passeport"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="legal_status">Statut juridique de l'entreprise</Label>
            <Select 
              value={legalStatus} 
              onValueChange={(value) => setLegalStatus(value as LegalStatusType)}
            >
              <SelectTrigger id="legal_status" className="w-full">
                <SelectValue placeholder="Sélectionnez votre statut juridique" />
              </SelectTrigger>
              <SelectContent>
                {legalStatusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={saveConfig} 
            disabled={saving}
            className="mt-2"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
            ) : (
              'Enregistrer les informations'
            )}
          </Button>
          
          <div className="border-t pt-4 mt-2">
            <h3 className="font-medium text-lg mb-4">Documents justificatifs</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {documentTypes.map((docType) => (
                <div key={docType.id} className="flex items-center justify-between p-4 border rounded-md">
                  <div className="flex items-center gap-3">
                    {isDocumentUploaded(docType) ? (
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-500" />
                    )}
                    <span>{docType.label}</span>
                  </div>
                  <div>
                    <label htmlFor={`upload-${docType.id}`} className="cursor-pointer">
                      <Input
                        type="file"
                        id={`upload-${docType.id}`}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType, file);
                        }}
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <Button 
                        type="button"
                        variant={isDocumentUploaded(docType) ? "outline" : "default"}
                        size="sm"
                        disabled={uploadLoading[docType.id]}
                      >
                        {uploadLoading[docType.id] ? (
                          <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Envoi...</>
                        ) : (
                          <><Upload className="mr-2 h-3 w-3" /> {isDocumentUploaded(docType) ? "Remplacer" : "Téléverser"}</>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverDocuments;
