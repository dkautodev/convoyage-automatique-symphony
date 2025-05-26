// useProfiles.ts
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/supabase';
import { useAuth } from '@/hooks/auth';

// Définition et export du type ProfileOption
export interface ProfileOption {
  id: string;
  label: string;
  email: string;
}

// Hook personnalisé
export const useProfiles = (role: UserRole) => {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { profile } = useAuth(); // Utilisation de useAuth

  useEffect(() => {
    const fetchProfiles = async () => {
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
        
        // Formatage des données
        const options = data.map(profile => ({
          id: profile.id,
          label: role === 'client' 
            ? (profile.company_name || profile.full_name || profile.email)
            : (profile.full_name || profile.email),
          email: profile.email
        }));
        
        console.log(`Loaded ${options.length} profiles`);
        setProfiles(options);
      } catch (err) {
        console.error(`Erreur lors de la récupération des profils:`, err);
        setError("Impossible de charger les profils");
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [role]);

  return { profiles, loading, error };
};