export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_invitation_tokens: {
        Row: {
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: number
          token: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          expires_at: string
          id?: number
          token: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: number
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          billing_address: Json
          company_name: string
          created_at: string
          full_name: string | null
          id: string
          phone1: string
          phone2: string | null
          siret: string
          vat_number: string | null
        }
        Insert: {
          billing_address: Json
          company_name: string
          created_at?: string
          full_name?: string | null
          id: string
          phone1: string
          phone2?: string | null
          siret: string
          vat_number?: string | null
        }
        Update: {
          billing_address?: Json
          company_name?: string
          created_at?: string
          full_name?: string | null
          id?: string
          phone1?: string
          phone2?: string | null
          siret?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          email: string | null
          first_name: string
          id: number
          is_primary: boolean
          last_name: string
          notes: string | null
          phone: string | null
          position: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          email?: string | null
          first_name: string
          id?: number
          is_primary?: boolean
          last_name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          email?: string | null
          first_name?: string
          id?: number
          is_primary?: boolean
          last_name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string
          document_number: string
          id: number
          mission_id: string
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          document_number: string
          id?: number
          mission_id: string
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          document_number?: string
          id?: number
          mission_id?: string
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          availability_status: string | null
          billing_address: Json
          company_name: string | null
          full_name: string
          id: string
          last_location: Json | null
          license_number: string
          phone1: string
          phone2: string | null
          vat_applicable: boolean
          vat_number: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Insert: {
          availability_status?: string | null
          billing_address: Json
          company_name?: string | null
          full_name: string
          id: string
          last_location?: Json | null
          license_number: string
          phone1: string
          phone2?: string | null
          vat_applicable?: boolean
          vat_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Update: {
          availability_status?: string | null
          billing_address?: Json
          company_name?: string | null
          full_name?: string
          id?: string
          last_location?: Json | null
          license_number?: string
          phone1?: string
          phone2?: string | null
          vat_applicable?: boolean
          vat_number?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Relationships: []
      }
      google_maps_settings: {
        Row: {
          api_key: string
          id: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          api_key: string
          id?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          api_key?: string
          id?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      mission_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: number
          mission_id: string
          new_status: Database["public"]["Enums"]["mission_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["mission_status"] | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: number
          mission_id: string
          new_status: Database["public"]["Enums"]["mission_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["mission_status"] | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: number
          mission_id?: string
          new_status?: Database["public"]["Enums"]["mission_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["mission_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "mission_status_history_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          chauffeur_id: string | null
          client_id: string
          completion_date: string | null
          contact_delivery_id: number | null
          contact_pickup_id: number | null
          created_at: string
          created_by: string
          delivery_address: Json
          distance_km: number
          id: string
          notes: string | null
          pickup_address: Json
          price_ht: number
          price_ttc: number
          scheduled_date: string
          status: Database["public"]["Enums"]["mission_status"]
          updated_at: string
          vat_rate: number
          vehicle_id: number
        }
        Insert: {
          chauffeur_id?: string | null
          client_id: string
          completion_date?: string | null
          contact_delivery_id?: number | null
          contact_pickup_id?: number | null
          created_at?: string
          created_by: string
          delivery_address: Json
          distance_km: number
          id?: string
          notes?: string | null
          pickup_address: Json
          price_ht: number
          price_ttc: number
          scheduled_date: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
          vat_rate?: number
          vehicle_id: number
        }
        Update: {
          chauffeur_id?: string | null
          client_id?: string
          completion_date?: string | null
          contact_delivery_id?: number | null
          contact_pickup_id?: number | null
          created_at?: string
          created_by?: string
          delivery_address?: Json
          distance_km?: number
          id?: string
          notes?: string | null
          pickup_address?: Json
          price_ht?: number
          price_ttc?: number
          scheduled_date?: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
          vat_rate?: number
          vehicle_id?: number
        }
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
            foreignKeyName: "missions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_grids: {
        Row: {
          active: boolean
          created_at: string
          id: number
          max_distance: number
          min_distance: number
          price_ht: number
          price_ttc: number
          type_tarif: Database["public"]["Enums"]["pricing_type"]
          updated_at: string
          updated_by: string | null
          vehicle_category: Database["public"]["Enums"]["vehicle_category"]
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: number
          max_distance: number
          min_distance: number
          price_ht: number
          price_ttc: number
          type_tarif: Database["public"]["Enums"]["pricing_type"]
          updated_at?: string
          updated_by?: string | null
          vehicle_category: Database["public"]["Enums"]["vehicle_category"]
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: number
          max_distance?: number
          min_distance?: number
          price_ht?: number
          price_ttc?: number
          type_tarif?: Database["public"]["Enums"]["pricing_type"]
          updated_at?: string
          updated_by?: string | null
          vehicle_category?: Database["public"]["Enums"]["vehicle_category"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          billing_address: Json | null
          company_name: string | null
          created_at: string
          driver_license: string | null
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          phone_1: string | null
          phone_2: string | null
          profile_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          siret: string | null
          tva_number: string | null
          vehicle_registration: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Insert: {
          active?: boolean
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          driver_license?: string | null
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          phone_1?: string | null
          phone_2?: string | null
          profile_completed?: boolean
          role: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          tva_number?: string | null
          vehicle_registration?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Update: {
          active?: boolean
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          driver_license?: string | null
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          phone_1?: string | null
          phone_2?: string | null
          profile_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          tva_number?: string | null
          vehicle_registration?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_category"] | null
        }
        Relationships: []
      }
      vat_settings: {
        Row: {
          created_at: string
          effective_date: string
          id: number
          modified_by: string | null
          rate: number
        }
        Insert: {
          created_at?: string
          effective_date?: string
          id?: number
          modified_by?: string | null
          rate: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          id?: number
          modified_by?: string | null
          rate?: number
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          category: Database["public"]["Enums"]["vehicle_category"]
          created_at: string
          created_by: string
          id: number
          make: string
          model: string
          notes: string | null
          registration_number: string
          volume_m3: number | null
          year: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          created_by: string
          id?: number
          make: string
          model: string
          notes?: string | null
          registration_number: string
          volume_m3?: number | null
          year?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["vehicle_category"]
          created_at?: string
          created_by?: string
          id?: number
          make?: string
          model?: string
          notes?: string | null
          registration_number?: string
          volume_m3?: number | null
          year?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_constraint_exists: {
        Args: {
          schema_name: string
          table_name: string
          constraint_name: string
        }
        Returns: boolean
      }
      disable_driver_fields_constraint: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_owner_of_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      document_type: "devis" | "facture" | "fiche_mission"
      mission_status:
        | "en_acceptation"
        | "prise_en_charge"
        | "livraison"
        | "livre"
        | "termine"
        | "annule"
        | "incident"
      pricing_type: "forfait" | "km"
      user_role: "admin" | "client" | "chauffeur"
      vehicle_category:
        | "citadine"
        | "berline"
        | "4x4_suv"
        | "utilitaire_3_5m3"
        | "utilitaire_6_12m3"
        | "utilitaire_12_15m3"
        | "utilitaire_15_20m3"
        | "utilitaire_plus_20m3"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_type: ["devis", "facture", "fiche_mission"],
      mission_status: [
        "en_acceptation",
        "prise_en_charge",
        "livraison",
        "livre",
        "termine",
        "annule",
        "incident",
      ],
      pricing_type: ["forfait", "km"],
      user_role: ["admin", "client", "chauffeur"],
      vehicle_category: [
        "citadine",
        "berline",
        "4x4_suv",
        "utilitaire_3_5m3",
        "utilitaire_6_12m3",
        "utilitaire_12_15m3",
        "utilitaire_15_20m3",
        "utilitaire_plus_20m3",
      ],
    },
  },
} as const
