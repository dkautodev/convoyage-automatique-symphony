
// Import des types nécessaires
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'admin' | 'client' | 'chauffeur';
          full_name: string | null;
          company_name?: string | null;
          billing_address?: Json | null;
          siret?: string | null;
          tva_number?: string | null;
          phone_1?: string | null;
          phone_2?: string | null;
          created_at: string;
          last_login: string | null;
          active: boolean;
          profile_completed: boolean;
        };
        Insert: {
          id: string;
          email: string;
          role: 'admin' | 'client' | 'chauffeur';
          full_name?: string | null;
          company_name?: string | null;
          billing_address?: Json | null;
          siret?: string | null;
          tva_number?: string | null;
          phone_1?: string | null;
          phone_2?: string | null;
          created_at?: string;
          last_login?: string | null;
          active?: boolean;
          profile_completed?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'admin' | 'client' | 'chauffeur';
          full_name?: string | null;
          company_name?: string | null;
          billing_address?: Json | null;
          siret?: string | null;
          tva_number?: string | null;
          phone_1?: string | null;
          phone_2?: string | null;
          created_at?: string;
          last_login?: string | null;
          active?: boolean;
          profile_completed?: boolean;
        };
      };
      missions: {
        Row: {
          id: string;
          client_id: string;
          chauffeur_id: string | null;
          status: string;
          pickup_address: Json;
          delivery_address: Json;
          distance_km: number;
          price_ht: number;
          price_ttc: number;
          created_at: string;
          mission_type: string | null;
          vehicle_category: string;
          vehicle_make: string | null;
          vehicle_model: string | null;
          vehicle_fuel: string | null;
          vehicle_year: number | null;
          vehicle_registration: string | null;
          vehicle_vin: string | null;
          contact_pickup_name: string | null;
          contact_pickup_phone: string | null;
          contact_pickup_email: string | null;
          contact_delivery_name: string | null;
          contact_delivery_phone: string | null;
          contact_delivery_email: string | null;
          notes: string | null;
          chauffeur_price_ht: number | null;
          created_by: string;
          scheduled_date: string;
          vehicle_id: number;
          vat_rate: number;
        };
        Insert: {
          id?: string;
          client_id: string;
          chauffeur_id?: string | null;
          status?: string;
          pickup_address: Json;
          delivery_address: Json;
          distance_km: number;
          price_ht: number;
          price_ttc: number;
          created_at?: string;
          mission_type?: string | null;
          vehicle_category?: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_fuel?: string | null;
          vehicle_year?: number | null;
          vehicle_registration?: string | null;
          vehicle_vin?: string | null;
          contact_pickup_name?: string | null;
          contact_pickup_phone?: string | null;
          contact_pickup_email?: string | null;
          contact_delivery_name?: string | null;
          contact_delivery_phone?: string | null;
          contact_delivery_email?: string | null;
          notes?: string | null;
          chauffeur_price_ht?: number | null;
          created_by: string;
          scheduled_date: string;
          vehicle_id: number;
          vat_rate?: number;
        };
        Update: {
          id?: string;
          client_id?: string;
          chauffeur_id?: string | null;
          status?: string;
          pickup_address?: Json;
          delivery_address?: Json;
          distance_km?: number;
          price_ht?: number;
          price_ttc?: number;
          created_at?: string;
          mission_type?: string | null;
          vehicle_category?: string;
          vehicle_make?: string | null;
          vehicle_model?: string | null;
          vehicle_fuel?: string | null;
          vehicle_year?: number | null;
          vehicle_registration?: string | null;
          vehicle_vin?: string | null;
          contact_pickup_name?: string | null;
          contact_pickup_phone?: string | null;
          contact_pickup_email?: string | null;
          contact_delivery_name?: string | null;
          contact_delivery_phone?: string | null;
          contact_delivery_email?: string | null;
          notes?: string | null;
          chauffeur_price_ht?: number | null;
          created_by?: string;
          scheduled_date?: string;
          vehicle_id?: number;
          vat_rate?: number;
        };
      };
      // Add additional tables as needed
    };
    Enums: {
      mission_status: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
      user_role: 'admin' | 'client' | 'chauffeur';
    };
  };
}

// Création d'un client typé pour Supabase
export const typedSupabase = supabase;

// Exporter les types de la base de données pour une utilisation dans le reste de l'application
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Type pour les insertions
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

// Type pour les mises à jour
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Utilitaire pour convertir un Json en un type spécifique
export function convertJsonToType<T>(json: Json | null): T {
  if (!json) return {} as T;
  if (typeof json === 'string') {
    try {
      return JSON.parse(json) as T;
    } catch (e) {
      console.error('Erreur lors de la conversion JSON:', e);
      return {} as T;
    }
  }
  return json as unknown as T;
}

// Fix the re-export with 'export type' to avoid the conflict
export type { Database };
