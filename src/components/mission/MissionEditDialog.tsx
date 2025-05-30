
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mission } from '@/types/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Edit, Save, Calculator } from 'lucide-react';
import { typedSupabase } from '@/types/database';

const missionEditSchema = z.object({
  price_ht: z.string().optional(),
  price_ttc: z.string().optional(),
  contact_pickup_name: z.string().optional(),
  contact_pickup_phone: z.string().optional(),
  contact_pickup_email: z.string().email('Email invalide').optional().or(z.literal('')),
  contact_delivery_name: z.string().optional(),
  contact_delivery_phone: z.string().optional(),
  contact_delivery_email: z.string().email('Email invalide').optional().or(z.literal('')),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.string().optional(),
  vehicle_registration: z.string().optional(),
  vehicle_vin: z.string().optional(),
  vehicle_fuel: z.string().optional(),
  D1_PEC: z.string().optional(),
  H1_PEC: z.string().optional(),
  H2_PEC: z.string().optional(),
  D2_LIV: z.string().optional(),
  H1_LIV: z.string().optional(),
  H2_LIV: z.string().optional(),
  notes: z.string().optional()
});

type MissionEditFormValues = z.infer<typeof missionEditSchema>;

interface MissionEditDialogProps {
  mission: Mission;
  isOpen: boolean;
  onClose: () => void;
  onMissionUpdated: () => void;
}

export const MissionEditDialog: React.FC<MissionEditDialogProps> = ({
  mission,
  isOpen,
  onClose,
  onMissionUpdated
}) => {
  const [updating, setUpdating] = React.useState(false);
  
  const form = useForm<MissionEditFormValues>({
    resolver: zodResolver(missionEditSchema),
    defaultValues: {
      price_ht: mission.price_ht ? String(mission.price_ht) : '',
      price_ttc: mission.price_ttc ? String(mission.price_ttc) : '',
      contact_pickup_name: mission.contact_pickup_name || '',
      contact_pickup_phone: mission.contact_pickup_phone || '',
      contact_pickup_email: mission.contact_pickup_email || '',
      contact_delivery_name: mission.contact_delivery_name || '',
      contact_delivery_phone: mission.contact_delivery_phone || '',
      contact_delivery_email: mission.contact_delivery_email || '',
      vehicle_make: mission.vehicle_make || '',
      vehicle_model: mission.vehicle_model || '',
      vehicle_year: mission.vehicle_year ? String(mission.vehicle_year) : '',
      vehicle_registration: mission.vehicle_registration || '',
      vehicle_vin: mission.vehicle_vin || '',
      vehicle_fuel: mission.vehicle_fuel || '',
      D1_PEC: mission.D1_PEC || '',
      H1_PEC: mission.H1_PEC || '',
      H2_PEC: mission.H2_PEC || '',
      D2_LIV: mission.D2_LIV || '',
      H1_LIV: mission.H1_LIV || '',
      H2_LIV: mission.H2_LIV || '',
      notes: mission.notes || ''
    }
  });

  // Calculate TTC from HT with TVA rate (default 20%)
  const calculateTTC = (priceHT: number): number => {
    const vatRate = mission.vat_rate || 20;
    return Math.round((priceHT * (1 + vatRate / 100)) * 100) / 100;
  };

  // Calculate HT from TTC with TVA rate (default 20%)
  const calculateHT = (priceTTC: number): number => {
    const vatRate = mission.vat_rate || 20;
    return Math.round((priceTTC / (1 + vatRate / 100)) * 100) / 100;
  };

  // Handle HT price change to auto-calculate TTC
  const handleHTChange = (value: string) => {
    const htValue = parseFloat(value);
    if (!isNaN(htValue) && htValue >= 0) {
      const ttcValue = calculateTTC(htValue);
      form.setValue('price_ttc', String(ttcValue));
    }
  };

  // Handle TTC price change to auto-calculate HT
  const handleTTCChange = (value: string) => {
    const ttcValue = parseFloat(value);
    if (!isNaN(ttcValue) && ttcValue >= 0) {
      const htValue = calculateHT(ttcValue);
      form.setValue('price_ht', String(htValue));
    }
  };

  const handleSubmit = async (data: MissionEditFormValues) => {
    try {
      setUpdating(true);
      
      // Convert vehicle_year back to a number or null
      let vehicle_year: number | null = null;
      if (data.vehicle_year && !isNaN(parseInt(data.vehicle_year))) {
        vehicle_year = parseInt(data.vehicle_year);
      }

      // Convert prices to numbers
      let price_ht: number | null = null;
      let price_ttc: number | null = null;
      
      if (data.price_ht && !isNaN(parseFloat(data.price_ht))) {
        price_ht = parseFloat(data.price_ht);
      }
      
      if (data.price_ttc && !isNaN(parseFloat(data.price_ttc))) {
        price_ttc = parseFloat(data.price_ttc);
      }
      
      const { error } = await typedSupabase
        .from('missions')
        .update({
          price_ht,
          price_ttc,
          contact_pickup_name: data.contact_pickup_name,
          contact_pickup_phone: data.contact_pickup_phone,
          contact_pickup_email: data.contact_pickup_email,
          contact_delivery_name: data.contact_delivery_name,
          contact_delivery_phone: data.contact_delivery_phone,
          contact_delivery_email: data.contact_delivery_email,
          vehicle_make: data.vehicle_make,
          vehicle_model: data.vehicle_model,
          vehicle_year,
          vehicle_registration: data.vehicle_registration,
          vehicle_vin: data.vehicle_vin,
          vehicle_fuel: data.vehicle_fuel,
          D1_PEC: data.D1_PEC,
          H1_PEC: data.H1_PEC,
          H2_PEC: data.H2_PEC,
          D2_LIV: data.D2_LIV,
          H1_LIV: data.H1_LIV,
          H2_LIV: data.H2_LIV,
          notes: data.notes
        })
        .eq('id', mission.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Mission mise à jour avec succès');
      onMissionUpdated();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error);
      toast.error('Erreur lors de la mise à jour de la mission');
    } finally {
      setUpdating(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Modifier les informations de mission
          </DialogTitle>
          <DialogDescription>
            Mettez à jour les prix, les contacts, les informations du véhicule, les dates et les notes.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Section Prix - EN PREMIER */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-4 flex items-center gap-2 text-blue-800">
                <Calculator className="h-4 w-4" />
                Prix de la mission
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price_ht"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix HT (€)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="0.00" 
                          type="number" 
                          step="0.01"
                          onChange={(e) => {
                            field.onChange(e);
                            handleHTChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="price_ttc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix TTC (€)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="0.00" 
                          type="number" 
                          step="0.01"
                          onChange={(e) => {
                            field.onChange(e);
                            handleTTCChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Taux de TVA: {mission.vat_rate || 20}% - Les prix se calculent automatiquement
              </p>
            </div>

            {/* Contact départ */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Contact pour le départ</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contact_pickup_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom du contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_pickup_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Numéro de téléphone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_pickup_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Adresse email" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Contact livraison */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Contact pour la livraison</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="contact_delivery_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom du contact" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_delivery_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Numéro de téléphone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact_delivery_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Adresse email" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Informations véhicule */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Informations du véhicule</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="vehicle_make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Marque" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Modèle" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Année" type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_registration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Immatriculation</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="AB-123-CD" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Numéro VIN" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vehicle_fuel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carburant</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Type de carburant" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Dates et créneaux */}
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-4">Dates et créneaux</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Départ</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="D1_PEC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="H1_PEC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure début</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="H2_PEC"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure fin</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Livraison</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField
                      control={form.control}
                      name="D2_LIV"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="H1_LIV"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure début</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="H2_LIV"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heure fin</FormLabel>
                          <FormControl>
                            <Input {...field} type="time" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Notes complémentaires */}
            <div className="border-t pt-4 mt-4">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes complémentaires</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Informations supplémentaires sur la mission" 
                        rows={4} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={updating}>
                Annuler
              </Button>
              <Button type="submit" disabled={updating}>
                {updating && <span className="animate-spin mr-2">●</span>}
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
