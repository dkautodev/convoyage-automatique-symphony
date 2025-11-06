-- Enable RLS on fac_admin_config table
ALTER TABLE public.fac_admin_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read
CREATE POLICY "All authenticated users can read fac_admin_config"
ON public.fac_admin_config
FOR SELECT
TO authenticated
USING (true);

-- Policy: Only admins can insert
CREATE POLICY "Only admins can insert fac_admin_config"
ON public.fac_admin_config
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Policy: Only admins can update
CREATE POLICY "Only admins can update fac_admin_config"
ON public.fac_admin_config
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);

-- Policy: Only admins can delete
CREATE POLICY "Only admins can delete fac_admin_config"
ON public.fac_admin_config
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::user_role
  )
);