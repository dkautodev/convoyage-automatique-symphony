
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaperclipIcon, Loader2, Download, Trash2, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import MissionAttachments from './MissionAttachments';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { getPublicUrl } from '@/integrations/supabase/storage';

interface TempMissionAttachmentsProps {
  tempId: string;
  onDocumentsChange?: (count: number) => void;
}

export default function TempMissionAttachments({ tempId, onDocumentsChange }: TempMissionAttachmentsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [documentCount, setDocumentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Récupérer le nombre de documents au chargement
  useEffect(() => {
    fetchDocumentCount();
  }, [tempId]);

  // Fonction pour récupérer le nombre de documents
  const fetchDocumentCount = async () => {
    if (!tempId) return;
    
    try {
      setLoading(true);
      const { count, error } = await typedSupabase
        .from('mission_documents')
        .select('id', { count: 'exact', head: true })
        .eq('mission_id', tempId);
        
      if (error) throw error;
      
      setDocumentCount(count || 0);
      if (onDocumentsChange) onDocumentsChange(count || 0);
    } catch (error) {
      console.error("Error fetching document count:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction appelée quand des documents sont ajoutés ou supprimés
  const handleDocumentsChanged = () => {
    fetchDocumentCount();
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowDialog(true)}
        className="relative"
      >
        <PaperclipIcon className="h-4 w-4 mr-2" />
        Documents
        {documentCount > 0 && (
          <Badge 
            variant="default" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {documentCount}
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documents de la mission
              <Button 
                variant="ghost" 
                size="icon" 
                className="ml-auto" 
                onClick={() => setShowDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <MissionAttachments 
              missionId={tempId} 
              showTitle={false}
              className="mt-2"
              key={documentCount} // Force refresh when count changes
            />
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
