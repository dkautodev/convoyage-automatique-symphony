
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
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowUploadDialog(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Ajouter un document
          </Button>
          
          {isAdmin && (
            <>
              <GenerateQuoteButton 
                mission={mission} 
                client={client} 
                adminProfile={adminProfile || profile} 
              />
              
              <Button variant="outline" size="sm">
                <FileCheck className="h-4 w-4 mr-2" />
                Fiche mission
              </Button>
              
              <Button variant="outline" size="sm">
                <Receipt className="h-4 w-4 mr-2" />
                Facture
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <MissionAttachments 
          missionId={mission.id} 
          key={attachmentsKey} 
          onCountChanged={setDocumentCount}
        />
      </CardContent>
      
      {/* Dialog for uploading files */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter des documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FileUpload missionId={mission.id} onUploadComplete={handleDocumentUploaded} variant="default" label="Sélectionner des fichiers" multiple={true} className="w-full" />
            
            <div className="bg-muted/30 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                Formats acceptés: PDF, images (JPG, PNG, GIF, etc.) • Taille max: 10 Mo
              </p>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
