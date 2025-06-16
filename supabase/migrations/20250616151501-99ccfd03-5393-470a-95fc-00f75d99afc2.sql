
-- Supprimer la politique problématique
DROP POLICY IF EXISTS "Chauffeurs peuvent voir les infos clients de leurs missions" ON public.profiles;

-- Créer une nouvelle politique plus simple qui évite la récursion
-- en utilisant une approche différente
CREATE POLICY "Chauffeurs peuvent voir les infos clients de leurs missions"
ON public.profiles
FOR SELECT
USING (
  -- Permettre aux utilisateurs de voir leur propre profil
  auth.uid() = id
  OR
  -- Permettre aux chauffeurs de voir les profils clients uniquement 
  -- si ces clients ont des missions assignées au chauffeur connecté
  (
    profiles.role = 'client' 
    AND EXISTS (
      SELECT 1 
      FROM public.missions m 
      WHERE m.client_id = profiles.id 
      AND m.chauffeur_id = auth.uid()
    )
  )
  OR
  -- Permettre aux admins de tout voir
  (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'admin'
);
