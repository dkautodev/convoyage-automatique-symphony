
import { supabase } from '@/integrations/supabase/client';

// Function to create necessary database functions on first app load
export const setupDatabaseFunctions = async () => {
  try {
    // Create update_client_profile function
    await supabase.rpc('create_update_client_profile_function');
    console.log('Client profile update function created or already exists');
    
    // Create update_driver_profile function
    await supabase.rpc('create_update_driver_profile_function');
    console.log('Driver profile update function created or already exists');
    
    return true;
  } catch (error) {
    console.error('Error setting up database functions:', error);
    return false;
  }
};
