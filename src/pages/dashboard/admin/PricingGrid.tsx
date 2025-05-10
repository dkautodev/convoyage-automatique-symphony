import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PricingGridItem, fetchPricingGrid } from '@/utils/pricingUtils';
import { vehicleCategoryLabels, VehicleCategory } from '@/types/supabase';
import { Euro, Filter, RefreshCw, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PricingGridEditForm from '@/components/PricingGridEditForm';
import { usePricing } from '@/hooks/usePricing';
import PriceSimulator from '@/components/PriceSimulator';
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};
const PricingGridPage: React.FC = () => {
  const [pricingData, setPricingData] = useState<PricingGridItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [searchDistance, setSearchDistance] = useState<string>('');
  const [editingItem, setEditingItem] = useState<PricingGridItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const loadPricingData = async () => {
    setLoading(true);
    try {
      const data = await fetchPricingGrid();

      // Trier les données par type de véhicule puis par distance minimale
      const sortedData = [...data].sort((a, b) => {
        // D'abord trier par type de véhicule
        if (a.vehicle_category < b.vehicle_category) return -1;
        if (a.vehicle_category > b.vehicle_category) return 1;

        // Ensuite trier par distance minimale
        return a.min_distance - b.min_distance;
      });
      setPricingData(sortedData);
    } catch (error) {
      console.error('Erreur lors du chargement des données de tarification:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadPricingData();
  }, []);

  // Filtrer les données par type de véhicule et distance
  const filteredData = pricingData.filter(item => {
    const matchesVehicle = selectedVehicle === 'all' || item.vehicle_category === selectedVehicle;
    const matchesDistance = !searchDistance || parseInt(searchDistance) >= item.min_distance && parseInt(searchDistance) <= item.max_distance;
    return matchesVehicle && (searchDistance ? matchesDistance : true);
  });

  // Grouper les données par type de véhicule pour les onglets
  const vehicleTypes = Array.from(new Set(pricingData.map(item => item.vehicle_category))).sort();
  const handleEditClick = (item: PricingGridItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grille Tarifaire</h2>
        <Button onClick={loadPricingData} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Type de véhicule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les véhicules</SelectItem>
              {vehicleTypes.map(type => <SelectItem key={type} value={type}>
                  {vehicleCategoryLabels[type as VehicleCategory]}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Grille des tarifs
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? <div className="text-center py-6">Chargement des données...</div> : <Tabs defaultValue="all" className="w-full">
              

              <TabsContent value="all" className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Véhicule</TableHead>
                      <TableHead>Distance (km)</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Prix HT</TableHead>
                      <TableHead>Prix TTC</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.length > 0 ? filteredData.map(item => <TableRow key={item.id}>
                          <TableCell>{vehicleCategoryLabels[item.vehicle_category]}</TableCell>
                          <TableCell>
                            {item.min_distance}-{item.max_distance === 9999 ? '+' : item.max_distance}
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.type_tarif === 'forfait' ? 'default' : 'outline'}>
                              {item.type_tarif === 'forfait' ? 'Forfait' : 'Prix/km'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatPrice(item.price_ht)}</TableCell>
                          <TableCell>{formatPrice(item.price_ttc)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} title="Modifier">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>) : <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Aucun tarif correspondant aux critères.
                        </TableCell>
                      </TableRow>}
                  </TableBody>
                </Table>
              </TabsContent>

              {vehicleTypes.map(type => <TabsContent key={type} value={type} className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Distance (km)</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Prix HT</TableHead>
                        <TableHead>Prix TTC</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pricingData.filter(item => item.vehicle_category === type).map(item => <TableRow key={item.id}>
                            <TableCell>
                              {item.min_distance}-{item.max_distance === 9999 ? '+' : item.max_distance}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.type_tarif === 'forfait' ? 'default' : 'outline'}>
                                {item.type_tarif === 'forfait' ? 'Forfait' : 'Prix/km'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatPrice(item.price_ht)}</TableCell>
                            <TableCell>{formatPrice(item.price_ttc)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} title="Modifier">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>)}
                    </TableBody>
                  </Table>
                </TabsContent>)}
            </Tabs>}
        </CardContent>
      </Card>

      <PriceSimulator />

      <PricingGridEditForm item={editingItem} open={isDialogOpen} onClose={handleDialogClose} onSave={loadPricingData} />
    </div>;
};
export default PricingGridPage;