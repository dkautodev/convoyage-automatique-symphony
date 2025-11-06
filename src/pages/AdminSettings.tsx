import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Eye, FileText, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings = () => {
  const [convoyageDocument, setConvoyageDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingDocument, setExistingDocument] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les informations bancaires
  const [bankInfo, setBankInfo] = useState({
    admin_bank: '',
    admin_iban: '',
    admin_bic: ''
  });
  const [isSavingBankInfo, setIsSavingBankInfo] = useState(false);
  const [bankInfoLoading, setBankInfoLoading] = useState(true);

  // Charger les données au montage
  useEffect(() => {
    checkExistingDocument();
    loadBankInfo();
  }, []);

  const loadBankInfo = async () => {
    try {
      setBankInfoLoading(true);
      const { data, error } = await supabase
        .from('fac_admin_config')
        .select('admin_bank, admin_iban, admin_bic')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erreur lors du chargement des infos bancaires:', error);
        toast.error('Erreur lors du chargement des informations bancaires');
      } else if (data) {
        setBankInfo({
          admin_bank: data.admin_bank || '',
          admin_iban: data.admin_iban || '',
          admin_bic: data.admin_bic || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setBankInfoLoading(false);
    }
  };
  const checkExistingDocument = async () => {
    try {
      setIsLoading(true);
      const {
        data,
        error
      } = await supabase.storage.from('adminsettings').list('', {
        search: 'BON DE CONVOYAGE.pdf'
      });
      if (error) {
        console.error('Erreur lors de la vérification du document:', error);
      } else if (data && data.length > 0) {
        setExistingDocument('BON DE CONVOYAGE.pdf');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier que c'est un PDF
    if (file.type !== 'application/pdf') {
      toast.error('Veuillez sélectionner un fichier PDF');
      return;
    }
    setConvoyageDocument(file);
    toast.success('Document PDF sélectionné');
  };
  const handleUpload = async () => {
    if (!convoyageDocument) {
      toast.error('Veuillez sélectionner un document PDF');
      return;
    }
    setIsUploading(true);
    try {
      // Supprimer l'ancien document s'il existe
      if (existingDocument) {
        await supabase.storage.from('adminsettings').remove([existingDocument]);
      }

      // Upload du nouveau document avec le nom fixe
      const {
        data,
        error
      } = await supabase.storage.from('adminsettings').upload('BON DE CONVOYAGE.pdf', convoyageDocument, {
        cacheControl: '3600',
        upsert: true
      });
      if (error) {
        console.error('Erreur lors de l\'upload:', error);
        toast.error('Erreur lors du téléchargement du document');
      } else {
        console.log('Document uploadé:', data.path);
        setExistingDocument('BON DE CONVOYAGE.pdf');
        setConvoyageDocument(null);
        // Reset l'input file
        const fileInput = document.getElementById('convoyage-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        toast.success('Document téléchargé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };
  const handlePreview = () => {
    if (convoyageDocument) {
      // Prévisualisation du fichier sélectionné (pas encore uploadé)
      const fileUrl = URL.createObjectURL(convoyageDocument);
      window.open(fileUrl, '_blank');
    } else if (existingDocument) {
      // Prévisualisation du document existant sur le serveur
      const {
        data
      } = supabase.storage.from('adminsettings').getPublicUrl(existingDocument);
      if (data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      } else {
        toast.error('Impossible de prévisualiser le document');
      }
    } else {
      toast.error('Aucun document à prévisualiser');
    }
  };
  const handleRemoveFile = () => {
    if (convoyageDocument) {
      // Supprimer le fichier sélectionné (pas encore uploadé)
      setConvoyageDocument(null);
      toast.success('Fichier supprimé');
      // Reset l'input file
      const fileInput = document.getElementById('convoyage-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };
  const handleDeleteServerDocument = async () => {
    if (!existingDocument) return;
    try {
      const {
        error
      } = await supabase.storage.from('adminsettings').remove([existingDocument]);
      if (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error('Erreur lors de la suppression du document');
      } else {
        setExistingDocument(null);
        toast.success('Document supprimé du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveBankInfo = async () => {
    try {
      setIsSavingBankInfo(true);
      
      // Vérifier si une entrée existe déjà
      const { data: existing, error: checkError } = await supabase
        .from('fac_admin_config')
        .select('*')
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      let error;
      if (existing) {
        // Mise à jour
        const result = await supabase
          .from('fac_admin_config')
          .update({
            admin_bank: bankInfo.admin_bank,
            admin_iban: bankInfo.admin_iban,
            admin_bic: bankInfo.admin_bic
          })
          .eq('admin_bank', existing.admin_bank);
        error = result.error;
      } else {
        // Insertion
        const result = await supabase
          .from('fac_admin_config')
          .insert({
            admin_bank: bankInfo.admin_bank,
            admin_iban: bankInfo.admin_iban,
            admin_bic: bankInfo.admin_bic
          });
        error = result.error;
      }

      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        toast.error('Erreur lors de la sauvegarde des informations bancaires');
      } else {
        toast.success('Informations bancaires enregistrées avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSavingBankInfo(false);
    }
  };
  return <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres Admin</h1>
      
      <div className="grid gap-6">
        {/* Section Informations Bancaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations Bancaires
            </CardTitle>
            <CardDescription>
              Configurez les informations bancaires de l'administrateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankInfoLoading ? (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="admin_bank">Banque</Label>
                    <Input
                      id="admin_bank"
                      placeholder="Nom de la banque"
                      value={bankInfo.admin_bank}
                      onChange={(e) => setBankInfo({ ...bankInfo, admin_bank: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin_bic">BIC</Label>
                    <Input
                      id="admin_bic"
                      placeholder="Code BIC"
                      value={bankInfo.admin_bic}
                      onChange={(e) => setBankInfo({ ...bankInfo, admin_bic: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin_iban">IBAN</Label>
                  <Input
                    id="admin_iban"
                    placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                    value={bankInfo.admin_iban}
                    onChange={(e) => setBankInfo({ ...bankInfo, admin_iban: e.target.value })}
                  />
                </div>

                <div className="flex justify-start pt-2">
                  <Button onClick={handleSaveBankInfo} disabled={isSavingBankInfo}>
                    {isSavingBankInfo ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section Bon de convoyage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Bon de convoyage
            </CardTitle>
            <CardDescription>
              Gérez le modèle de bon de convoyage utilisé pour les missions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Affichage du document existant */}
            {isLoading ? <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Vérification du document existant...</p>
              </div> : existingDocument && !convoyageDocument ? <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700 font-medium">Document actuel :</p>
                <p className="text-sm text-green-600">{existingDocument}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeleteServerDocument} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div> : null}

            {/* Section d'upload */}
            <div className="space-y-4">
              <div>
                <label htmlFor="convoyage-upload" className="block text-sm font-medium mb-2">
                  {existingDocument ? 'Remplacer le modèle (PDF uniquement)' : 'Sélectionner un nouveau modèle (PDF uniquement)'}
                </label>
                
                {/* Input file caché */}
                <input id="convoyage-upload" type="file" accept=".pdf,application/pdf" onChange={handleFileUpload} className="hidden" />
                
                {/* Boutons d'action */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => document.getElementById('convoyage-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier PDF
                  </Button>
                  
                  

                  {convoyageDocument && <Button variant="outline" onClick={handleRemoveFile} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>}
                </div>
              </div>
              
              {convoyageDocument && <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-700 font-medium">
                    Nouveau fichier sélectionné: <span className="font-normal">{convoyageDocument.name}</span>
                  </p>
                  <p className="text-xs text-blue-600">
                    Taille: {(convoyageDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-blue-600">
                    Sera renommé: BON DE CONVOYAGE.pdf
                  </p>
                </div>}
            </div>

            {/* Bouton de téléchargement */}
            {convoyageDocument && <div className="flex justify-start">
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Téléchargement...
                    </> : <>
                      <Upload className="h-4 w-4 mr-2" />
                      {existingDocument ? 'Remplacer le document' : 'Télécharger'}
                    </>}
                </Button>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminSettings;