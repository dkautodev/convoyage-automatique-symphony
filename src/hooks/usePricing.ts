
import { useState } from 'react';
import { VehicleCategory } from '@/types/supabase';
import { calculatePrice, fetchPricingGrid, PricingGridItem } from '@/utils/pricingUtils';

export function usePricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<{ priceHT: number; priceTTC: number } | null>(null);
  const [pricingGridData, setPricingGridData] = useState<PricingGridItem[]>([]);

  /**
   * Calcule le prix pour une distance et un type de véhicule spécifiques
   */
  const computePrice = async (distance: number, vehicleType: VehicleCategory) => {
    setLoading(true);
    setError(null);
    try {
      const result = await calculatePrice(distance, vehicleType);
      setPrices(result);
      return result;
    } catch (err) {
      console.error('Erreur lors du calcul du prix:', err);
      setError('Erreur lors du calcul du prix');
      setPrices(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Charge les données de la grille tarifaire
   */
  const loadPricingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPricingGrid();
      setPricingGridData(data);
      return data;
    } catch (err) {
      console.error('Erreur lors du chargement des données de tarification:', err);
      setError('Erreur lors du chargement des données de tarification');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    prices,
    pricingGridData,
    computePrice,
    loadPricingData,
  };
}
