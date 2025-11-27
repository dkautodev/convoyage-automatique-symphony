import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Check, Eye, RefreshCw, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MissionInspectionSectionProps {
  isAdmin: boolean;
  isDriver: boolean;
  isClient?: boolean;
  missionId: string;
  ficheEdl?: string | null;
  pv?: string | null;
  pdfEdl?: string | null;
  onUpdate?: () => void;
}

type DocumentType = 'fiche_edl' | 'pv' | 'pdf_edl';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo
const BUCKET_NAME = 'driver-mission-upload';

export const MissionInspectionSection: React.FC<MissionInspectionSectionProps> = ({ 
  isAdmin, 
  isDriver,
  isClient = false,
  missionId,
  ficheEdl,
  pv,
  pdfEdl,
  onUpdate
}) => {
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [deleting, setDeleting] = useState<DocumentType | null>(null);
  const [openPopover, setOpenPopover] = useState<DocumentType | null>(null);
  
  const ficheEdlRef = useRef<HTMLInputElement>(null);
  const pvRef = useRef<HTMLInputElement>(null);
  const pdfEdlRef = useRef<HTMLInputElement>(null);

  const canEdit = isAdmin || isDriver;

  // Show for admin, driver, and client (if at least one document exists for client)
  const hasAnyDocument = !!ficheEdl || !!pv || !!pdfEdl;
  if (!isAdmin && !isDriver && (!isClient || !hasAnyDocument)) {
    return null;
  }

  const getDocumentPath = (type: DocumentType): string | null | undefined => {
    if (type === 'fiche_edl') return ficheEdl;
    if (type === 'pv') return pv;
    if (type === 'pdf_edl') return pdfEdl;
    return null;
  };

  const triggerFileInput = (type: DocumentType) => {
    setOpenPopover(null);
    if (type === 'fiche_edl') ficheEdlRef.current?.click();
    else if (type === 'pv') pvRef.current?.click();
    else if (type === 'pdf_edl') pdfEdlRef.current?.click();
  };

  const handleButtonClick = (type: DocumentType, isUploaded: boolean) => {
    if (isUploaded) {
      setOpenPopover(type);
    } else {
      triggerFileInput(type);
    }
  };

  const handleViewDocument = (filePath: string | null | undefined) => {
    if (!filePath) return;
    
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);
    
    if (data?.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
    setOpenPopover(null);
  };

  const deleteOldFile = async (filePath: string | null | undefined) => {
    if (!filePath) return;
    
    try {
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);
    } catch (error) {
      console.error('Error deleting old file:', error);
    }
  };

  const handleDeleteDocument = async (type: DocumentType) => {
    const currentPath = getDocumentPath(type);
    if (!currentPath) return;

    setDeleting(type);
    setOpenPopover(null);

    try {
      // Delete from storage
      await deleteOldFile(currentPath);

      // Update mission table to set column to null
      const updateData: Record<string, null> = {};
      updateData[type] = null;

      const { error: updateError } = await supabase
        .from('missions')
        .update(updateData)
        .eq('id', missionId);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success('Document supprimé');
      onUpdate?.();
    } catch (error) {
      console.error('Exception during delete:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: DocumentType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate PDF
    if (file.type !== 'application/pdf') {
      toast.error('Seuls les fichiers PDF sont acceptés');
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Le fichier ne doit pas dépasser 10 Mo');
      return;
    }

    setUploading(type);

    try {
      // Delete old file if exists
      const currentPath = getDocumentPath(type);
      if (currentPath) {
        await deleteOldFile(currentPath);
      }

      // Generate unique filename
      const fileId = Date.now();
      const sanitizedFileName = file.name.replace(/[^\w\d.-]/g, '_');
      const filePath = `${missionId}/${type}/${fileId}_${sanitizedFileName}`;

      // Upload to driver-mission-upload bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erreur lors de l\'upload du fichier');
        return;
      }

      // Update mission table with file path
      const updateData: Record<string, string> = {};
      updateData[type] = uploadData.path;

      const { error: updateError } = await supabase
        .from('missions')
        .update(updateData)
        .eq('id', missionId);

      if (updateError) {
        console.error('Update error:', updateError);
        toast.error('Erreur lors de la mise à jour de la mission');
        return;
      }

      toast.success('Document uploadé avec succès');
      onUpdate?.();
    } catch (error) {
      console.error('Exception during upload:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploading(null);
      // Reset input
      e.target.value = '';
    }
  };

  const documents = [
    { type: 'fiche_edl' as DocumentType, label: "Fiche d'état des lieux", ref: ficheEdlRef, uploaded: !!ficheEdl, path: ficheEdl },
    { type: 'pv' as DocumentType, label: 'PV complété', ref: pvRef, uploaded: !!pv, path: pv },
    { type: 'pdf_edl' as DocumentType, label: 'État des lieux', ref: pdfEdlRef, uploaded: !!pdfEdl, path: pdfEdl },
  ];

  // For clients, only show documents that have been uploaded
  const visibleDocuments = isClient ? documents.filter(doc => doc.uploaded) : documents;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          États des lieux et PV complétés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {visibleDocuments.map((doc) => (
            <div key={doc.type} className="relative">
              {canEdit && (
                <input
                  type="file"
                  ref={doc.ref}
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileChange(e, doc.type)}
                />
              )}
              
              {/* Client view: simple download button */}
              {isClient && doc.uploaded && (
                <Button 
                  variant="outline" 
                  className="h-10 px-4"
                  onClick={() => handleViewDocument(doc.path)}
                >
                  <span className="text-sm">{doc.label}</span>
                </Button>
              )}

              {/* Admin/Driver view with upload and popover menu */}
              {canEdit && (
                <>
                  {doc.uploaded ? (
                    <Popover open={openPopover === doc.type} onOpenChange={(open) => setOpenPopover(open ? doc.type : null)}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="h-10 px-4"
                          disabled={uploading === doc.type}
                        >
                          <span className="text-sm">
                            {uploading === doc.type ? 'Upload...' : doc.label}
                          </span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-2" align="center">
                        <div className="flex flex-col gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="justify-start gap-2"
                            onClick={() => handleViewDocument(doc.path)}
                          >
                            <Eye className="h-4 w-4" />
                            Afficher
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="justify-start gap-2"
                            onClick={() => triggerFileInput(doc.type)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Remplacer
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="justify-start gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDocument(doc.type)}
                            disabled={deleting === doc.type}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleting === doc.type ? 'Suppression...' : 'Supprimer'}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="h-10 px-4"
                      onClick={() => handleButtonClick(doc.type, doc.uploaded)}
                      disabled={uploading === doc.type}
                    >
                      <span className="text-sm">
                        {uploading === doc.type ? 'Upload...' : doc.label}
                      </span>
                    </Button>
                  )}
                </>
              )}
              
              {doc.uploaded && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-0.5">
                  <Check className="h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
