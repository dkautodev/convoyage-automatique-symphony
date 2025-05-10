
import { useState } from 'react';
import { VehicleCategory } from '@/types/supabase';
import { calculatePrice, fetchPricingGrid, PricingGridItem, calculateTTC, calculateHT } from '@/utils/pricingUtils';

export function usePricing() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prices, setPrices] = useState<{ priceHT: number; priceTTC: number; vehicleId: number | null } | null>(null);
  const [pricingGridData, setPricingGridData] = useState<PricingGridItem[]>([]);
  const [simulatedDistance, setSimulatedDistance] = useState<number | null>(null);
  const [simulatedVehicleType, setSimulatedVehicleType] = useState<VehicleCategory | null>(null);

  /**
   * Calcule le prix pour une distance et un type de véhicule spécifiques
   */
  const computePrice = async (distance: number, vehicleType: VehicleCategory) => {
    setLoading(true);
    setError(null);
    setSimulatedDistance(distance);
    setSimulatedVehicleType(vehicleType);
    try {
      const result = await calculatePrice(distance, vehicleType);
      if (result) {
        setPrices(result);
        return result;
      } else {
        setError('Impossible de calculer le prix avec les paramètres fournis');
        setPrices(null);
        return null;
      }
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
      if (data.length === 0) {
        setError('Aucune donnée de tarification disponible');
      }
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

  // Calculer le TTC à partir du HT
  const convertToTTC = (priceHT: number) => {
    return calculateTTC(priceHT);
  };

  // Calculer le HT à partir du TTC
  const convertToHT = (priceTTC: number) => {
    return calculateHT(priceTTC);
  };

  return {
    loading,
    error,
    prices,
    pricingGridData,
    simulatedDistance,
    simulatedVehicleType,
    computePrice,
    loadPricingData,
    convertToTTC,
    convertToHT
  };
}
