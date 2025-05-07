
// Import des types nécessaires
import { Database } from '@/integrations/supabase/types';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Création d'un client typé pour Supabase
export const typedSupabase = supabase;

// Exporter les types de la base de données pour une utilisation dans le reste de l'application
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Type pour les insertions
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// Type pour les mises à jour
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
