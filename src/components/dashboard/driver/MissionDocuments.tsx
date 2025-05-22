
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ExternalLink } from 'lucide-react'; 
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getMissionDocuments } from '@/integrations/supabase/storage';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
  const [viewDocument, setViewDocument] = useState<MissionDocument | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  
  useEffect(() => {
    if (missionId) {
      fetchDocuments();
    }
  }, [missionId]);
  
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getMissionDocuments(missionId);
      console.log('Documents récupérés:', docs);
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
      console.log('Téléchargement du document:', document);
      
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

  const handleViewDocument = (document: MissionDocument) => {
    setViewDocument(document);
    setShowDocumentDialog(true);
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    return '📎';
  };

  const getPublicUrlWithTimestamp = (filePath: string) => {
    if (!filePath) return '';
    
    try {
      const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
      // Add timestamp to prevent caching issues
      return `${data.publicUrl}?t=${new Date().getTime()}`;
    } catch (error) {
      console.error('Error generating public URL:', error);
      return '';
    }
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
                      <Button size="sm" variant="outline" onClick={() => handleViewDocument(doc)}>
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Voir</span>
                      </Button>
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
          </div>
        )}
      </CardContent>

      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="w-full max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Document: {viewDocument?.file_name}</DialogTitle>
          </DialogHeader>
          
          {viewDocument && (
            <div className="flex-1 h-full min-h-0 overflow-hidden">
              {viewDocument.file_type?.includes('pdf') ? (
                <object
                  data={getPublicUrlWithTimestamp(viewDocument.file_path)}
                  type="application/pdf"
                  className="w-full h-full"
                  aria-label={`Document PDF: ${viewDocument.file_name}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <p className="mb-4 text-center">Le navigateur ne peut pas afficher ce PDF</p>
                    <Button 
                      onClick={() => window.open(getPublicUrlWithTimestamp(viewDocument.file_path), '_blank')}
                      variant="default"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Ouvrir dans un nouvel onglet
                    </Button>
                  </div>
                </object>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="mb-4">Ce type de document ne peut pas être prévisualisé</p>
                  <Button 
                    onClick={() => handleDownload(viewDocument)}
                    variant="default"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger le fichier
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDocumentDialog(false)}
            >
              Fermer
            </Button>
            {viewDocument && (
              <Button 
                variant="default"
                onClick={() => window.open(getPublicUrlWithTimestamp(viewDocument.file_path), '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MissionDocuments;
