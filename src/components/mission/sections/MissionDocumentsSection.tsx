
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Receipt, PaperclipIcon, Upload } from 'lucide-react';
import { Mission } from '@/types/supabase';
import MissionAttachments from '@/components/mission/MissionAttachments';
import { toast } from 'sonner';
import { typedSupabase } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import FileUpload from '@/components/mission/FileUpload';
import { useAuth } from '@/hooks/auth';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';

interface MissionDocumentsSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
}

export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({
  mission,
  client,
  adminProfile
}) => {
  const [attachmentsKey, setAttachmentsKey] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);
  const {
    profile
  } = useAuth();
  const isAdmin = profile?.role === 'admin';

  // Fetch document count on load
  useEffect(() => {
    if (mission.id) {
      fetchDocumentCount();
    }
  }, [mission.id]);
  
  const fetchDocumentCount = async () => {
    try {
      const {
        count,
        error
      } = await typedSupabase.from('mission_documents').select('id', {
        count: 'exact',
        head: true
      }).eq('mission_id', mission.id);
      if (error) throw error;
      setDocumentCount(count || 0);
    } catch (error) {
      console.error("Error fetching document count:", error);
    }
  };

  // Handle document upload completion
  const handleDocumentUploaded = () => {
    // Force refresh the attachments list
    setAttachmentsKey(prev => prev + 1);
    fetchDocumentCount();

    // Close dialog if open
    if (showUploadDialog) {
      setShowUploadDialog(false);
    }
    toast.success("Document(s) ajouté(s) avec succès", {
      description: "Les documents ont été attachés à la mission."
    });
  };

  // Return the JSX for the component
  return (
    <Card id="documents-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PaperclipIcon className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowUploadDialog(true)}
              >
                <Upload className="h-4 w-4" />
                Ajouter des documents
              </Button>
            )}
          </div>
          
          <MissionAttachments 
            missionId={mission.id} 
            showTitle={false} 
            className="mt-4" 
            key={attachmentsKey}
            onCountChanged={(count) => setDocumentCount(count)} 
          />
        </div>
      </CardContent>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des documents</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <FileUpload 
              missionId={mission.id} 
              onUploaded={handleDocumentUploaded}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
