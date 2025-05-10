import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadFile } from '@/integrations/supabase/storage';
import { Upload, Loader2, File as FileIcon, X, AlertCircle, PaperclipIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { cn } from '@/lib/utils';

// File limitation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes
const ALLOWED_FILE_TYPES = ['application/pdf',
// PDF
'image/jpeg',
// JPEG
'image/png',
// PNG
'image/gif',
// GIF
'image/webp',
// WebP
'image/svg+xml' // SVG
];
interface FileUploadProps {
  onUploadComplete?: (filePath?: string, fileName?: string) => void;
  missionId?: string;
  className?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default";
  label?: string;
  multiple?: boolean;
}
export default function FileUpload({
  onUploadComplete,
  missionId,
  className = '',
  variant = "outline",
  size = "sm",
  label = "Sélectionner un document",
  multiple = false
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showFileDialog, setShowFileDialog] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const {
    user
  } = useAuth();
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `Fichier trop volumineux (max: 10 Mo): ${file.name}`;
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Format non supporté (${file.name}). Formats acceptés: PDF et images`;
    }
    return null;
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = [];
      let hasError = false;

      // Check each selected file
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          hasError = true;
          break;
        }
        newFiles.push(file);
      }
      if (!hasError) {
        setSelectedFiles(newFiles);
      } else {
        // Reset the file input in case of error
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles: File[] = [];
      let hasError = false;
      for (const file of droppedFiles) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          hasError = true;
          break;
        }
        newFiles.push(file);
      }
      if (!hasError) {
        setSelectedFiles(multiple ? newFiles : [newFiles[0]]);
      }
    }
  }, [multiple]);
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0 || !user?.id) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;
      console.log("Uploading files, total count:", totalFiles);
      if (missionId) {
        console.log("Mission ID for uploads:", missionId);
      }

      // Upload each file
      for (const file of selectedFiles) {
        // Create sanitized file name to prevent path issues
        const fileId = Date.now(); // Unique identifier
        const sanitizedName = file.name.replace(/[^\w\d.-]/g, '_'); // Remove special chars

        let filePath;
        if (missionId) {
          filePath = `${missionId}/${fileId}_${sanitizedName}`;
          console.log(`Creating mission document path: ${filePath}`);
        } else {
          filePath = `uploads/${fileId}_${sanitizedName}`;
          console.log(`Creating general upload path: ${filePath}`);
        }

        // Upload the file to storage
        const storagePath = await uploadFile(filePath, file);
        if (!storagePath) {
          toast.error(`Échec du téléchargement: ${file.name}`);
          continue;
        }

        // If we have a mission ID, save the reference in the database
        if (missionId) {
          console.log(`Saving reference to database for mission ${missionId}`);
          const {
            error
          } = await typedSupabase.from('mission_documents').insert({
            mission_id: missionId,
            file_name: file.name,
            file_path: storagePath,
            file_type: file.type,
            uploaded_by: user.id
          });
          if (error) {
            console.error("Error saving document reference:", error);
            toast.error(`Échec de l'enregistrement du document: ${file.name}`);
            continue;
          }
        }
        uploadedCount++;
        setUploadProgress(Math.round(uploadedCount / totalFiles * 100));

        // Call the callback if provided
        if (onUploadComplete) {
          onUploadComplete(storagePath, file.name);
        }
      }

      // Success message adapted to the number of uploaded files
      if (uploadedCount === totalFiles) {
        toast.success(totalFiles > 1 ? `${totalFiles} documents téléchargés avec succès` : "Document téléchargé avec succès");
      } else if (uploadedCount > 0) {
        toast.success(`${uploadedCount}/${totalFiles} documents téléchargés`);
      }

      // Reset the file input
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erreur lors du téléchargement des documents");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  const toggleFileDialog = () => {
    setShowFileDialog(!showFileDialog);
  };
  return (
    <>
      <div className={`relative ${className}`}>
        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} multiple={multiple} accept=".pdf,.jpg,.jpeg,.png" />
        
        {selectedFiles.length > 0 && (
          <div className="border rounded-md p-3 bg-muted/30 mb-2">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">
                {selectedFiles.length} fichier{selectedFiles.length > 1 ? 's' : ''} sélectionné{selectedFiles.length > 1 ? 's' : ''}
              </h4>
              <Button type="button" variant="ghost" size="sm" onClick={clearSelectedFiles} className="h-6 p-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="max-h-32 overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center text-xs p-1 mb-1 bg-background rounded">
                  <FileIcon className="h-3 w-3 mr-2 shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="ml-auto text-muted-foreground shrink-0">
                    {(file.size / 1024).toFixed(1)} Ko
                  </span>
                </div>
              ))}
            </div>
            
            <Button type="button" onClick={handleFileUpload} disabled={isUploading} variant="default" size="sm" className="w-full mt-2">
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Téléchargement...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Télécharger
                </>
              )}
            </Button>
          </div>
        )}
        
        {isUploading && uploadProgress > 0 && (
          <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-300 ease-in-out" 
              style={{
                width: `${uploadProgress}%`
              }}
            ></div>
          </div>
        )}
        
        {error && (
          <div className="flex items-center text-xs text-destructive gap-1 mt-1">
            <AlertCircle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </>
  );
}
