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
  const { user, profile } = useAuth();
  
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

  const handleDownload = async (document: MissionDocument) => {
    try {
      // Utiliser le bucket 'documents' explicitement pour la cohérence
      const { data, error } = await supabase
        .storage
        .from('documents')
        .download(document.file_path);
        
      if (error) {
        console.error('Erreur lors du téléchargement:', error);
        throw error;
      }
      
      // Créer un URL pour le téléchargement
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
