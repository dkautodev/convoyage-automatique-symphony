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
  return;
};