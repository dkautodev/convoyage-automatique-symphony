
-- Activer la sécurité par ligne (RLS) sur la table admin_invitation_tokens
ALTER TABLE public.admin_invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Créer une politique permettant aux utilisateurs anonymes de lire la table
CREATE POLICY "Permettre la lecture des tokens d'invitation aux utilisateurs anonymes" 
ON public.admin_invitation_tokens 
FOR SELECT 
TO anon
USING (true);

-- Créer une politique permettant aux utilisateurs anonymes de marquer un token comme utilisé
CREATE POLICY "Permettre la mise à jour des tokens d'invitation aux utilisateurs anonymes"
ON public.admin_invitation_tokens
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Créer une politique permettant uniquement aux utilisateurs authentifiés avec le rôle admin d'insérer de nouveaux tokens
CREATE POLICY "Seuls les admins peuvent créer de nouveaux tokens"
ON public.admin_invitation_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Créer une politique permettant uniquement aux utilisateurs authentifiés avec le rôle admin de supprimer des tokens
CREATE POLICY "Seuls les admins peuvent supprimer des tokens"
ON public.admin_invitation_tokens
FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
