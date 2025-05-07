
// Import des types de Supabase
import { Json } from '@/integrations/supabase/types';
import { convertJsonToType } from './database';

// Types d'énumérations correspondant à ceux de la base de données
export type UserRole = 'admin' | 'client' | 'chauffeur';
export type MissionStatus = 'en_acceptation' | 'prise_en_charge' | 'livraison' | 'livre' | 'termine' | 'annule' | 'incident';
export type VehicleCategory = 'citadine' | 'berline' | '4x4_suv' | 'utilitaire_3_5m3' | 'utilitaire_6_12m3' | 'utilitaire_12_15m3' | 'utilitaire_15_20m3' | 'utilitaire_plus_20m3';
export type DocumentType = 'devis' | 'facture' | 'fiche_mission';
export type PricingType = 'forfait' | 'km';

// Type pour les adresses
export interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  formatted_address?: string;
  lat?: number;
  lng?: number;
}

// Interface pour le profil utilisateur
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_login: string | null;
  active: boolean;
}

// Interface pour les clients
export interface Client {
  id: string;
  company_name: string;
  siret: string;
  vat_number: string | null;
  billing_address: Address;
  phone1: string;
  phone2: string | null;
  created_at: string;
}

// Interface pour les chauffeurs
export interface Driver {
  id: string;
  license_number: string;
  vat_applicable: boolean;
  vat_number: string | null;
  vehicle_type: VehicleCategory | null;
  availability_status: string | null;
  last_location: {
    lat: number;
    lng: number;
    timestamp: string;
  } | null;
}

// Interface pour les contacts
export interface Contact {
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
}

// Interface pour les véhicules
export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number | null;
  category: VehicleCategory;
  volume_m3: number | null;
  notes: string | null;
  created_at: string;
  created_by: string;
}

// Types pour les missions en fonction de leur source (DB ou UI)
// Type pour les missions telles que reçues de la DB
export interface MissionFromDB {
  id: string;
  client_id: string;
  vehicle_id: number;
  chauffeur_id: string | null;
  status: MissionStatus;
  contact_pickup_id: number | null;
  contact_delivery_id: number | null;
  pickup_address: Json;
  delivery_address: Json;
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
}

// Interface pour les missions (utilisée dans l'UI)
export interface Mission {
  id: string;
  client_id: string;
  vehicle_id: number;
  chauffeur_id: string | null;
  status: MissionStatus;
  contact_pickup_id: number | null;
  contact_delivery_id: number | null;
  pickup_address: Address;
  delivery_address: Address;
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
}

// Fonction utilitaire pour convertir MissionFromDB en Mission
export function convertMissionFromDB(missionFromDB: MissionFromDB): Mission {
  return {
    ...missionFromDB,
    pickup_address: convertJsonToType<Address>(missionFromDB.pickup_address),
    delivery_address: convertJsonToType<Address>(missionFromDB.delivery_address)
  };
}

// Interface pour l'historique des statuts de mission
export interface MissionStatusHistory {
  id: number;
  mission_id: string;
  old_status: MissionStatus | null;
  new_status: MissionStatus;
  changed_at: string;
  changed_by: string;
  notes: string | null;
}

// Interface pour les grilles tarifaires
export interface PricingGrid {
  id: number;
  vehicle_category: VehicleCategory;
  min_distance: number;
  max_distance: number;
  price_ht: number;
  price_ttc: number;
  type_tarif: PricingType;
  active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

// Interface pour les paramètres de TVA
export interface VatSetting {
  id: number;
  rate: number;
  effective_date: string;
  created_at: string;
  modified_by: string | null;
}

// Interface pour les paramètres de l'API Google Maps
export interface GoogleMapsSetting {
  id: number;
  api_key: string;
  updated_at: string;
  updated_by: string;
}

// Interface pour les documents
export interface Document {
  id: number;
  mission_id: string;
  type: DocumentType;
  document_number: string;
  storage_path: string;
  created_at: string;
  created_by: string;
}

// Mappage des statuts de mission aux couleurs
export const missionStatusColors: Record<MissionStatus, string> = {
  en_acceptation: 'bg-gray-700 text-white',
  prise_en_charge: 'bg-amber-800 text-white',
  livraison: 'bg-orange-500 text-white',
  livre: 'bg-blue-500 text-white',
  termine: 'bg-green-500 text-white',
  annule: 'bg-red-500 text-white',
  incident: 'bg-orange-500 text-white'
};

// Traductions françaises des statuts de mission
export const missionStatusLabels: Record<MissionStatus, string> = {
  en_acceptation: 'En cours d\'acceptation',
  prise_en_charge: 'En cours de prise en charge',
  livraison: 'En cours de livraison',
  livre: 'Livré',
  termine: 'Terminé',
  annule: 'Annulé',
  incident: 'Incident'
};

// Traductions françaises des catégories de véhicules
export const vehicleCategoryLabels: Record<VehicleCategory, string> = {
  citadine: 'Citadine',
  berline: 'Berline',
  '4x4_suv': '4x4 / SUV',
  utilitaire_3_5m3: 'Utilitaire 3-5m³',
  utilitaire_6_12m3: 'Utilitaire 6-12m³',
  utilitaire_12_15m3: 'Utilitaire 12-15m³',
  utilitaire_15_20m3: 'Utilitaire 15-20m³',
  utilitaire_plus_20m3: 'Utilitaire +20m³'
};
