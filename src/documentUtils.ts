
// Remplacer ce fichier entièrement car il utilise un bucket incorrect

import { supabase } from '@/integrations/supabase/client';
import { LegalStatusType } from '@/hooks/auth/types';

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
    console.log(`Trying to upload ${documentType} document for user ${userId}`);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${documentType}_${Date.now()}.${fileExt}`;
    
    // Upload file to storage bucket - using 'documents' bucket
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      console.error('Error uploading document:', error);
      return null;
    }
    
    console.log('Document uploaded successfully:', data.path);
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
      .from('documents')
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
 * @param legalStatus Legal status of the driver's business
 * @returns Success boolean
 */
export async function updateDriverDocumentPath(
  userId: string,
  documentType: 'kbis' | 'vigilance' | 'license' | 'id',
  filePath: string,
  legalStatus: LegalStatusType
): Promise<boolean> {
  try {
    console.log(`Updating document path for ${documentType} document, user ${userId}`);
    
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
    
    // Make sure the user has a drivers_config record first
    const { data: existingConfig } = await supabase
      .from('drivers_config')
      .select('id')
      .eq('id', userId)
      .single();
      
    // If no config exists yet, create one
    if (!existingConfig) {
      const { error: insertError } = await supabase
        .from('drivers_config')
        .insert({
          id: userId,
          legal_status: legalStatus,
          [fieldName]: filePath
        });
        
      if (insertError) {
        console.error('Error creating new driver config:', insertError);
        return false;
      }
    } else {
      // Update existing config
      const { error: updateError } = await supabase
        .from('drivers_config')
        .update({ [fieldName]: filePath })
        .eq('id', userId);
        
      if (updateError) {
        console.error('Error updating document path:', updateError);
        return false;
      }
    }
    
    console.log(`Successfully updated ${documentType} document path in database`);
    return true;
  } catch (error) {
    console.error('Error in updateDriverDocumentPath:', error);
    return false;
  }
}
