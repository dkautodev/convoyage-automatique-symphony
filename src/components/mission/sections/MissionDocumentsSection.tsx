
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

interface MissionDocumentsSectionProps {
  mission: Mission;
}

export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({
  mission
}) => {
  const [attachmentsKey, setAttachmentsKey] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);
  const [showUploadDialog, setShowUploadDialog] = useState<boolean>(false);

  // Fetch document count on load
  useEffect(() => {
    if (mission.id) {
      fetchDocumentCount();
    }
  }, [mission.id]);

  const fetchDocumentCount = async () => {
    try {
      const { count, error } = await typedSupabase
        .from('mission_documents')
        .select('id', { count: 'exact', head: true })
        .eq('mission_id', mission.id);
        
      if (error) throw error;
      setDocumentCount(count || 0);
    } catch (error) {
      console.error("Error fetching document count:", error);
    }
  };

  // Placeholder functions for document generation
  const handleGenerateQuote = () => {
    toast.info('Génération de devis non implémentée');
  };
  
  const handleGenerateMissionSheet = () => {
    toast.info('Génération de fiche de mission non implémentée');
  };
  
  const handleGenerateInvoice = () => {
    toast.info('Génération de facture non implémentée');
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
    
    toast.success(
      "Document(s) ajouté(s) avec succès", 
      { description: "Les documents ont été attachés à la mission." }
    );
  };
  
  return <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-blue-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Devis</h3>
            
            <Button onClick={handleGenerateQuote} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileCheck className="h-10 w-10 text-green-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Fiche de mission</h3>
            
            <Button onClick={handleGenerateMissionSheet} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <Receipt className="h-10 w-10 text-amber-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Facture</h3>
            
            <Button onClick={handleGenerateInvoice} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
        </div>
        
        {/* Documents section */}
        <div className="mt-6 border-t pt-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-medium">Pièces jointes</h3>
              <p className="text-sm text-muted-foreground">
                {documentCount} document{documentCount !== 1 ? 's' : ''} attaché{documentCount !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowUploadDialog(true)}
                variant="default" 
                size="sm"
                className="flex items-center gap-1"
              >
                <Upload className="h-4 w-4" />
                Ajouter des fichiers
              </Button>
            </div>
          </div>
          
          {/* Document list */}
          <div className="border rounded-lg overflow-hidden">
            <MissionAttachments 
              key={attachmentsKey}
              missionId={mission.id} 
              showTitle={false} 
              className="p-4"
            />
          </div>
          
          {/* Message with file limitations */}
          <div className="mt-4 text-center p-2 bg-muted/30 rounded-md">
            <p className="text-sm text-muted-foreground">
              Formats acceptés: PDF, images (JPG, PNG, GIF, etc.) • Taille max: 10 Mo
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Dialog for uploading files */}
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter des documents</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FileUpload
            missionId={mission.id}
            onUploadComplete={handleDocumentUploaded}
            variant="default"
            label="Sélectionner des fichiers"
            multiple={true}
            className="w-full"
          />
          
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
  </>;
};
