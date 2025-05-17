
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mission } from '@/types/supabase';
import { typedSupabase } from '@/types/database';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth';
import FileUpload from '@/components/mission/FileUpload';
import { FileText, Trash2, Download, Loader2, Paperclip } from 'lucide-react';
import { getMissionDocuments } from '@/integrations/supabase/storage';

interface MissionDocumentsDialogProps {
  mission: Mission;
  isOpen: boolean;
  onClose: () => void;
  onDocumentsUpdated: () => void;
}

interface MissionDocument {
  id: string;
  mission_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  publicUrl: string | null;
}

export const MissionDocumentsDialog: React.FC<MissionDocumentsDialogProps> = ({
  mission,
  isOpen,
  onClose,
  onDocumentsUpdated
}) => {
  const [documents, setDocuments] = useState<MissionDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { user, profile } = useAuth();
  
  // Check if user is a driver
  const isDriver = profile?.role === 'chauffeur';

  useEffect(() => {
    if (isOpen && mission.id) {
      fetchDocuments();
    }
  }, [isOpen, mission.id]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const docs = await getMissionDocuments(mission.id);
      setDocuments(docs as MissionDocument[]);
    } catch (error) {
      console.error('Erreur lors de la récupération des documents:', error);
      toast.error('Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploaded = async () => {
    await fetchDocuments();
    onDocumentsUpdated(); // Met à jour le compteur dans la page principale
    toast.success('Document ajouté avec succès');
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!user) return;
    try {
      setDeleting(documentId);

      // Récupérer d'abord les informations du document pour connaître le chemin du fichier
      const {
        data: documentData,
        error: fetchError
      } = await typedSupabase.from('mission_documents').select('file_path').eq('id', documentId).single();
      if (fetchError || !documentData) {
        throw new Error('Impossible de récupérer les informations du document');
      }

      // Supprimer le fichier du stockage (toujours du bucket 'documents')
      const {
        error: storageError
      } = await typedSupabase.storage.from('documents').remove([documentData.file_path]);
      if (storageError) {
        console.error('Erreur lors de la suppression du fichier:', storageError);
        // Continuer quand même pour supprimer la référence de la base de données
      }

      // Supprimer la référence du document de la base de données
      const {
        error: deleteError
      } = await typedSupabase.from('mission_documents').delete().eq('id', documentId);
      if (deleteError) {
        throw new Error('Erreur lors de la suppression du document');
      }
      await fetchDocuments();
      onDocumentsUpdated(); // Met à jour le compteur dans la page principale
      toast.success('Document supprimé avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
      toast.error('Erreur lors de la suppression du document');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadDocument = async (document: MissionDocument) => {
    try {
      // Utiliser le bucket 'documents' explicitement
      const { data, error } = await typedSupabase
        .storage
        .from('documents')
        .download(document.file_path);
        
      if (error) {
        console.error('Erreur de téléchargement:', error);
        toast.error('Impossible de télécharger le document');
        return;
      }
      
      // Créer un URL pour le téléchargement
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement du document:", error);
      toast.error("Erreur lors du téléchargement du document");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-5 w-5" />
            Documents de la mission #{mission.mission_number}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          {/* Only show FileUpload component if user is not a driver */}
          {!isDriver && (
            <div className="flex justify-between items-center mb-2">
              <FileUpload 
                missionId={mission.id} 
                onUploadComplete={handleDocumentUploaded} 
                label="+ Ajouter des documents" 
                variant="default" 
                size="sm" 
              />
            </div>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 border rounded-md bg-gray-50">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Aucun document</h3>
            <p className="text-gray-500 mt-1">
              {isDriver ? 'Aucun document n\'est disponible pour cette mission' : 'Ajoutez des documents à cette mission'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom du fichier</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date d'ajout</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.file_name}</TableCell>
                  <TableCell>{doc.file_type || 'Inconnu'}</TableCell>
                  <TableCell>{formatDate(doc.uploaded_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDownloadDocument(doc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      {/* Only show delete button if user is not a driver */}
                      {!isDriver && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeleteDocument(doc.id)} 
                          disabled={deleting === doc.id}
                        >
                          {deleting === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
