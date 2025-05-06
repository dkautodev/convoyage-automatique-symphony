
import { Database as GeneratedDatabase } from '@/integrations/supabase/types';

// Extension de la définition Database générée pour inclure nos tables
export interface Database extends GeneratedDatabase {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'admin' | 'client' | 'chauffeur';
          created_at: string;
          last_login: string | null;
          active: boolean;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role: 'admin' | 'client' | 'chauffeur';
          created_at?: string;
          last_login?: string | null;
          active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'admin' | 'client' | 'chauffeur';
          created_at?: string;
          last_login?: string | null;
          active?: boolean;
        };
      };
      clients: {
        Row: {
          id: string;
          company_name: string;
          siret: string;
          vat_number: string | null;
          billing_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          phone1: string;
          phone2: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          company_name: string;
          siret: string;
          vat_number?: string | null;
          billing_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          phone1: string;
          phone2?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          siret?: string;
          vat_number?: string | null;
          billing_address?: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          phone1?: string;
          phone2?: string | null;
          created_at?: string;
        };
      };
      drivers: {
        Row: {
          id: string;
          license_number: string;
          vat_applicable: boolean;
          vat_number: string | null;
          vehicle_type: string | null;
          availability_status: string | null;
          last_location: {
            lat: number;
            lng: number;
            timestamp: string;
          } | null;
        };
        Insert: {
          id: string;
          license_number: string;
          vat_applicable?: boolean;
          vat_number?: string | null;
          vehicle_type?: string | null;
          availability_status?: string | null;
          last_location?: {
            lat: number;
            lng: number;
            timestamp: string;
          } | null;
        };
        Update: {
          id?: string;
          license_number?: string;
          vat_applicable?: boolean;
          vat_number?: string | null;
          vehicle_type?: string | null;
          availability_status?: string | null;
          last_location?: {
            lat: number;
            lng: number;
            timestamp: string;
          } | null;
        };
      };
      missions: {
        Row: {
          id: string;
          client_id: string;
          vehicle_id: number;
          chauffeur_id: string | null;
          status: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          contact_pickup_id: number | null;
          contact_delivery_id: number | null;
          pickup_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          delivery_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          distance_km: number;
          price_ht: number;
          price_ttc: number;
          vat_rate: number;
          scheduled_date: string;
          completion_date: string | null;
          notes: string | null;
          created_at: string;
          created_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          vehicle_id: number;
          chauffeur_id?: string | null;
          status?: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          contact_pickup_id?: number | null;
          contact_delivery_id?: number | null;
          pickup_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          delivery_address: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          distance_km: number;
          price_ht: number;
          price_ttc: number;
          vat_rate: number;
          scheduled_date: string;
          completion_date?: string | null;
          notes?: string | null;
          created_at?: string;
          created_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          vehicle_id?: number;
          chauffeur_id?: string | null;
          status?: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          contact_pickup_id?: number | null;
          contact_delivery_id?: number | null;
          pickup_address?: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          delivery_address?: {
            street: string;
            city: string;
            postal_code: string;
            country: string;
            formatted_address?: string;
            lat?: number;
            lng?: number;
          };
          distance_km?: number;
          price_ht?: number;
          price_ttc?: number;
          vat_rate?: number;
          scheduled_date?: string;
          completion_date?: string | null;
          notes?: string | null;
          created_at?: string;
          created_by?: string;
          updated_at?: string;
        };
      };
      contacts: {
        Row: {
          id: number;
          client_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          position: string | null;
          is_primary: boolean;
          notes: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: number;
          client_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: number;
          client_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string | null;
          phone?: string | null;
          position?: string | null;
          is_primary?: boolean;
          notes?: string | null;
          created_at?: string;
          created_by?: string;
        };
      };
      pricing_grids: {
        Row: {
          id: number;
          vehicle_category: string;
          min_distance: number;
          max_distance: number;
          price_ht: number;
          price_ttc: number;
          type_tarif: 'forfait' | 'km';
          active: boolean;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          vehicle_category: string;
          min_distance: number;
          max_distance: number;
          price_ht: number;
          price_ttc: number;
          type_tarif: 'forfait' | 'km';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          vehicle_category?: string;
          min_distance?: number;
          max_distance?: number;
          price_ht?: number;
          price_ttc?: number;
          type_tarif?: 'forfait' | 'km';
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
    };
    Views: GeneratedDatabase['public']['Views'];
    Functions: GeneratedDatabase['public']['Functions'];
    Enums: GeneratedDatabase['public']['Enums'];
    CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
  };
}

// Créer un client typé
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://cxfrfekvpaooakzpbzmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4ZnJmZWt2cGFvb2FrenBiem1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1Mzc0MjksImV4cCI6MjA2MjExMzQyOX0.CfEIUZZAVtimsRBR8dZTEl3AU7LdHNAfO8QDcM7s9To";

export const typedSupabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
