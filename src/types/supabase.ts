
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

// Modified Address interface to ensure it's compatible with Json
export interface Address {
  formatted_address: string;
  place_id?: string;
  street?: string;
  street_number?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
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

export type MissionFromDB = any; // À remplacer par le vrai type

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
    mission_type: mission.mission_type || null
  };
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
  [key: string]: any;
}
