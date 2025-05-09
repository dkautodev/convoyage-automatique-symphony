
// Import des types nécessaires
import { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';
import { Json } from '@/integrations/supabase/types';

// URL et clé Supabase (utilisez les mêmes valeurs que dans le fichier src/integrations/supabase/client.ts)
const SUPABASE_URL = "https://jaurkjcipcxkjimjlpiq.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdXJramNpcGN4a2ppbWpscGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MTQzNDUsImV4cCI6MjA2MjE5MDM0NX0.NkP7nMqBTibQ5J85fNYU5ppeCTVnytcScITCvlSzbkE";

// Création d'un client typé pour Supabase
export const typedSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

// Fonction utilitaire pour convertir un Json en type spécifique
export function convertJsonToType<T>(json: Json | null): T | null {
  if (!json) return null;
  return json as unknown as T;
}

// Export de types utiles pour l'application
export type { Database };
