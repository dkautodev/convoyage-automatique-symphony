
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PricingGridItem, updatePricingGridItem } from '@/utils/pricingUtils';
import { vehicleCategoryLabels, VehicleCategory } from '@/types/supabase';
import { toast } from 'sonner';

interface PricingGridEditFormProps {
  item: PricingGridItem | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PricingGridEditForm: React.FC<PricingGridEditFormProps> = ({
  item,
  open,
  onClose,
  onSave
}) => {
  const [priceHT, setPriceHT] = useState<string>('');
  const [priceTTC, setPriceTTC] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // TVA 20%
  const TVA_RATE = 0.2;

  // Initialiser les champs quand l'élément change
  useEffect(() => {
    if (item) {
      setPriceHT(item.price_ht.toString());
      setPriceTTC(item.price_ttc.toString());
    }
  }, [item]);

  // Calculer le prix TTC à partir du prix HT
  const calculatePriceTTC = (priceHT: string): string => {
    const ht = parseFloat(priceHT);
    if (isNaN(ht)) return '';
    const ttc = Math.round((ht * (1 + TVA_RATE)) * 100) / 100;
    return ttc.toString();
  };

  // Calculer le prix HT à partir du prix TTC
  const calculatePriceHT = (priceTTC: string): string => {
    const ttc = parseFloat(priceTTC);
    if (isNaN(ttc)) return '';
    const ht = Math.round((ttc / (1 + TVA_RATE)) * 100) / 100;
    return ht.toString();
  };

  // Gestion du changement de prix HT
  const handlePriceHTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceHT = e.target.value;
    setPriceHT(newPriceHT);
    setPriceTTC(calculatePriceTTC(newPriceHT));
  };

  // Gestion du changement de prix TTC
  const handlePriceTTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPriceTTC = e.target.value;
    setPriceTTC(newPriceTTC);
    setPriceHT(calculatePriceHT(newPriceTTC));
  };

  // Soumission du formulaire
  const handleSubmit = async () => {
    if (!item) return;
    
    try {
      setIsSubmitting(true);
      
      const updates = {
        price_ht: parseFloat(priceHT),
        price_ttc: parseFloat(priceTTC)
      };
      
      const success = await updatePricingGridItem(item.id, updates);
      
      if (success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tarif:', error);
      toast.error('Erreur lors de la mise à jour du tarif');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le tarif</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label>Type de véhicule</Label>
            <div>
              {vehicleCategoryLabels[item.vehicle_category as VehicleCategory]}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label>Distance</Label>
            <div>
              {item.min_distance} - {item.max_distance === 9999 ? '+' : item.max_distance} km
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label>Type de tarif</Label>
            <Badge variant={item.type_tarif === 'forfait' ? 'default' : 'outline'}>
              {item.type_tarif === 'forfait' ? 'Forfait' : 'Prix/km'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label htmlFor="priceHT">Prix HT (€)</Label>
            <Input
              id="priceHT"
              type="number"
              step="0.01"
              value={priceHT}
              onChange={handlePriceHTChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 items-center">
            <Label htmlFor="priceTTC">Prix TTC (€)</Label>
            <Input
              id="priceTTC"
              type="number"
              step="0.01"
              value={priceTTC}
              onChange={handlePriceTTCChange}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PricingGridEditForm;
