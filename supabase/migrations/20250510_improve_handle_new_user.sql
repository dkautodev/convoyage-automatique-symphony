
-- Améliorer la fonction handle_new_user pour gérer l'insertion dans la table drivers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insérer le nouveau profil dans la table profiles
  INSERT INTO public.profiles (id, email, role, full_name, profile_completed)
  VALUES (
    NEW.id, 
    NEW.email, 
    (CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'admin' THEN 'admin'::user_role
      WHEN NEW.raw_user_meta_data->>'role' = 'chauffeur' THEN 'chauffeur'::user_role
      ELSE 'client'::user_role
    END),
    NEW.raw_user_meta_data->>'fullName',
    false
  );
  
  -- Si c'est un chauffeur, préparer une entrée de base dans la table drivers
  IF NEW.raw_user_meta_data->>'role' = 'chauffeur' THEN
    INSERT INTO public.drivers (id, full_name, phone1)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'fullName',
      ''  -- Phone1 est obligatoire mais sera mis à jour lors de la complétion du profil
    );
  END IF;
  
  -- Si c'est un admin, marquer le profil comme complet
  IF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    UPDATE public.profiles SET profile_completed = true WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;
