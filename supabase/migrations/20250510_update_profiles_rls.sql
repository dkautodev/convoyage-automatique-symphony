
-- Activer la sécurité par ligne (RLS) sur la table profiles si ce n'est pas déjà fait
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les admins peuvent modifier tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Insertion autorisée pour les nouveaux profils" ON public.profiles;

-- Créer une politique permettant aux utilisateurs de voir leur propre profil
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Créer une politique permettant aux utilisateurs de modifier leur propre profil
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Créer une politique permettant aux administrateurs de voir tous les profils
CREATE POLICY "Les admins peuvent voir tous les profils" 
ON public.profiles 
FOR SELECT 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Créer une politique permettant aux administrateurs de modifier tous les profils
CREATE POLICY "Les admins peuvent modifier tous les profils" 
ON public.profiles 
FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Créer une politique permettant l'insertion des profils (pour la création de compte)
CREATE POLICY "Insertion autorisée pour les nouveaux profils" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Activer la sécurité par ligne (RLS) sur la table drivers si ce n'est pas déjà fait
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil chauffeur" ON public.drivers;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil chauffeur" ON public.drivers;
DROP POLICY IF EXISTS "Les admins peuvent voir tous les profils chauffeurs" ON public.drivers;
DROP POLICY IF EXISTS "Les admins peuvent modifier tous les profils chauffeurs" ON public.drivers;
DROP POLICY IF EXISTS "Insertion autorisée pour les nouveaux profils chauffeurs" ON public.drivers;
DROP POLICY IF EXISTS "Les utilisateurs peuvent insérer leur propre profil chauffeur" ON public.drivers;

-- Créer une politique permettant aux utilisateurs de voir leur propre profil chauffeur
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil chauffeur" 
ON public.drivers 
FOR SELECT 
USING (auth.uid() = id);

-- Créer une politique permettant aux utilisateurs de modifier leur propre profil chauffeur
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil chauffeur" 
ON public.drivers 
FOR UPDATE 
USING (auth.uid() = id);

-- Créer une politique permettant aux administrateurs de voir tous les profils chauffeurs
CREATE POLICY "Les admins peuvent voir tous les profils chauffeurs" 
ON public.drivers 
FOR SELECT 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Créer une politique permettant aux administrateurs de modifier tous les profils chauffeurs
CREATE POLICY "Les admins peuvent modifier tous les profils chauffeurs" 
ON public.drivers 
FOR UPDATE 
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Créer une politique permettant aux utilisateurs d'insérer leur propre profil chauffeur
CREATE POLICY "Les utilisateurs peuvent insérer leur propre profil chauffeur" 
ON public.drivers 
FOR INSERT 
WITH CHECK (auth.uid() = id);
