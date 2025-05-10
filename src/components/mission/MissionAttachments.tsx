
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { File, Download, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';
import { fr } from 'date-fns/locale';

interface MissionDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  uploaded_at: string;
  uploaded_by: string;
}

interface MissionAttachmentsProps {
  missionId?: string;
  showTitle?: boolean;
  className?: string;
}

export default function MissionAttachments({ 
  missionId, 
  showTitle = true,
  className = ''
}: MissionAttachmentsProps) {
  const [documents, setDocuments] = useState<MissionDocument[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  useEffect(() => {
    if (missionId) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setLoading(false);
    }
  }, [missionId]);
  
  const fetchDocuments = async () => {
    if (!missionId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await typedSupabase
        .from('mission_documents')
        .select('*')
        .eq('mission_id', missionId)
        .order('uploaded_at', { ascending: false });
        
      if (error) throw error;
      
      setDocuments(data as MissionDocument[]);
    } catch (error) {
      console.error("Error fetching mission documents:", error);
      toast.error("Erreur lors du chargement des documents");
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (doc: MissionDocument) => {
    try {
      // Determine which bucket to use based on the file path
      const bucketName = doc.file_path.startsWith('mission-docs/') ? 'mission-docs' : 'documents';
      const filePath = doc.file_path.replace(`${bucketName}/`, '');
      
      const { data, error } = await typedSupabase
        .storage
        .from(bucketName)
        .download(filePath);
        
      if (error) throw error;
      
      // Create a download link and trigger download
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement du document");
    }
  };
  
  const handleDelete = async (document: MissionDocument) => {
    if (!confirm(`Voulez-vous vraiment supprimer le document "${document.file_name}" ?`)) {
      return;
    }
    
    try {
      setDeleting(document.id);
      
      // Determine which bucket to use based on the file path
      const bucketName = document.file_path.startsWith('mission-docs/') ? 'mission-docs' : 'documents';
      const storagePath = document.file_path.replace(`${bucketName}/`, '');
      
      // Delete the file from storage
      const { error: storageError } = await typedSupabase
        .storage
        .from(bucketName)
        .remove([storagePath]);
        
      if (storageError) throw storageError;
      
      // Delete the document record
      const { error: dbError } = await typedSupabase
        .from('mission_documents')
        .delete()
        .eq('id', document.id);
        
      if (dbError) throw dbError;
      
      toast.success("Document supprimé avec succès");
      
      // Update the local state
      setDocuments(documents.filter(doc => doc.id !== document.id));
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression du document");
    } finally {
      setDeleting(null);
    }
  };
  
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <File className="h-5 w-5 text-red-500" />;
      case 'doc':
      case 'docx':
        return <File className="h-5 w-5 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <File className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <File className="h-5 w-5 text-purple-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistance(new Date(dateString), new Date(), {
        addSuffix: true,
        locale: fr
      });
    } catch (e) {
      return "Date inconnue";
    }
  };
  
  if (!missionId) {
    return null;
  }
  
  return (
    <div className={className}>
      {showTitle && <h3 className="text-sm font-medium mb-3">Pièces jointes</h3>}
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Chargement des documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Aucun document attaché à cette mission
        </p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between bg-muted/30 p-2 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex items-center overflow-hidden">
                {getFileIcon(doc.file_name)}
                <div className="ml-2 overflow-hidden">
                  <p className="text-sm font-medium truncate" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRelativeTime(doc.uploaded_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 ml-2 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDownload(doc)}
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={() => handleDelete(doc)}
                  disabled={deleting === doc.id}
                  title="Supprimer"
                >
                  {deleting === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
