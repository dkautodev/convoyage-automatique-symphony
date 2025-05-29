
import { supabase } from '@/integrations/supabase/client';

export interface DriverConfigUpdate {
  license_number?: string;
  id_number?: string;
  legal_status?: 'EI' | 'EURL' | 'SARL' | 'SA' | 'SAS' | 'SASU' | 'SNC' | 'Scop' | 'Association';
}

export const updateDriverConfigService = async (userId: string, config: DriverConfigUpdate): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('update_driver_config_info', {
      p_user_id: userId,
      p_license_number: config.license_number || null,
      p_id_number: config.id_number || null,
      p_legal_status: config.legal_status || null
    });

    if (error) {
      console.error('Error updating driver config:', error);
      throw error;
    }

    console.log('Driver config updated successfully:', data);
  } catch (err) {
    console.error('Exception in updateDriverConfigService:', err);
    throw err;
  }
};

export const fetchDriverConfig = async (userId: string) => {
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
  } catch (err) {
    console.error('Exception in fetchDriverConfig:', err);
    return null;
  }
};
