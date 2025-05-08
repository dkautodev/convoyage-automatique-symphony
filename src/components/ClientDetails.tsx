
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Client, Address } from '@/types/supabase';
import { updateClient } from '@/utils/clientUtils';

interface ClientDetailsProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({
  client,
  open,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialiser les champs quand le client change
  React.useEffect(() => {
    if (client) {
      setFormData({
        company_name: client.company_name,
        siret: client.siret,
        vat_number: client.vat_number || '',
        phone1: client.phone1,
        phone2: client.phone2 || '',
        billing_address: client.billing_address ? { ...client.billing_address } : {
          street: '',
          city: '',
          postal_code: '',
          country: 'France'
        } as Address
      });
    }
  }, [client]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      billing_address: {
        ...(prev.billing_address || {} as Address),
        [name]: value
      } as Address
    }));
  };

  const handleSubmit = async () => {
    if (!client) return;
    
    try {
      setIsSubmitting(true);
      
      const success = await updateClient(client.id, formData);
      
      if (!success) {
        throw new Error("Échec de la mise à jour");
      }
      
      toast.success('Client mis à jour avec succès');
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du client:', error);
      toast.error(`Erreur lors de la mise à jour du client: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{client.id ? 'Modifier le client' : 'Ajouter un client'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="company_name">Nom de l'entreprise *</Label>
              <Input
                id="company_name"
                name="company_name"
                value={formData.company_name || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="siret">SIRET *</Label>
              <Input
                id="siret"
                name="siret"
                value={formData.siret || ''}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="vat_number">Numéro de TVA</Label>
              <Input
                id="vat_number"
                name="vat_number"
                value={formData.vat_number || ''}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone1">Téléphone principal *</Label>
                <Input
                  id="phone1"
                  name="phone1"
                  value={formData.phone1 || ''}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone2">Téléphone secondaire</Label>
                <Input
                  id="phone2"
                  name="phone2"
                  value={formData.phone2 || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <fieldset className="border p-4 rounded-md">
              <legend className="text-sm px-2">Adresse de facturation</legend>
              
              <div className="grid gap-3">
                <div>
                  <Label htmlFor="street">Rue *</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.billing_address?.street || ''}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      value={formData.billing_address?.postal_code || ''}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.billing_address?.city || ''}
                      onChange={handleAddressChange}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="country">Pays *</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.billing_address?.country || 'France'}
                    onChange={handleAddressChange}
                    required
                  />
                </div>
              </div>
            </fieldset>
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

export default ClientDetails;
