import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Plus, Search, User, Phone, Mail, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchClients, deleteClient } from '@/utils/clientUtils';
import { Client } from '@/types/supabase';
import ClientDetails from '@/components/ClientDetails';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [clientToView, setClientToView] = useState<Client | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return client.company_name && client.company_name.toLowerCase().includes(searchLower) || 
           client.siret && client.siret.toLowerCase().includes(searchLower) || 
           client.vat_number && client.vat_number.toLowerCase().includes(searchLower) || 
           client.full_name && client.full_name.toLowerCase().includes(searchLower) || 
           client.email && client.email.toLowerCase().includes(searchLower);
  });

  const handleNewClient = () => {
    // Create a new empty client object
    const newClient: Client = {
      id: '',
      company_name: null,
      siret: null,
      vat_number: null,
      billing_address: null,
      phone1: null,
      phone2: null,
      email: '',
      full_name: null,
      created_at: new Date().toISOString(),
      profile_completed: false
    };
    setSelectedClient(newClient);
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setClientToView(client);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (clientToDelete) {
      try {
        const success = await deleteClient(clientToDelete.id);
        if (success) {
          toast.success(`Client ${clientToDelete.company_name || clientToDelete.full_name || clientToDelete.email} supprimé avec succès`);
          loadClients();
        } else {
          toast.error('Erreur lors de la suppression du client');
        }
      } catch (error) {
        console.error('Erreur lors de la suppression du client:', error);
        toast.error('Erreur lors de la suppression du client');
      } finally {
        setIsDeleteDialogOpen(false);
        setClientToDelete(null);
      }
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedClient(null);
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Non spécifié';
    const {
      street,
      postal_code,
      city,
      country
    } = address;
    return `${street || ''}, ${postal_code || ''} ${city || ''}, ${country || ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Liste des clients</h1>
          <p className="text-muted-foreground mt-1">Gérer les profils des clients et leurs documents</p>
        </div>
        <Button onClick={handleNewClient} className="flex gap-2 items-center">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-medium">Liste des clients</h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
            <Input 
              type="search" 
              placeholder="Rechercher un client..." 
              className="pl-8" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="text-center py-10 text-neutral-500">
              <p>Chargement des clients...</p>
            </div>
          ) : filteredClients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nom / Entreprise</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        {client.company_name && (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-neutral-500" />
                            {client.company_name}
                          </div>
                        )}
                        {client.full_name && (
                          <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <User className="h-3 w-3 text-neutral-500" />
                            {client.full_name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-neutral-500" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone1 && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-neutral-500" />
                          {client.phone1}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewClient(client)} 
                        className="flex items-center gap-1"
                      >
                        <User className="h-3.5 w-3.5" />
                        Voir le profil
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 text-neutral-500">
              <p>Aucun client à afficher{searchTerm ? ' pour cette recherche' : ''}.</p>
              {!searchTerm && (
                <p className="text-sm mt-1">Créez votre premier client en cliquant sur "Nouveau client"</p>
              )}
            </div>
          )}
        </div>
      </div>

      <ClientDetails client={selectedClient} open={isDialogOpen} onClose={handleDialogClose} onSave={loadClients} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données associées à {clientToDelete?.company_name || clientToDelete?.full_name || clientToDelete?.email} seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Client View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {clientToView?.company_name || clientToView?.full_name || 'Détails du client'}
            </DialogTitle>
          </DialogHeader>
          
          {clientToView && (
            <div className="space-y-6 mt-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-muted-foreground mb-1">Informations générales</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Entreprise:</span>{' '}
                      {clientToView.company_name || 'Non spécifié'}
                    </div>
                    <div>
                      <span className="font-medium">Nom complet:</span>{' '}
                      {clientToView.full_name || 'Non spécifié'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      {clientToView.email}
                    </div>
                    <div>
                      <span className="font-medium">Téléphone principal:</span>{' '}
                      {clientToView.phone1 || 'Non spécifié'}
                    </div>
                    <div>
                      <span className="font-medium">Téléphone secondaire:</span>{' '}
                      {clientToView.phone2 || 'Non spécifié'}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-muted-foreground mb-1">Informations fiscales</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">SIRET:</span>{' '}
                      {clientToView.siret || 'Non spécifié'}
                    </div>
                    <div>
                      <span className="font-medium">Numéro de TVA:</span>{' '}
                      {clientToView.vat_number || 'Non spécifié'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-muted-foreground mb-1">Adresse de facturation</h3>
                <div className="p-3 border rounded-md bg-muted/20">
                  {formatAddress(clientToView.billing_address)}
                </div>
              </div>
              
              <div>
                <h3 className="text-muted-foreground mb-1">Informations supplémentaires</h3>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">Date de création:</span>{' '}
                    {clientToView.created_at ? new Date(clientToView.created_at).toLocaleDateString('fr-FR') : 'Non spécifié'}
                  </div>
                  <div>
                    <span className="font-medium">Profil complété:</span>{' '}
                    {clientToView.profile_completed ? 'Oui' : 'Non'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsPage;
