
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';

export interface ProfileOption {
  id: string;
  label: string;
  email: string;
}

export const useProfiles = (role: UserRole) => {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('role', role)
          .eq('active', true)
          .order('company_name', { ascending: true });
          
        if (error) {
          throw error;
        }
        
        // Format data for select options
        const options = data.map(profile => ({
          id: profile.id,
          label: role === 'client' 
            ? (profile.company_name || profile.full_name || profile.email)
            : (profile.full_name || profile.email),
          email: profile.email
        }));
        
        console.log(`Loaded ${options.length} ${role} profiles:`, options);
        setProfiles(options);
      } catch (err: any) {
        console.error(`Error fetching ${role} profiles:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfiles();
  }, [role]);
  
  return { profiles, loading, error };
};
