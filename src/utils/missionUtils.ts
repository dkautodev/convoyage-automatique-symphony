import { Address, Mission } from '@/types/supabase';

// Original file imports and basic functions
export const formatMissionNumber = (mission: Mission) => {
  return mission.mission_number || mission.id.slice(0, 8);
};

export const formatAddressDisplay = (address?: Address | null) => {
  if (!address) return 'Adresse non spécifiée';
  
  // Amélioration pour éviter "Adresse inconnue"
  if (address.formatted_address) return address.formatted_address.split(',')[0];
  if (address.extracted_data?.city) return address.extracted_data.city;
  if (address.city) return address.city;
  
  // Si aucune donnée valide n'est trouvée
  return 'Adresse indisponible';
};

export const formatFullAddress = (address?: Address | null) => {
  if (!address) return 'Adresse non spécifiée';
  
  // If the formatted_address exists, use it directly
  if (address.formatted_address) {
    return address.formatted_address;
  }
  
  // Check if address has extracted_data
  if (address.extracted_data) {
    const extractedData = address.extracted_data;
    let parts = [];
    
    // Build address from extracted_data fields
    if (extractedData.street) {
      parts.push(extractedData.street);
    }
    
    let line2 = '';
    if (extractedData.postal_code || extractedData.city) {
      let cityParts = [];
      if (extractedData.postal_code) cityParts.push(extractedData.postal_code);
      if (extractedData.city) cityParts.push(extractedData.city);
      line2 = cityParts.join(' ');
    }
    
    return [parts.join(' '), line2].filter(Boolean).join(', ');
  }
  
  // Fallback to the original behavior for backward compatibility
  let parts = [];
  if (address.street_number) parts.push(address.street_number);
  if (address.street) parts.push(address.street);
  
  let line1 = parts.join(' ');
  let line2 = '';
  
  parts = [];
  if (address.postal_code) parts.push(address.postal_code);
  if (address.city) parts.push(address.city);
  
  line2 = parts.join(' ');
  
  return [line1, line2].filter(Boolean).join(', ');
};

export const formatClientName = (mission: Mission, clientsData: Record<string, any>) => {
  if (!mission.client_id) return 'Client inconnu';
  
  const clientInfo = clientsData[mission.client_id];
  return clientInfo?.name || 'Client inconnu';
};

export const formatContactInfo = (name?: string | null, phone?: string | null, email?: string | null) => {
  if (!name && !phone && !email) return 'Aucun contact spécifié';
  
  let info = [];
  if (name) info.push(name);
  if (phone) info.push(phone);
  if (email) info.push(email);
  
  return info.join(' • ');
};

export const missionStatusLabels = {
  'en_acceptation': 'En cours d\'acceptation',
  'accepte': 'Accepté',
  'prise_en_charge': 'En cours de prise en charge',
  'livraison': 'En cours de livraison',
  'livre': 'Livré',
  'termine': 'Terminé',
  'annule': 'Annulé',
  'incident': 'Incident'
};

export const missionStatusColors = {
  'en_acceptation': 'bg-gray-600 text-white',
  'accepte': 'bg-green-500 text-white',
  'prise_en_charge': 'bg-amber-700 text-white',
  'livraison': 'bg-orange-500 text-white',
  'livre': 'bg-blue-500 text-white',
  'termine': 'bg-green-700 text-white',
  'annule': 'bg-red-600 text-white',
  'incident': 'bg-orange-600 text-white'
};
