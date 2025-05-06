
import { Database as GeneratedDatabase } from '@/integrations/supabase/types';

// Extension de la définition Database générée pour inclure nos tables
export interface Database extends GeneratedDatabase {
  public: {
    Tables: {
      admin_tokens: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          token: string;
          used: boolean;
          used_at: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          token: string;
          used?: boolean;
          used_at?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          token?: string;
          used?: boolean;
          used_at?: string | null;
        };
        Relationships: [];
      };
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "clients_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      drivers: {
        Row: {
          id: string;
          license_number: string;
          vat_applicable: boolean;
          vat_number: string | null;
          vehicle_type: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3" | null;
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
          vehicle_type?: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3" | null;
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
          vehicle_type?: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3" | null;
          availability_status?: string | null;
          last_location?: {
            lat: number;
            lng: number;
            timestamp: string;
          } | null;
        };
        Relationships: [
          {
            foreignKeyName: "drivers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
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
          id: string; // Changed from id?: string to id: string as it's required in the Supabase type
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
          created_by: string; // This field is required according to Supabase
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
        Relationships: [
          {
            foreignKeyName: "missions_chauffeur_id_fkey"
            columns: ["chauffeur_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_contact_delivery_id_fkey"
            columns: ["contact_delivery_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_contact_pickup_id_fkey"
            columns: ["contact_pickup_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      pricing_grids: {
        Row: {
          id: number;
          vehicle_category: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
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
          vehicle_category: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
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
          vehicle_category?: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
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
        Relationships: [
          {
            foreignKeyName: "pricing_grids_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      documents: {
        Row: {
          id: number;
          mission_id: string;
          type: 'devis' | 'facture' | 'fiche_mission';
          document_number: string;
          storage_path: string;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: number;
          mission_id: string;
          type: 'devis' | 'facture' | 'fiche_mission';
          document_number: string;
          storage_path: string;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: number;
          mission_id?: string;
          type?: 'devis' | 'facture' | 'fiche_mission';
          document_number?: string;
          storage_path?: string;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          }
        ];
      };
      mission_status_history: {
        Row: {
          id: number;
          mission_id: string;
          old_status: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident' | null;
          new_status: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          changed_at: string;
          changed_by: string;
          notes: string | null;
        };
        Insert: {
          id?: number;
          mission_id: string;
          old_status?: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident' | null;
          new_status: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          changed_at?: string;
          changed_by: string;
          notes?: string | null;
        };
        Update: {
          id?: number;
          mission_id?: string;
          old_status?: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident' | null;
          new_status?: 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
          changed_at?: string;
          changed_by?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mission_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_status_history_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          }
        ];
      };
      google_maps_settings: {
        Row: {
          id: number;
          api_key: string;
          updated_at: string;
          updated_by: string;
        };
        Insert: {
          id?: number;
          api_key: string;
          updated_at?: string;
          updated_by: string;
        };
        Update: {
          id?: number;
          api_key?: string;
          updated_at?: string;
          updated_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "google_maps_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      vat_settings: {
        Row: {
          id: number;
          rate: number;
          effective_date: string;
          created_at: string;
          modified_by: string | null;
        };
        Insert: {
          id?: number;
          rate: number;
          effective_date?: string;
          created_at?: string;
          modified_by?: string | null;
        };
        Update: {
          id?: number;
          rate?: number;
          effective_date?: string;
          created_at?: string;
          modified_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "vat_settings_modified_by_fkey"
            columns: ["modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
      };
      vehicles: {
        Row: {
          id: number;
          registration_number: string;
          make: string;
          model: string;
          year: number | null;
          category: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
          volume_m3: number | null;
          notes: string | null;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: number;
          registration_number: string;
          make: string;
          model: string;
          year?: number | null;
          category: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
          volume_m3?: number | null;
          notes?: string | null;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: number;
          registration_number?: string;
          make?: string;
          model?: string;
          year?: number | null;
          category?: "citadine" | "berline" | "4x4_suv" | "utilitaire_3_5m3" | "utilitaire_6_12m3" | "utilitaire_12_15m3" | "utilitaire_15_20m3" | "utilitaire_plus_20m3";
          volume_m3?: number | null;
          notes?: string | null;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vehicles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ];
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
