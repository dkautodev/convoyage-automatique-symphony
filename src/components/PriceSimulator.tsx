
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vehicleCategoryLabels, VehicleCategory } from '@/types/supabase';
import { usePricing } from '@/hooks/usePricing';
import { Euro, ArrowDown } from 'lucide-react';

const PriceSimulator: React.FC = () => {
  const [distance, setDistance] = useState<string>('');
  const [vehicleType, setVehicleType] = useState<VehicleCategory | ''>('');
  const { computePrice, loading, prices, error } = usePricing();
  
  const handleCalculatePrice = async () => {
    if (!distance || !vehicleType) return;
    await computePrice(parseFloat(distance), vehicleType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Simulateur de prix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                min="0"
                step="0.1"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="Entrez la distance en km"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vehicleType">Type de véhicule</Label>
              <Select value={vehicleType} onValueChange={(value) => setVehicleType(value as VehicleCategory)}>
                <SelectTrigger id="vehicleType">
                  <SelectValue placeholder="Sélectionnez un type de véhicule" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(vehicleCategoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleCalculatePrice} 
              disabled={!distance || !vehicleType || loading}
              className="w-full"
            >
              {loading ? 'Calcul en cours...' : 'Calculer le prix'}
            </Button>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-md">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Résultat</h3>
              {error ? (
                <p className="text-red-500">{error}</p>
              ) : prices ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Prix HT</p>
                    <p className="text-2xl font-bold">{prices.priceHT.toFixed(2)} €</p>
                  </div>
                  <div className="flex justify-center items-center">
                    <ArrowDown className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">Prix TTC</p>
                    <p className="text-2xl font-bold">{prices.priceTTC.toFixed(2)} €</p>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    TVA appliquée: 20%
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">
                  Entrez une distance et un type de véhicule pour voir le prix estimé
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceSimulator;
