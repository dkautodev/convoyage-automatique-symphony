-- Configuration des politiques RLS pour le bucket driver-mission-upload

-- Politique de lecture (SELECT) : admin, chauffeur et client peuvent lire
CREATE POLICY "driver_mission_upload_read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'driver-mission-upload' 
  AND (
    get_current_user_role() = 'admin'
    OR get_current_user_role() = 'chauffeur'
    OR get_current_user_role() = 'client'
  )
);

-- Politique d'upload (INSERT) : seulement admin et chauffeur
CREATE POLICY "driver_mission_upload_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'driver-mission-upload'
  AND (
    get_current_user_role() = 'admin'
    OR get_current_user_role() = 'chauffeur'
  )
);

-- Politique de suppression (DELETE) : seulement admin
CREATE POLICY "driver_mission_upload_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'driver-mission-upload'
  AND get_current_user_role() = 'admin'
);

-- Politique de mise à jour (UPDATE) : seulement admin
CREATE POLICY "driver_mission_upload_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'driver-mission-upload'
  AND get_current_user_role() = 'admin'
)
WITH CHECK (
  bucket_id = 'driver-mission-upload'
  AND get_current_user_role() = 'admin'
);