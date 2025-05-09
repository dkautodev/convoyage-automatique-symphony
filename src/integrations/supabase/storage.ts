
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
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, file);
      
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
    const { data } = supabase.storage.from('documents').getPublicUrl(path);
    return data.publicUrl;
  } catch (error) {
    console.error("Error getting public URL:", error);
    return null;
  }
}
