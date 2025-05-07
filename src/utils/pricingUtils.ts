
import { supabase } from '@/integrations/supabase/client';
import { VehicleCategory } from '@/types/supabase';
import { toast } from 'sonner';

/**
 * Interface pour représenter un élément de la grille tarifaire
 */
export interface PricingGridItem {
  id: number;
  vehicle_category: VehicleCategory;
  min_distance: number;
  max_distance: number;
  price_ht: number;
  price_ttc: number;
  type_tarif: 'forfait' | 'km';
  active: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

/**
 * Récupère toute la grille tarifaire depuis la base de données
 */
export const fetchPricingGrid = async (): Promise<PricingGridItem[]> => {
  try {
    const { data, error } = await supabase
      .from('pricing_grids')
      .select('*')
      .order('vehicle_category', { ascending: true })
      .order('min_distance', { ascending: true });
    
    if (error) {
      console.error('Erreur lors de la récupération des tarifs:', error);
      toast.error('Erreur lors de la récupération des grilles tarifaires');
      return [];
    }
    
    return data as PricingGridItem[];
  } catch (e) {
    console.error('Exception lors de la récupération des tarifs:', e);
    toast.error('Erreur lors de la récupération des grilles tarifaires');
    return [];
  }
};

/**
 * Récupère la grille tarifaire pour un type de véhicule spécifique
 */
export const fetchPricingGridByVehicleType = async (vehicleType: VehicleCategory): Promise<PricingGridItem[]> => {
  try {
    const { data, error } = await supabase
      .from('pricing_grids')
      .select('*')
      .eq('vehicle_category', vehicleType)
      .order('min_distance', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des tarifs pour ${vehicleType}:`, error);
      toast.error('Erreur lors de la récupération des grilles tarifaires');
      return [];
    }
    
    return data as PricingGridItem[];
  } catch (e) {
    console.error(`Exception lors de la récupération des tarifs pour ${vehicleType}:`, e);
    toast.error('Erreur lors de la récupération des grilles tarifaires');
    return [];
  }
};

/**
 * Calcule le prix d'une mission en fonction de la distance et du type de véhicule
 */
export const calculatePrice = async (
  distance: number, 
  vehicleType: VehicleCategory
): Promise<{ priceHT: number; priceTTC: number } | null> => {
  try {
    if (distance <= 0) {
      return { priceHT: 0, priceTTC: 0 };
    }
    
    const pricingItems = await fetchPricingGridByVehicleType(vehicleType);
    
    if (pricingItems.length === 0) {
      console.error(`Pas de grille tarifaire trouvée pour ${vehicleType}`);
      return null;
    }
    
    // Trouver l'item correspondant à la distance
    const pricingItem = pricingItems.find(
      item => distance >= item.min_distance && distance <= item.max_distance
    );
    
    if (!pricingItem) {
      console.error(`Pas de tarif trouvé pour la distance ${distance}km et le type ${vehicleType}`);
      return null;
    }
    
    // Calcul en fonction du type de tarif (forfait ou km)
    if (pricingItem.type_tarif === 'forfait') {
      return {
        priceHT: pricingItem.price_ht,
        priceTTC: pricingItem.price_ttc
      };
    } else {
      // Pour le tarif au km, multiplier par la distance
      return {
        priceHT: Math.round(pricingItem.price_ht * distance * 100) / 100,
        priceTTC: Math.round(pricingItem.price_ttc * distance * 100) / 100
      };
    }
  } catch (e) {
    console.error('Erreur lors du calcul du prix:', e);
    return null;
  }
};

/**
 * Met à jour un élément de la grille tarifaire
 */
export const updatePricingGridItem = async (
  id: number, 
  updates: Partial<PricingGridItem>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('pricing_grids')
      .update({
        ...updates,
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du tarif:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
      return false;
    }
    
    toast.success('Tarif mis à jour avec succès');
    return true;
  } catch (e) {
    console.error('Exception lors de la mise à jour du tarif:', e);
    toast.error('Erreur lors de la mise à jour du tarif');
    return false;
  }
};
