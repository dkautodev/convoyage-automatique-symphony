
-- Améliorer la fonction handle_new_user pour gérer l'insertion dans la table profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insérer le nouveau profil dans la table profiles
  INSERT INTO public.profiles (id, email, role, created_at, last_login, active, profile_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    (CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'chauffeur' THEN 'chauffeur'::user_role
      ELSE 'client'::user_role
    END),
    now(),
    now(),
    true,
    false
  );
  
  -- Si c'est un admin, marquer le profil comme complet
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    UPDATE public.profiles SET profile_completed = true WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;
