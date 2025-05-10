
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
    
    // Important: Ne pas préfixer le chemin avec mission-docs/
    // Le chemin doit être directement utilisable dans le bucket
    const filePath = path;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
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
export async function uploadMissionDocument(missionId: string, file: File, userId: string): Promise<string | null> {
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    
    // Assurez-vous que le chemin commence par le missionId
    // Au lieu de mission-docs/uploads, utilisez directement missionId/
    const filePath = `${missionId}/${fileName}`;
    
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
        file_path: filePath,
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
