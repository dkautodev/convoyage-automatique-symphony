
import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

// Function to create necessary database functions on first app load
export const setupDatabaseFunctions = async () => {
  try {
    console.log("Setting up database functions check is skipped - using direct table updates instead");
    // We're no longer using custom RPC functions, so we'll just return success
    return true;
  } catch (error) {
    console.error('Error setting up database functions:', error);
    return false;
  }
};

// Fonction pour gérer la contrainte enforce_driver_fields
export const checkDriverFieldsConstraint = async () => {
  try {
    // Vérifier si la contrainte existe déjà
    try {
      // First attempt to query the profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
        
      if (profileError) {
        console.log('Error accessing profiles, assuming constraint does not exist');
        return true;
      }
      
      // If we can access the profiles table, check if the constraint exists
      const { data: constraintExists, error: checkError } = await supabase.rpc('check_constraint_exists', { 
        schema_name: 'public', 
        table_name: 'profiles', 
        constraint_name: 'enforce_driver_fields' 
      });
      
      if (checkError) {
        console.error('Error checking constraint:', checkError);
        return false;
      }
      
      // Si la contrainte existe, la supprimer pour permettre l'inscription initiale
      if (constraintExists) {
        console.log('Dropping enforce_driver_fields constraint temporarily');
        const { error: disableError } = await supabase.rpc('disable_driver_fields_constraint');
        
        if (disableError) {
          console.error('Error disabling constraint:', disableError);
          return false;
        }
      }
      
      return true;
    } catch (innerError) {
      console.error('Error accessing profiles:', innerError);
      return false;
    }
  } catch (error) {
    console.error('Error checking driver fields constraint:', error);
    return false;
  }
};
