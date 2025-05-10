
import { supabase } from './client';

/**
 * Upload a file to Supabase storage
 * @param path The storage path for the file
 * @param file The file to upload
 * @returns The file path if successful, null if failed
 */
export async function uploadFile(path: string, file: File): Promise<string | null> {
  try {
    console.log(`Uploading file to ${path}`);
    
    // All files should use the 'documents' bucket
    const bucketName = 'documents';
    
    // Sanitize the file path to avoid special characters
    const sanitizedPath = sanitizeStoragePath(path);
    console.log(`Using sanitized path: ${sanitizedPath}`);
    
    // Upload file to the bucket
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(sanitizedPath, file, {
        cacheControl: '3600',
        upsert: true // Change to true to overwrite existing files with the same name
      });
      
    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }
    
    console.log("File uploaded successfully:", data?.path);
    return data?.path || null;
  } catch (error) {
    console.error("Exception during file upload:", error);
    return null;
  }
}

/**
 * Sanitize file path for storage
 * @param path The original path
 * @returns A sanitized path safe for storage
 */
function sanitizeStoragePath(path: string): string {
  // Replace spaces and special characters
  let sanitized = path.replace(/[^\w\d.-]/g, '_');
  
  // Ensure path doesn't start with slash
  if (sanitized.startsWith('/')) {
    sanitized = sanitized.substring(1);
  }
  
  return sanitized;
}

/**
 * Get a public URL for a file in storage
 * @param path The storage path of the file
 * @returns The public URL of the file
 */
export function getPublicUrl(path: string): string | null {
  try {
    // All files use the 'documents' bucket now
    const bucketName = 'documents';
    
    const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting public URL:", error);
    return null;
  }
}

/**
 * Upload a document for a specific mission
 * @param missionId The mission ID
 * @param file The file to upload
 * @param userId The user ID of the uploader
 * @returns The document ID if successful, null if failed
 */
export async function uploadMissionDocument(missionId: string | undefined, file: File, userId: string): Promise<string | null> {
  try {
    // Generate a unique file identifier
    const fileId = Date.now();
    
    // Sanitize the original filename
    const sanitizedFileName = file.name.replace(/[^\w\d.-]/g, '_');
    
    // Create a path pattern that won't have special characters
    const filePath = missionId 
      ? `${missionId}/${fileId}_${sanitizedFileName}` 
      : `pending/${fileId}_${sanitizedFileName}`;
    
    console.log(`Attempting to upload file to path: ${filePath}`);
    
    // Upload the file to storage
    const storagePath = await uploadFile(filePath, file);
    
    if (!storagePath) {
      console.error("File upload failed, no storage path returned");
      return null;
    }
    
    console.log(`File uploaded successfully to: ${storagePath}`);
    
    // If there's no mission ID, this is a pending document for a mission being created
    // Let's save it to mission_documents with a null mission_id, we'll update it later
    if (!missionId) {
      const { data, error } = await supabase
        .from('mission_documents')
        .insert({
          mission_id: null,  // This will be updated once the mission is created
          file_name: file.name,
          file_path: storagePath,
          file_type: file.type,
          uploaded_by: userId
        })
        .select('id')
        .single();
        
      if (error) {
        console.error("Error saving pending document:", error);
        return null;
      }
      
      return data.id;
    } else {
      // Save the document reference in the database with the mission ID
      const { data, error } = await supabase
        .from('mission_documents')
        .insert({
          mission_id: missionId,
          file_name: file.name,
          file_path: storagePath,
          file_type: file.type,
          uploaded_by: userId
        })
        .select('id')
        .single();
        
      if (error) {
        console.error("Error saving document reference:", error);
        return null;
      }
      
      return data.id;
    }
  } catch (error) {
    console.error("Exception during mission document upload:", error);
    return null;
  }
}

/**
 * Get all documents for a specific mission
 * @param missionId The mission ID
 * @returns Array of mission documents
 */
export async function getMissionDocuments(missionId: string) {
  try {
    const { data, error } = await supabase
      .from('mission_documents')
      .select('*')
      .eq('mission_id', missionId)
      .order('uploaded_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching mission documents:", error);
      return [];
    }
    
    // Add public URL to each document
    return data.map(doc => ({
      ...doc,
      publicUrl: getPublicUrl(doc.file_path)
    }));
  } catch (error) {
    console.error("Exception during fetching mission documents:", error);
    return [];
  }
}

/**
 * Associate pending documents with a new mission
 * @param pendingDocumentIds Array of document IDs to associate
 * @param missionId The mission ID to associate with
 * @returns true if successful, false if failed
 */
export async function associatePendingDocumentsWithMission(pendingDocumentIds: string[], missionId: string): Promise<boolean> {
  if (!pendingDocumentIds.length) return true;
  
  try {
    const { error } = await supabase
      .from('mission_documents')
      .update({ mission_id: missionId })
      .in('id', pendingDocumentIds);
      
    if (error) {
      console.error("Error associating pending documents with mission:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception during document association:", error);
    return false;
  }
}
