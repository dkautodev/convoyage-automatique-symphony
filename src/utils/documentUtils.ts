
import { supabase } from '@/integrations/supabase/client';

/**
 * Upload a driver document to storage
 * @param userId The user ID
 * @param file The file to upload
 * @param documentType The type of document being uploaded
 * @returns The file path if successful, null if failed
 */
export async function uploadDriverDocument(
  userId: string, 
  file: File, 
  documentType: 'kbis' | 'vigilance' | 'license' | 'id'
): Promise<string | null> {
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
    
    // Upload file to storage bucket
    const { data, error } = await supabase.storage
      .from('driver_doc_config')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Error uploading document:', error);
      return null;
    }
    
    return data.path;
  } catch (error) {
    console.error('Error in uploadDriverDocument:', error);
    return null;
  }
}

/**
 * Get a public URL for a stored driver document
 * @param path The storage path of the document
 * @returns The public URL of the document
 */
export function getDriverDocumentUrl(path: string | null): string | null {
  if (!path) return null;
  
  try {
    const { data } = supabase.storage
      .from('driver_doc_config')
      .getPublicUrl(path);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
}

/**
 * Update driver document info in database
 * @param userId User ID
 * @param documentType Type of document
 * @param filePath Storage path of the document
 * @returns Success boolean
 */
export async function updateDriverDocumentPath(
  userId: string,
  documentType: 'kbis' | 'vigilance' | 'license' | 'id',
  filePath: string
): Promise<boolean> {
  try {
    let fieldName: string;
    
    switch (documentType) {
      case 'kbis':
        fieldName = 'kbis_document_path';
        break;
      case 'vigilance':
        fieldName = 'vigilance_document_path';
        break;
      case 'license':
        fieldName = 'license_document_path';
        break;
      case 'id':
        fieldName = 'id_document_path';
        break;
      default:
        throw new Error('Invalid document type');
    }
    
    const { error } = await supabase
      .from('drivers_config')
      .upsert({ 
        id: userId, 
        [fieldName]: filePath 
      }, { 
        onConflict: 'id' 
      });
    
    if (error) {
      console.error('Error updating document path:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateDriverDocumentPath:', error);
    return false;
  }
}
