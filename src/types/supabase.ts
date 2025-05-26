
// Import des types nécessaires
import { Database } from './database';

export type MissionStatus = 'en_acceptation' | 'accepte' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';

export type VehicleCategory = 'citadine' | 'berline' | '4x4_suv' | 'utilitaire_3_5m3' | 'utilitaire_6_12m3' | 'utilitaire_12_15m3' | 'utilitaire_15_20m3' | 'utilitaire_plus_20m3';

export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  'citadine': 'Citadine',
  'berline': 'Berline',
  '4x4_suv': '4x4 / SUV',
  'utilitaire_3_5m3': 'Utilitaire (3-5m³)',
  'utilitaire_6_12m3': 'Utilitaire (6-12m³)',
  'utilitaire_12_15m3': 'Utilitaire (12-15m³)',
  'utilitaire_15_20m3': 'Utilitaire (15-20m³)',
  'utilitaire_plus_20m3': 'Utilitaire (>20m³)'
};

export const missionStatusLabels: Record<MissionStatus, string> = {
  'en_acceptation': 'En cours d\'acceptation',
  'accepte': 'Accepté',
  'prise_en_charge': 'En cours de prise en charge',
  'livraison': 'En cours de livraison',
  'livre': 'Livré',
  'termine': 'Terminé',
  'annule': 'Annulé',
  'incident': 'Incident'
};

export const missionStatusColors: Record<MissionStatus, string> = {
  'en_acceptation': 'bg-gray-600 text-white',
  'accepte': 'bg-green-500 text-white',
  'prise_en_charge': 'bg-amber-700 text-white',
  'livraison': 'bg-orange-500 text-white',
  'livre': 'bg-blue-500 text-white',
  'termine': 'bg-green-700 text-white',
  'annule': 'bg-red-600 text-white',
  'incident': 'bg-orange-600 text-white'
};

// UserRole type that matches exactly what's expected in the database
export type UserRole = 'admin' | 'client' | 'chauffeur';

// Modified Address interface to make formatted_address optional
export interface Address {
  formatted_address?: string;
  place_id?: string;
  street?: string;
  street_number?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
  extracted_data?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  [key: string]: any; // Add index signature to make it compatible with Json type
}

export interface Client {
  id: string;
  email?: string;
  full_name?: string | null;
  company_name: string;
  siret: string;
  vat_number?: string | null;
  billing_address?: Address | null;
  phone1?: string;
  phone2?: string | null;
  created_at?: string;
  profile_completed?: boolean;
}

// Définition plus précise du type MissionFromDB pour mieux correspondre à la structure de la table
export interface MissionFromDB {
  id: string;
  status: MissionStatus;
  client_id: string;
  pickup_address: Address | null;
  delivery_address: Address | null;
  distance_km: number;
  price_ht: number;
  price_ttc: number;
  created_at: string;
  chauffeur_id: string | null;
  mission_type?: string | null;
  vehicle_category?: VehicleCategory;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_fuel?: string | null;
  vehicle_year?: number | null;
  vehicle_registration?: string | null;
  vehicle_id?: number;
  vehicle_vin?: string | null;
  contact_pickup_name?: string | null;
  contact_pickup_phone?: string | null;
  contact_pickup_email?: string | null;
  contact_pickup_id?: number | null;
  contact_delivery_name?: string | null;
  contact_delivery_phone?: string | null;
  contact_delivery_email?: string | null;
  contact_delivery_id?: number | null;
  notes?: string | null;
  scheduled_date: string;
  completion_date?: string | null;
  vat_rate: number;
  created_by: string;
  updated_at: string;
  chauffeur_price_ht?: number | null;
  mission_number?: string;
  D1_PEC?: string | null;
  D2_LIV?: string | null;
  H1_PEC?: string | null;
  H1_LIV?: string | null;
  H2_PEC?: string | null;
  H2_LIV?: string | null;
  linked_mission_id?: string | null;
  is_linked?: boolean;
}

export function convertMissionFromDB(mission: MissionFromDB): Mission {
  return {
    id: mission.id || '',
    status: mission.status || 'en_acceptation',
    client_id: mission.client_id || '',
    pickup_address: mission.pickup_address || {},
    delivery_address: mission.delivery_address || {},
    distance_km: mission.distance_km || 0,
    price_ht: mission.price_ht || 0,
    price_ttc: mission.price_ttc || 0,
    created_at: mission.created_at || new Date().toISOString(),
    chauffeur_id: mission.chauffeur_id || null,
    mission_type: mission.mission_type || null,
    vehicle_category: mission.vehicle_category,
    vehicle_make: mission.vehicle_make || null,
    vehicle_model: mission.vehicle_model || null,
    vehicle_registration: mission.vehicle_registration || null,
    vehicle_fuel: mission.vehicle_fuel || null,
    vehicle_year: mission.vehicle_year || null,
    vehicle_id: mission.vehicle_id || null,
    vehicle_vin: mission.vehicle_vin || null,
    scheduled_date: mission.scheduled_date || new Date().toISOString(),
    mission_number: mission.mission_number || null,
    D1_PEC: mission.D1_PEC || null,
    D2_LIV: mission.D2_LIV || null,
    H1_PEC: mission.H1_PEC || null,
    H1_LIV: mission.H1_LIV || null,
    H2_PEC: mission.H2_PEC || null,
    H2_LIV: mission.H2_LIV || null,
    linked_mission_id: mission.linked_mission_id || null,
    is_linked: mission.is_linked || false
  };
}

// Define a utility function to convert Json to a specific type
export function convertJsonToType<T>(json: any): T | null {
  if (!json) return null;
  return json as unknown as T;
}

export interface Mission {
  id: string;
  status: MissionStatus;
  client_id: string;
  pickup_address: Address | null;
  delivery_address: Address | null;
  distance_km: number;
  price_ht: number;
  price_ttc: number;
  created_at: string;
  chauffeur_id: string | null;
  mission_type?: string | null;
  vehicle_category?: VehicleCategory;
  vehicle_make?: string | null;
  vehicle_model?: string | null;
  vehicle_registration?: string | null;
  vehicle_fuel?: string | null;
  vehicle_year?: number | null;
  vehicle_id?: number | null;
  vehicle_vin?: string | null;
  scheduled_date?: string;
  mission_number?: string | null;
  D1_PEC?: string | null;
  D2_LIV?: string | null;
  H1_PEC?: string | null;
  H1_LIV?: string | null;
  H2_PEC?: string | null;
  H2_LIV?: string | null;
  linked_mission_id?: string | null;
  is_linked?: boolean;
  [key: string]: any;
}
