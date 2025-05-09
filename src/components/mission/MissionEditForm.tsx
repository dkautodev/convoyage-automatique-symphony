
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Edit, Save } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { Mission } from '@/types/supabase';
import { z } from 'zod';

// Schéma de validation pour la mise à jour de la mission
const missionUpdateSchema = z.object({
  status: z.string(),
  mission_type: z.string().optional(),
  notes: z.string().optional(),
  contact_pickup_name: z.string().optional(),
  contact_pickup_phone: z.string().optional(),
  contact_pickup_email: z.string().email().optional().or(z.literal('')),
  contact_delivery_name: z.string().optional(),
  contact_delivery_phone: z.string().optional(),
  contact_delivery_email: z.string().email().optional().or(z.literal('')),
  scheduled_date: z.string().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_registration: z.string().optional(),
  vehicle_vin: z.string().optional(),
  vehicle_fuel: z.string().optional(),
  vehicle_year: z.string().optional()
});

// Type for the form values
export type MissionUpdateFormValues = z.infer<typeof missionUpdateSchema>;

interface MissionEditFormProps {
  form: UseFormReturn<MissionUpdateFormValues>;
  onSubmit: (data: MissionUpdateFormValues) => Promise<void>;
  updating: boolean;
  editMode: boolean;
  mission: Mission;
}

export const MissionEditForm: React.FC<MissionEditFormProps> = ({
  form,
  onSubmit,
  updating,
  editMode,
  mission
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          {editMode ? 'Modifier la mission' : 'Changer le statut'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut de la mission</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en_acceptation">En cours d'acceptation</SelectItem>
                      <SelectItem value="accepte">Accepté</SelectItem>
                      <SelectItem value="prise_en_charge">En cours de prise en charge</SelectItem>
                      <SelectItem value="livraison">En cours de livraison</SelectItem>
                      <SelectItem value="livre">Livré</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                      <SelectItem value="incident">Incident</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {editMode && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mission_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de mission</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={updating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de mission" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LIV">LIV</SelectItem>
                            <SelectItem value="RES">RES</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date planifiée</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} disabled={updating} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium mb-4">Contact pour le ramassage</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="contact_pickup_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de contact</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom de contact" disabled={updating} />
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
                            <Input {...field} placeholder="Téléphone" disabled={updating} />
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
                            <Input {...field} placeholder="Email" disabled={updating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium mb-4">Contact pour la livraison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="contact_delivery_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom de contact</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom de contact" disabled={updating} />
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
                            <Input {...field} placeholder="Téléphone" disabled={updating} />
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
                            <Input {...field} placeholder="Email" disabled={updating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="font-medium mb-4">Informations véhicule</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Catégorie de véhicule affichée mais non modifiable */}
                    <div>
                      <h4 className="text-sm font-medium">Catégorie de véhicule</h4>
                      <p className="mt-1 p-2 border rounded bg-gray-50">{mission.vehicle_category || 'Non spécifiée'}</p>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="vehicle_registration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Immatriculation</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="AB-123-CD" disabled={updating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vehicle_make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Marque" disabled={updating} />
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
                            <Input {...field} placeholder="Modèle" disabled={updating} />
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
                            <Input {...field} placeholder="Numéro VIN" disabled={updating} />
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
                            <Input {...field} placeholder="Type de carburant" disabled={updating} />
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
                            <Input {...field} placeholder="Année" type="number" disabled={updating} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Informations complémentaires sur la mission" 
                          rows={4}
                          disabled={updating}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <Button type="submit" disabled={updating}>
              {updating && <span className="animate-spin mr-2">●</span>}
              {editMode ? 'Enregistrer les modifications' : 'Mettre à jour le statut'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
