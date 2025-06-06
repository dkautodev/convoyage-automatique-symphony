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
      api_store_admin_table: {
        Row: {
          app_name: string | null
          created_at: string
          id: number
          key: string | null
          note: string | null
        }
        Insert: {
          app_name?: string | null
          created_at?: string
          id?: number
          key?: string | null
          note?: string | null
        }
        Update: {
          app_name?: string | null
          created_at?: string
          id?: number
          key?: string | null
          note?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: number
          name_s: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: number
          name_s?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: number
          name_s?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      drivers_config: {
        Row: {
          created_at: string
          id: string
          id_document_path: string | null
          id_number: string | null
          kbis_document_path: string | null
          legal_status: Database["public"]["Enums"]["legal_status_type"]
          license_document_path: string | null
          license_number: string | null
          updated_at: string
          vigilance_document_path: string | null
        }
        Insert: {
          created_at?: string
          id: string
          id_document_path?: string | null
          id_number?: string | null
          kbis_document_path?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status_type"]
          license_document_path?: string | null
          license_number?: string | null
          updated_at?: string
          vigilance_document_path?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_document_path?: string | null
          id_number?: string | null
          kbis_document_path?: string | null
          legal_status?: Database["public"]["Enums"]["legal_status_type"]
          license_document_path?: string | null
          license_number?: string | null
          updated_at?: string
          vigilance_document_path?: string | null
        }
        Relationships: []
      }
      fac_admin_config: {
        Row: {
          admin_bank: string | null
          admin_bic: string | null
          admin_doc_logo: string | null
          admin_iban: string | null
          bank_doc: string | null
        }
        Insert: {
          admin_bank?: string | null
          admin_bic?: string | null
          admin_doc_logo?: string | null
          admin_iban?: string | null
          bank_doc?: string | null
        }
        Update: {
          admin_bank?: string | null
          admin_bic?: string | null
          admin_doc_logo?: string | null
          admin_iban?: string | null
          bank_doc?: string | null
        }
        Relationships: []
      }
      mission_documents: {
        Row: {
          file_name: string
          file_path: string
          file_type: string | null
          id: string
          mission_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_type?: string | null
          id?: string
          mission_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_type?: string | null
          id?: string
          mission_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_documents_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
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
          chauffeur_invoice: string | null
          chauffeur_paid: boolean | null
          chauffeur_price_ht: number | null
          client_id: string
          client_paid: boolean | null
          completion_date: string | null
          contact_delivery_email: string | null
          contact_delivery_name: string | null
          contact_delivery_phone: string | null
          contact_pickup_email: string | null
          contact_pickup_name: string | null
          contact_pickup_phone: string | null
          created_at: string
          created_by: string
          D1_PEC: string | null
          D2_LIV: string | null
          delivery_address: Json
          distance_km: number
          H1_LIV: string | null
          H1_PEC: string | null
          H2_LIV: string | null
          H2_PEC: string | null
          id: string
          invoiceable: boolean | null
          is_linked: boolean | null
          linked_mission_id: string | null
          mission_number: string | null
          mission_type: string | null
          notes: string | null
          pickup_address: Json
          price_ht: number
          price_ttc: number
          scheduled_date: string
          status: Database["public"]["Enums"]["mission_status"]
          updated_at: string
          vat_rate: number
          vehicle_category:
            | Database["public"]["Enums"]["vehicle_category"]
            | null
          vehicle_fuel: string | null
          vehicle_id: number | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_registration: string | null
          vehicle_vin: string | null
          vehicle_year: number | null
        }
        Insert: {
          chauffeur_id?: string | null
          chauffeur_invoice?: string | null
          chauffeur_paid?: boolean | null
          chauffeur_price_ht?: number | null
          client_id: string
          client_paid?: boolean | null
          completion_date?: string | null
          contact_delivery_email?: string | null
          contact_delivery_name?: string | null
          contact_delivery_phone?: string | null
          contact_pickup_email?: string | null
          contact_pickup_name?: string | null
          contact_pickup_phone?: string | null
          created_at?: string
          created_by: string
          D1_PEC?: string | null
          D2_LIV?: string | null
          delivery_address: Json
          distance_km: number
          H1_LIV?: string | null
          H1_PEC?: string | null
          H2_LIV?: string | null
          H2_PEC?: string | null
          id?: string
          invoiceable?: boolean | null
          is_linked?: boolean | null
          linked_mission_id?: string | null
          mission_number?: string | null
          mission_type?: string | null
          notes?: string | null
          pickup_address: Json
          price_ht: number
          price_ttc: number
          scheduled_date: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
          vat_rate?: number
          vehicle_category?:
            | Database["public"]["Enums"]["vehicle_category"]
            | null
          vehicle_fuel?: string | null
          vehicle_id?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Update: {
          chauffeur_id?: string | null
          chauffeur_invoice?: string | null
          chauffeur_paid?: boolean | null
          chauffeur_price_ht?: number | null
          client_id?: string
          client_paid?: boolean | null
          completion_date?: string | null
          contact_delivery_email?: string | null
          contact_delivery_name?: string | null
          contact_delivery_phone?: string | null
          contact_pickup_email?: string | null
          contact_pickup_name?: string | null
          contact_pickup_phone?: string | null
          created_at?: string
          created_by?: string
          D1_PEC?: string | null
          D2_LIV?: string | null
          delivery_address?: Json
          distance_km?: number
          H1_LIV?: string | null
          H1_PEC?: string | null
          H2_LIV?: string | null
          H2_PEC?: string | null
          id?: string
          invoiceable?: boolean | null
          is_linked?: boolean | null
          linked_mission_id?: string | null
          mission_number?: string | null
          mission_type?: string | null
          notes?: string | null
          pickup_address?: Json
          price_ht?: number
          price_ttc?: number
          scheduled_date?: string
          status?: Database["public"]["Enums"]["mission_status"]
          updated_at?: string
          vat_rate?: number
          vehicle_category?:
            | Database["public"]["Enums"]["vehicle_category"]
            | null
          vehicle_fuel?: string | null
          vehicle_id?: number | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_registration?: string | null
          vehicle_vin?: string | null
          vehicle_year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "missions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_linked_mission_id_fkey"
            columns: ["linked_mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
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
          vehicle_id: number | null
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
          vehicle_id?: number | null
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
          vehicle_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_grids_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          billing_address: Json | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_login: string | null
          phone_1: string | null
          phone_2: string | null
          profile_completed: boolean
          role: Database["public"]["Enums"]["user_role"]
          siret: string | null
          tva_applicable: boolean | null
          tva_number: string | null
        }
        Insert: {
          active?: boolean
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_login?: string | null
          phone_1?: string | null
          phone_2?: string | null
          profile_completed?: boolean
          role: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          tva_applicable?: boolean | null
          tva_number?: string | null
        }
        Update: {
          active?: boolean
          billing_address?: Json | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_login?: string | null
          phone_1?: string | null
          phone_2?: string | null
          profile_completed?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          siret?: string | null
          tva_applicable?: boolean | null
          tva_number?: string | null
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
        Args:
          | Record<PropertyKey, never>
          | { schema_name: string; table_name: string; constraint_name: string }
        Returns: boolean
      }
      create_update_client_profile_function: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_update_driver_profile_function: {
        Args: Record<PropertyKey, never>
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
      get_default_vehicle_id: {
        Args:
          | Record<PropertyKey, never>
          | { category_param: Database["public"]["Enums"]["vehicle_category"] }
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: string
      }
      get_user_role_safe: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_owner_of_profile: {
        Args: { profile_id: string }
        Returns: boolean
      }
      update_client_profile: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_company_name: string
          p_billing_address: Json
          p_siret: string
          p_tva_number: string
          p_phone_1: string
          p_phone_2: string
          p_profile_completed: boolean
        }
        Returns: Json
      }
      update_driver_config_info: {
        Args: {
          p_user_id: string
          p_license_number?: string
          p_id_number?: string
          p_legal_status?: Database["public"]["Enums"]["legal_status_type"]
        }
        Returns: Json
      }
      update_driver_profile: {
        Args: {
          p_user_id: string
          p_full_name: string
          p_company_name: string
          p_billing_address: Json
          p_siret: string
          p_tva_number: string
          p_tva_applicable: boolean
          p_phone_1: string
          p_phone_2: string
          p_driver_license: string
          p_vehicle_type: string
          p_vehicle_registration: string
          p_profile_completed: boolean
        }
        Returns: Json
      }
    }
    Enums: {
      document_type: "devis" | "facture" | "fiche_mission"
      legal_status_type:
        | "EI"
        | "EURL"
        | "SARL"
        | "SA"
        | "SAS"
        | "SASU"
        | "SNC"
        | "Scop"
        | "Association"
      mission_status:
        | "en_acceptation"
        | "prise_en_charge"
        | "livraison"
        | "livre"
        | "termine"
        | "annule"
        | "incident"
        | "accepte"
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
      legal_status_type: [
        "EI",
        "EURL",
        "SARL",
        "SA",
        "SAS",
        "SASU",
        "SNC",
        "Scop",
        "Association",
      ],
      mission_status: [
        "en_acceptation",
        "prise_en_charge",
        "livraison",
        "livre",
        "termine",
        "annule",
        "incident",
        "accepte",
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
