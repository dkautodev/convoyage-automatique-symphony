
-- Créer une fonction pour vérifier l'existence d'une contrainte
CREATE OR REPLACE FUNCTION public.check_constraint_exists(
  schema_name text,
  table_name text, 
  constraint_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE n.nspname = schema_name
    AND t.relname = table_name
    AND c.conname = constraint_name
  ) INTO constraint_exists;
  
  RETURN constraint_exists;
END;
$$;

-- Fonction pour désactiver temporairement la contrainte enforce_driver_fields
CREATE OR REPLACE FUNCTION public.disable_driver_fields_constraint()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  constraint_exists boolean;
BEGIN
  -- Vérifier si la contrainte existe
  SELECT public.check_constraint_exists('public', 'profiles', 'enforce_driver_fields') INTO constraint_exists;
  
  -- Si la contrainte existe, la supprimer
  IF constraint_exists THEN
    EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS enforce_driver_fields';
    
    -- Création d'une nouvelle contrainte plus flexible
    EXECUTE 'ALTER TABLE public.profiles ADD CONSTRAINT enforce_driver_fields
    CHECK (
      role <> ''chauffeur'' OR 
      (profile_completed = false) OR
      (
        profile_completed = true AND
        driver_license IS NOT NULL AND
        vehicle_type IS NOT NULL
      )
    );';
  END IF;
  
  RETURN true;
END;
$$;

-- Exécuter la fonction pour corriger la contrainte
SELECT public.disable_driver_fields_constraint();
