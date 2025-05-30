
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
    
    // Toujours utiliser 'documents' bucket pour tous les documents
    const bucketName = 'documents';
    
    // Sanitize the file path to avoid special characters
    const sanitizedPath = sanitizeStoragePath(path);
    console.log(`Using sanitized path: ${sanitizedPath} in bucket: ${bucketName}`);
    
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
export function getPublicUrl(path: string | null): string | null {
  if (!path) return null;
  
  try {
    // Always use 'documents' bucket for all files
    const bucketName = 'documents';
    
    console.log(`Getting public URL from bucket: ${bucketName} for path: ${path}`);
    
    if (!path.trim()) {
      console.error("Invalid path: Path is empty");
      return null;
    }
    
    // Ensure path doesn't start with slash for URL construction
    let cleanPath = path;
    if (cleanPath.startsWith('/')) {
      cleanPath = cleanPath.substring(1);
    }
    
    // Create a direct URL to avoid any potential issues with getPublicUrl
    const directUrl = `https://jaurkjcipcxkjimjlpiq.supabase.co/storage/v1/object/public/${bucketName}/${cleanPath}`;
    console.log("Direct public URL generated:", directUrl);
    return directUrl;
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
    // Generate a unique file identifier
    const fileId = Date.now();
    
    // Sanitize the original filename
    const sanitizedFileName = file.name.replace(/[^\w\d.-]/g, '_');
    
    // Create a path pattern that won't have special characters
    const filePath = `${missionId}/${fileId}_${sanitizedFileName}`;
    
    console.log(`Attempting to upload file to path: ${filePath}`);
    
    // Upload the file to storage
    const storagePath = await uploadFile(filePath, file);
    
    if (!storagePath) {
      console.error("File upload failed, no storage path returned");
      return null;
    }
    
    console.log(`File uploaded successfully to: ${storagePath}`);
    
    // Save the document reference in the database
    const { data, error } = await supabase
      .from('mission_documents')
      .insert({
        mission_id: missionId,
        file_name: file.name,
        file_path: storagePath, // Use the sanitized path returned from uploadFile
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
    
    // Add public URL to each document - toujours utiliser 'documents' bucket
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
 * Upload a driver invoice file
 * @param missionId The mission ID
 * @param file The invoice file
 * @param userId The user ID of the uploader
 * @returns The file path if successful, null if failed
 */
export async function uploadDriverInvoice(missionId: string, file: File, userId: string): Promise<string | null> {
  try {
    // Generate a unique file identifier
    const fileId = Date.now();
    
    // Sanitize the original filename
    const sanitizedFileName = file.name.replace(/[^\w\d.-]/g, '_');
    
    // Create a path pattern for driver invoices - toujours utiliser documents bucket
    const filePath = `driver_invoices/${missionId}/${fileId}_${sanitizedFileName}`;
    
    console.log(`Attempting to upload driver invoice to path: ${filePath}`);
    
    // Upload the file to storage
    const storagePath = await uploadFile(filePath, file);
    
    if (!storagePath) {
      console.error("Driver invoice upload failed, no storage path returned");
      return null;
    }
    
    console.log(`Driver invoice uploaded successfully to: ${storagePath}`);
    return storagePath;
  } catch (error) {
    console.error("Exception during driver invoice upload:", error);
    return null;
  }
}
