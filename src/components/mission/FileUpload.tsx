
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadFile } from '@/integrations/supabase/storage';
import { Upload, Loader2, File as FileIcon, X, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';

// Constantes pour les limitations
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo en octets
const ALLOWED_FILE_TYPES = [
  'application/pdf', // PDF
  'image/jpeg',      // JPEG
  'image/png',       // PNG
  'image/gif',       // GIF
  'image/webp',      // WebP
  'image/svg+xml'    // SVG
];

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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  const validateFile = (file: File): string | null => {
    // Vérification de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return `Fichier trop volumineux (max: 10 Mo)`;
    }
    
    // Vérification du type de fichier
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return 'Format de fichier non supporté (formats acceptés: PDF et images)';
    }
    
    return null;
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateFile(file);
      
      if (validationError) {
        setError(validationError);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setSelectedFile(file);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile || !user?.id) return;
    
    try {
      setIsUploading(true);
      
      // Generate a unique file path
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = missionId 
        ? `${missionId}/${Date.now()}_${selectedFile.name}`
        : `uploads/${Date.now()}_${selectedFile.name}`;
      
      const filePath = `mission-docs/${fileName}`;
      
      // Upload the file to storage
      const storagePath = await uploadFile(filePath, selectedFile);
      
      if (!storagePath) {
        toast.error("Échec du téléchargement");
        return;
      }
      
      // If we have a mission ID, save the reference in the database
      if (missionId) {
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
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center gap-2 ${className}`}>
        <input 
          type="file" 
          className="hidden" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.svg" // Restriction des types via HTML
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
      
      {error && (
        <div className="flex items-center text-xs text-destructive gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="text-xs text-muted-foreground mt-1">
        Formats acceptés: PDF, images (JPG, PNG, GIF, etc.) • Taille max: 10 Mo
      </div>
    </div>
  );
}
