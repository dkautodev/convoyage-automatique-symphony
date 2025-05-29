
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DriverConfigData {
  license_number?: string;
  id_number?: string;
  legal_status?: 'EI' | 'EURL' | 'SARL' | 'SA' | 'SAS' | 'SASU' | 'SNC' | 'Scop' | 'Association';
}

export const useDriverConfig = () => {
  const [loading, setLoading] = useState(false);

  const updateDriverConfig = async (userId: string, data: DriverConfigData) => {
    try {
      setLoading(true);
      
      const { data: result, error } = await supabase.rpc('update_driver_config_info', {
        p_user_id: userId,
        p_license_number: data.license_number || null,
        p_id_number: data.id_number || null,
        p_legal_status: data.legal_status || null
      });

      if (error) {
        console.error('Error updating driver config:', error);
        throw error;
      }

      console.log('Driver config updated successfully:', result);
      return result;
    } catch (error: any) {
      console.error('Error in updateDriverConfig:', error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getDriverConfig = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('drivers_config')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error fetching driver config:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('Error in getDriverConfig:', error);
      return null;
    }
  };

  return {
    updateDriverConfig,
    getDriverConfig,
    loading
  };
};
