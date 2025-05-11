
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Upload, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { uploadMissionDocument, getMissionDocuments, getPublicUrl } from '@/integrations/supabase/storage';
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
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (missionId) {
      fetchDocuments();
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
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !user) {
      return;
    }
    
    try {
      setUploading(true);
      const file = e.target.files[0];
      
      const documentId = await uploadMissionDocument(missionId, file, user.id);
      
      if (documentId) {
        toast.success('Document téléchargé avec succès');
        fetchDocuments();
      } else {
        throw new Error('Échec du téléchargement');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Impossible de télécharger le document');
    } finally {
      setUploading(false);
    }
  };
  
  const handleDownload = (document: MissionDocument) => {
    if (document.publicUrl) {
      window.open(document.publicUrl, '_blank');
    }
  };
  
  const handleDelete = async (document: MissionDocument) => {
    if (!user) return;
    
    try {
      // Vérifier si l'utilisateur est autorisé à supprimer (chauffeur de la mission ou admin)
      const { error } = await supabase
        .from('mission_documents')
        .delete()
        .eq('id', document.id)
        .eq('uploaded_by', user.id);
      
      if (error) throw error;
      
      // Supprimer le fichier du stockage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);
      
      if (storageError) {
        console.error('Erreur lors de la suppression du fichier:', storageError);
      }
      
      toast.success('Document supprimé');
      fetchDocuments();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Impossible de supprimer le document');
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
          Documents de la mission
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
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
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
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
            
            <div className="pt-4">
              <div className="flex items-center justify-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-current rounded-full mr-2"></div>
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Ajouter un document
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MissionDocuments;
