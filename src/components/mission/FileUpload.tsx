
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadFile } from '@/integrations/supabase/storage';
import { Upload, Loader2, File as FileIcon, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';

interface FileUploadProps {
  onUploadComplete?: (filePath: string, fileName: string) => void;
  missionId?: string;
  className?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default";
  label?: string;
}

export default function FileUpload({ 
  onUploadComplete, 
  missionId, 
  className,
  variant = "outline",
  size = "sm",
  label = "Sélectionner un document"
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile || !user?.id) {
      console.error("Missing file or user ID");
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Generate a unique file path
      const fileName = missionId 
        ? `${missionId}/${Date.now()}_${selectedFile.name}`
        : `uploads/${Date.now()}_${selectedFile.name}`;
      
      const filePath = `mission-docs/${fileName}`;
      console.log("Uploading file to path:", filePath);
      
      // Upload the file to storage
      const storagePath = await uploadFile(filePath, selectedFile);
      
      if (!storagePath) {
        toast.error("Échec du téléchargement");
        return;
      }
      
      console.log("File uploaded successfully, storage path:", storagePath);
      
      // If we have a mission ID, save the reference in the database
      if (missionId) {
        console.log("Saving document reference for mission:", missionId);
        const { error } = await typedSupabase
          .from('mission_documents')
          .insert({
            mission_id: missionId,
            file_name: selectedFile.name,
            file_path: storagePath,
            file_type: selectedFile.type,
            uploaded_by: user.id
          });
          
        if (error) {
          console.error("Error saving document reference:", error);
          toast.error("Échec de l'enregistrement du document");
          return;
        }
        
        console.log("Document reference saved successfully");
      }
      
      toast.success("Document téléchargé avec succès");
      
      // Call the callback if provided
      if (onUploadComplete) {
        onUploadComplete(storagePath, selectedFile.name);
      }
      
      // Reset the file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Erreur lors du téléchargement du document");
    } finally {
      setIsUploading(false);
    }
  };
  
  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      
      {!selectedFile ? (
        <Button 
          type="button" 
          variant={variant} 
          size={size}
          onClick={() => fileInputRef.current?.click()}
          className="h-8"
        >
          <Upload className="h-4 w-4 mr-2" />
          {label}
        </Button>
      ) : (
        <div className="flex items-center gap-2 border rounded-md p-2 bg-muted/30 h-8">
          <FileIcon className="h-4 w-4 shrink-0" />
          <span className="text-xs truncate max-w-[100px]">{selectedFile.name}</span>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={clearSelectedFile}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={handleFileUpload}
            disabled={isUploading}
            variant="default"
            size="sm"
            className="h-6"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
