
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
    
    // Check which bucket to use based on the file path prefix
    const bucketName = path.startsWith('mission-docs/') ? 'mission-docs' : 'documents';
    const filePath = path.startsWith('mission-docs/') ? path.replace('mission-docs/', '') : path;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error("Error uploading file:", error);
      return null;
    }
    
    console.log("File uploaded successfully:", data?.path);
    // Return the full path including bucket prefix for consistency
    return bucketName + '/' + data?.path || null;
  } catch (error) {
    console.error("Exception during file upload:", error);
    return null;
  }
}

/**
 * Get a public URL for a file in storage
 * @param path The storage path of the file
 * @returns The public URL of the file
 */
export function getPublicUrl(path: string): string | null {
  try {
    // Check which bucket the file is in
    const bucketName = path.startsWith('mission-docs/') ? 'mission-docs' : 'documents';
    const filePath = path.replace(bucketName + '/', '');
    
    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
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
export async function uploadMissionDocument(missionId: string, file: File, userId: string): Promise<string | null> {
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${missionId}/${Date.now()}_${file.name}`;
    const filePath = `mission-docs/${fileName}`;
    
    // Upload the file to storage
    const storagePath = await uploadFile(filePath, file);
    
    if (!storagePath) {
      return null;
    }
    
    // Save the document reference in the database
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
