
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, Loader2 } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getMissionDocuments, getPublicUrl } from '@/integrations/supabase/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MissionDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  uploaded_at: string;
  publicUrl?: string;
}

interface MissionDocumentsProps {
  missionId: string;
}

const MissionDocuments: React.FC<MissionDocumentsProps> = ({ missionId }) => {
  const [documents, setDocuments] = useState<MissionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [convoyageExists, setConvoyageExists] = useState(false);
  const [checkingConvoyage, setCheckingConvoyage] = useState(true);
  const { user, profile } = useAuth();
  
  useEffect(() => {
    if (missionId) {
      fetchDocuments();
      checkConvoyageDocument();
    }
  }, [missionId]);
  
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getMissionDocuments(missionId);
      setDocuments(docs);
    } catch (error) {
      console.error('Erreur lors du chargement des documents:', error);
      toast.error('Impossible de charger les documents');
    } finally {
      setLoading(false);
    }
  };

  const checkConvoyageDocument = async () => {
    try {
      setCheckingConvoyage(true);
      const { data, error } = await supabase.storage
        .from('adminsettings')
        .list('', { search: 'BON DE CONVOYAGE.pdf' });
      
      if (error) {
        console.error('Erreur lors de la vérification du bon de convoyage:', error);
        setConvoyageExists(false);
      } else {
        setConvoyageExists(data && data.length > 0);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
      setConvoyageExists(false);
    } finally {
      setCheckingConvoyage(false);
    }
  };

  const handleDownloadConvoyage = async () => {
    try {
      console.log('Téléchargement du bon de convoyage depuis adminsettings bucket');
      
      const { data, error } = await supabase.storage
        .from('adminsettings')
        .download('BON DE CONVOYAGE.pdf');
        
      if (error) {
        console.error('Erreur lors du téléchargement du bon de convoyage:', error);
        toast.error('Impossible de télécharger le bon de convoyage');
        return;
      }
      
      // Créer une URL pour le téléchargement
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = 'BON DE CONVOYAGE.pdf';
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Bon de convoyage téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement du bon de convoyage:', error);
      toast.error('Impossible de télécharger le bon de convoyage');
    }
  };

  const handleDownload = async (document: MissionDocument) => {
    try {
      console.log(`Downloading document from path: ${document.file_path} using documents bucket`);
      
      // Clean up the path if needed
      let filePath = document.file_path;
      if (filePath.startsWith('/')) {
        filePath = filePath.substring(1);
      }
      
      // Use the documents bucket explicitly for consistency
      const { data, error } = await supabase
        .storage
        .from('documents')
        .download(filePath);
        
      if (error) {
        console.error('Erreur lors du téléchargement:', error);
        throw error;
      }
      
      // Create a URL for the download
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors du téléchargement du document:', error);
      toast.error("Impossible de télécharger le document");
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Gestion des documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Section des onglets */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Mission
              </Button>
              <Button variant="outline" size="sm" className="relative">
                + Aj. docs
                <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  0
                </span>
              </Button>
              <Button 
                variant={convoyageExists ? "default" : "outline"} 
                size="sm"
                onClick={handleDownloadConvoyage}
                disabled={!convoyageExists || checkingConvoyage}
                className={convoyageExists ? "bg-green-600 hover:bg-green-700 text-white" : "text-gray-400"}
              >
                {checkingConvoyage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Bon de convoyage
              </Button>
            </div>

            {documents.length > 0 ? (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-muted/40 rounded-md">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getFileIcon(doc.file_type || '')}</span>
                      <div>
                        <p className="font-medium text-sm">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
                <p>Aucun document pour cette mission</p>
              </div>
            )}
            
            {/* Removed file upload section for drivers */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionDocuments;
