
-- Créer une politique RLS permettant aux chauffeurs de voir les informations clients
-- uniquement pour les missions qui leur sont assignées
CREATE POLICY "Chauffeurs peuvent voir les infos clients de leurs missions"
ON public.profiles
FOR SELECT
USING (
  -- Permettre aux chauffeurs de voir les profils clients uniquement 
  -- si ces clients ont des missions assignées au chauffeur connecté
  EXISTS (
    SELECT 1 
    FROM public.missions m 
    WHERE m.client_id = profiles.id 
    AND m.chauffeur_id = auth.uid()
    AND profiles.role = 'client'
  )
);
