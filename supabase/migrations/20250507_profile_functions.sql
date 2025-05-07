
-- Function to update client profile that bypasses RLS
CREATE OR REPLACE FUNCTION public.update_client_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_company_name TEXT,
  p_billing_address JSONB,
  p_siret TEXT,
  p_tva_number TEXT,
  p_phone_1 TEXT,
  p_phone_2 TEXT,
  p_profile_completed BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = p_full_name,
    company_name = p_company_name,
    billing_address = p_billing_address,
    siret = p_siret,
    tva_number = p_tva_number,
    phone_1 = p_phone_1,
    phone_2 = p_phone_2,
    profile_completed = p_profile_completed
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('updated', TRUE);
END;
$$;

-- Function to create update_client_profile function through RPC if needed
CREATE OR REPLACE FUNCTION public.create_update_client_profile_function()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if function exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'update_client_profile'
    AND nspname = 'public'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Create function if it doesn't exist
  EXECUTE '
  CREATE OR REPLACE FUNCTION public.update_client_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_company_name TEXT,
    p_billing_address JSONB,
    p_siret TEXT,
    p_tva_number TEXT,
    p_phone_1 TEXT,
    p_phone_2 TEXT,
    p_profile_completed BOOLEAN
  ) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
  AS $func$
  BEGIN
    UPDATE public.profiles
    SET
      full_name = p_full_name,
      company_name = p_company_name,
      billing_address = p_billing_address,
      siret = p_siret,
      tva_number = p_tva_number,
      phone_1 = p_phone_1,
      phone_2 = p_phone_2,
      profile_completed = p_profile_completed
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(''updated'', TRUE);
  END;
  $func$;';
  
  RETURN TRUE;
END;
$$;

-- Function to update driver profile that bypasses RLS
CREATE OR REPLACE FUNCTION public.update_driver_profile(
  p_user_id UUID,
  p_full_name TEXT,
  p_company_name TEXT,
  p_billing_address JSONB,
  p_siret TEXT,
  p_tva_number TEXT,
  p_tva_applicable BOOLEAN,
  p_phone_1 TEXT,
  p_phone_2 TEXT,
  p_driver_license TEXT,
  p_vehicle_type TEXT,
  p_vehicle_registration TEXT,
  p_profile_completed BOOLEAN
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = p_full_name,
    company_name = p_company_name,
    billing_address = p_billing_address,
    siret = p_siret,
    tva_number = p_tva_number,
    tva_applicable = p_tva_applicable,
    phone_1 = p_phone_1,
    phone_2 = p_phone_2,
    driver_license = p_driver_license,
    vehicle_type = p_vehicle_type::vehicle_category,
    vehicle_registration = p_vehicle_registration,
    profile_completed = p_profile_completed
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('updated', TRUE);
END;
$$;

-- Function to create update_driver_profile function through RPC if needed
CREATE OR REPLACE FUNCTION public.create_update_driver_profile_function()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if function exists
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace
    WHERE proname = 'update_driver_profile'
    AND nspname = 'public'
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Create function if it doesn't exist
  EXECUTE '
  CREATE OR REPLACE FUNCTION public.update_driver_profile(
    p_user_id UUID,
    p_full_name TEXT,
    p_company_name TEXT,
    p_billing_address JSONB,
    p_siret TEXT,
    p_tva_number TEXT,
    p_tva_applicable BOOLEAN,
    p_phone_1 TEXT,
    p_phone_2 TEXT,
    p_driver_license TEXT,
    p_vehicle_type TEXT,
    p_vehicle_registration TEXT,
    p_profile_completed BOOLEAN
  ) RETURNS JSONB
  LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
  AS $func$
  BEGIN
    UPDATE public.profiles
    SET
      full_name = p_full_name,
      company_name = p_company_name,
      billing_address = p_billing_address,
      siret = p_siret,
      tva_number = p_tva_number,
      tva_applicable = p_tva_applicable,
      phone_1 = p_phone_1,
      phone_2 = p_phone_2,
      driver_license = p_driver_license,
      vehicle_type = p_vehicle_type::vehicle_category,
      vehicle_registration = p_vehicle_registration,
      profile_completed = p_profile_completed
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(''updated'', TRUE);
  END;
  $func$;';
  
  RETURN TRUE;
END;
$$;
