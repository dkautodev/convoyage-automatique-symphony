
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FileUpload from '@/components/mission/FileUpload';
import { X } from 'lucide-react';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  missionId?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploadDialog({
  open,
  onOpenChange,
  missionId,
  onUploadComplete
}: DocumentUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Ajouter des documents
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto" 
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <FileUpload 
            missionId={missionId} 
            onUploadComplete={(path, fileName) => {
              if (onUploadComplete) onUploadComplete();
              onOpenChange(false);
            }}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
