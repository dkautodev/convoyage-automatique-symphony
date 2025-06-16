import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';
const AdminSettings = () => {
  const [convoyageDocument, setConvoyageDocument] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
      // TODO: Implémenter l'upload vers Supabase Storage
      console.log('Upload du document:', convoyageDocument.name);

      // Simulation d'upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };
  const handlePreview = () => {
    if (!convoyageDocument) {
      toast.error('Veuillez sélectionner un document PDF');
      return;
    }

    // Créer une URL temporaire pour prévisualiser le PDF
    const fileUrl = URL.createObjectURL(convoyageDocument);
    window.open(fileUrl, '_blank');
  };
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
            {/* Section d'upload */}
            <div className="space-y-4">
              <div>
                <label htmlFor="convoyage-upload" className="block text-sm font-medium mb-2">
                  Sélectionner un nouveau modèle (PDF uniquement)
                </label>
                <input id="convoyage-upload" type="file" accept=".pdf,application/pdf" onChange={handleFileUpload} className="hidden" />
                <Button variant="outline" onClick={() => document.getElementById('convoyage-upload')?.click()} className="w-full sm:w-auto">
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir un fichier PDF
                </Button>
              </div>
              
              {convoyageDocument && <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    Fichier sélectionné: <span className="font-medium">{convoyageDocument.name}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    Taille: {(convoyageDocument.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row gap-3">
              
              
              <Button variant="outline" onClick={handlePreview} disabled={!convoyageDocument} className="w-full sm:w-auto">
                <Eye className="h-4 w-4 mr-2" />
                Prévisualiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminSettings;