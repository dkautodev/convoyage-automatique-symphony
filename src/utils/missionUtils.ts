
import { Address } from "@/types/supabase";

/**
 * Retourne une chaîne formatée avec le code postal et la ville
 */
export const formatAddressDisplay = (address: Address | null | undefined): string => {
  if (!address) return 'Adresse non spécifiée';
  
  // Si l'adresse complète est disponible, l'utiliser en priorité
  if (address.formatted_address) {
    return address.formatted_address;
  }
  
  // Sinon utiliser les composants individuels
  const postalCode = address.postal_code || '';
  const city = address.city || '';
  
  if (postalCode && city) {
    return `${postalCode} ${city}`;
  } else if (city) {
    return city;
  } else if (postalCode) {
    return postalCode;
  } else {
    return 'Adresse incomplète';
  }
};

/**
 * Formate le numéro de mission pour l'affichage
 */
export const formatMissionNumber = (mission: any): string => {
  if (mission?.mission_number) {
    return mission.mission_number;
  }
  
  // Fallback sur l'ID si pas de numéro de mission formaté
  return mission?.id ? mission.id.slice(0, 8) : 'N/A';
};

/**
 * Formate le nom du client pour l'affichage
 */
export const formatClientName = (mission: any, clientsData: Record<string, any> = {}): string => {
  if (!mission) return 'Client inconnu';
  
  // Si on a les données client via clientsData
  if (mission.client_id && clientsData[mission.client_id]) {
    return clientsData[mission.client_id].name || 'Client inconnu';
  }
  
  // Si le client_name est déjà sur la mission
  if (mission.client_name) {
    return mission.client_name;
  }
  
  return 'Client inconnu';
};

/**
 * Formate l'adresse complète pour l'affichage
 */
export const formatFullAddress = (address: Address | null | undefined): string => {
  if (!address) return 'Adresse non spécifiée';
  
  const components = [];
  
  if (address.street_number) components.push(address.street_number);
  if (address.street) components.push(address.street);
  
  const cityParts = [];
  if (address.postal_code) cityParts.push(address.postal_code);
  if (address.city) cityParts.push(address.city);
  
  if (cityParts.length > 0) {
    components.push(cityParts.join(' '));
  }
  
  if (address.country) components.push(address.country);
  
  return components.length > 0 ? components.join(', ') : 'Adresse incomplète';
};
