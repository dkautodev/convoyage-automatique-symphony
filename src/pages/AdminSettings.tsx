import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
const AdminSettings = () => {
  const [convoyageDocument, setConvoyageDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingDocument, setExistingDocument] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si un document existe déjà au chargement
  useEffect(() => {
    checkExistingDocument();
  }, []);
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
  const canPreview = convoyageDocument || existingDocument;
  const canRemove = convoyageDocument;
  const canDelete = existingDocument && !convoyageDocument;
  const canUpload = convoyageDocument;
  return <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres Admin</h1>
      
      <div className="grid gap-6">
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
                <div className="flex flex-wrap gap-2">
                  <input id="convoyage-upload" type="file" accept=".pdf,application/pdf" onChange={handleFileUpload} className="hidden" />
                  <Button variant="outline" onClick={() => document.getElementById('convoyage-upload')?.click()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choisir un fichier PDF
                  </Button>
                  
                  <Button variant="outline" onClick={handlePreview} disabled={!canPreview}>
                    <Eye className="h-4 w-4 mr-2" />
                    Prévisualiser
                  </Button>

                  <Button variant="outline" onClick={handleRemoveFile} disabled={!canRemove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
            <div className="flex justify-start">
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminSettings;