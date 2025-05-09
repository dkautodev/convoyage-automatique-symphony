
import { supabase } from '@/integrations/supabase/client';

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
    const { data: constraintExists } = await supabase.rpc('check_constraint_exists', { 
      schema_name: 'public', 
      table_name: 'profiles', 
      constraint_name: 'enforce_driver_fields' 
    });
    
    // Si la contrainte existe, la supprimer pour permettre l'inscription initiale
    if (constraintExists) {
      console.log('Dropping enforce_driver_fields constraint temporarily');
      await supabase.rpc('disable_driver_fields_constraint');
    }
    
    return true;
  } catch (error) {
    console.error('Error checking driver fields constraint:', error);
    return false;
  }
};
