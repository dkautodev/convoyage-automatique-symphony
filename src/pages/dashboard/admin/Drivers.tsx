import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Eye, X, Search, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { typedSupabase } from '@/types/database';
import { format } from 'date-fns';
import { Address } from '@/hooks/auth/types';
import { Json } from '@/integrations/supabase/types';

// Updated Driver interface to match what's coming from the database
interface Driver {
  id: string;
  full_name: string | null;
  email: string;
  phone_1: string | null;
  created_at: string;
  billing_address?: Json | null;
  // These fields might be in the drivers_config table, not in profiles
  license_number?: string | null;
  id_number?: string | null;
}

interface DriverDocument {
  type: 'kbis' | 'vigilance' | 'license' | 'id';
  path: string | null;
  label: string;
}

interface DriverConfig {
  id: string;
  legal_status: string | null;
  license_document_path: string | null;
  id_document_path: string | null;
  kbis_document_path: string | null;
  vigilance_document_path: string | null;
}

const DriversPage = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [driverConfig, setDriverConfig] = useState<DriverConfig | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; type: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      // Fetch all profiles with role = chauffeur
      const { data: driversData, error } = await typedSupabase
        .from('profiles')
        .select('*')
        .eq('role', 'chauffeur')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw driver data:', driversData); // Add logging to check the data
      
      // Convert the data to Driver[] type by explicitly mapping the fields we need
      const formattedDrivers: Driver[] = driversData.map(driver => {
        console.log(`Driver ${driver.id} billing address:`, driver.billing_address);
        return {
          id: driver.id,
          full_name: driver.full_name,
          email: driver.email,
          phone_1: driver.phone_1,
          created_at: driver.created_at,
          billing_address: driver.billing_address
        };
      });
      
      setDrivers(formattedDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des chauffeurs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverConfig = async (driverId: string) => {
    try {
      const { data, error } = await typedSupabase
        .from('drivers_config')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as DriverConfig | null;
    } catch (error) {
      console.error('Error fetching driver config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les détails du chauffeur.',
        variant: 'destructive',
      });
      return null;
    }
  };

  const handleDriverSelect = async (driver: Driver) => {
    setSelectedDriver(driver);
    const config = await fetchDriverConfig(driver.id);
    setDriverConfig(config);
  };

  const handleDeleteDocument = async (driverId: string, documentType: string, fieldName: string) => {
    if (!driverConfig) return;

    try {
      // First delete the document from storage if it exists
      const path = driverConfig[fieldName as keyof typeof driverConfig] as string | null;
      
      if (path) {
        const { error: storageError } = await typedSupabase.storage
          .from('driver.doc.config')
          .remove([path]);

        if (storageError) throw storageError;
      }

      // Then update the database record
      const { error: dbError } = await typedSupabase
        .from('drivers_config')
        .update({ [fieldName]: null })
        .eq('id', driverId);

      if (dbError) throw dbError;

      // Update local state
      setDriverConfig({
        ...driverConfig,
        [fieldName]: null
      });

      toast({
        description: `Document ${documentType} supprimé avec succès.`,
      });
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le document.',
        variant: 'destructive',
      });
    }
  };

  const getDocumentUrl = (path: string | null): string | null => {
    if (!path) return null;
    
    try {
      const { data } = typedSupabase.storage
        .from('driver.doc.config')
        .getPublicUrl(path);
      
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  };

  const openDocumentPreview = (path: string | null, type: string) => {
    if (!path) return;
    
    const url = getDocumentUrl(path);
    if (url) {
      setPreviewDocument({ url, type });
    }
  };

  const getDriverDocuments = (config: DriverConfig | null): DriverDocument[] => {
    if (!config) return [];

    return [
      { type: 'license', path: config.license_document_path, label: 'Permis de conduire' },
      { type: 'id', path: config.id_document_path, label: 'Pièce d\'identité' },
      { type: 'kbis', path: config.kbis_document_path, label: 'KBIS' },
      { type: 'vigilance', path: config.vigilance_document_path, label: 'Attestation de vigilance' },
    ];
  };

  // Helper function to format the address for display
  const formatAddress = (addressData: Json | null): string => {
    if (!addressData) return 'Non définie';
    
    try {
      console.log('Formatting address data:', addressData);
      
      // Try to parse the address data based on different possible formats
      if (typeof addressData === 'string') {
        try {
          addressData = JSON.parse(addressData);
        } catch (e) {
          console.error('Failed to parse address string:', e);
        }
      }
      
      // Cast to Address type and handle potential format variations
      const address = addressData as unknown as Address;
      
      // Check if we have a formatted_address field (which might contain the full address)
      if (address.formatted_address) {
        return address.formatted_address;
      }
      
      // Otherwise try to build from individual fields
      const parts = [
        address.street,
        address.postal_code,
        address.city,
        address.country
      ].filter(Boolean);
      
      return parts.length > 0 ? parts.join(', ') : 'Adresse incomplète';
    } catch (error) {
      console.error('Error formatting address:', error, addressData);
      return 'Format d\'adresse invalide';
    }
  };

  // Filter drivers based on search term
  const filteredDrivers = searchTerm
    ? drivers.filter(driver => 
        ((driver.full_name || '').toLowerCase()).includes(searchTerm.toLowerCase()) ||
        ((driver.email || '').toLowerCase()).includes(searchTerm.toLowerCase())
      )
    : drivers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des chauffeurs</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Liste des chauffeurs</CardTitle>
            <CardDescription>Gérer les profils des chauffeurs et leurs documents</CardDescription>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Rechercher un chauffeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <p>Aucun chauffeur à afficher{searchTerm ? " pour cette recherche" : ""}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Date d'inscription</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.full_name || 'Non défini'}</TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>{driver.phone_1 || 'Non défini'}</TableCell>
                      <TableCell>
                        {driver.created_at ? format(new Date(driver.created_at), 'dd/MM/yyyy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDriverSelect(driver)}
                          className="ml-2"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Voir le profil
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Driver Profile Dialog */}
      <Dialog open={!!selectedDriver} onOpenChange={(open) => !open && setSelectedDriver(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Profil du Chauffeur</DialogTitle>
          </DialogHeader>
          
          {selectedDriver && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm">Nom</h3>
                  <p>{selectedDriver.full_name || 'Non défini'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Email</h3>
                  <p>{selectedDriver.email}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Téléphone</h3>
                  <p>{selectedDriver.phone_1 || 'Non défini'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Statut légal</h3>
                  <p>{driverConfig?.legal_status || 'Non défini'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">N° de permis</h3>
                  <p>{selectedDriver.license_number || 'Non défini'}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm">N° d'identité</h3>
                  <p>{selectedDriver.id_number || 'Non défini'}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">Adresse de facturation</h3>
                <p>{formatAddress(selectedDriver.billing_address)}</p>
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Documents</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getDriverDocuments(driverConfig).map((doc) => (
                      <TableRow key={doc.type}>
                        <TableCell>{doc.label}</TableCell>
                        <TableCell>
                          {doc.path ? (
                            <span className="text-green-600 font-medium">Téléchargé</span>
                          ) : (
                            <span className="text-amber-600">Non fourni</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {doc.path && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDocumentPreview(doc.path, doc.label)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteDocument(
                                  selectedDriver.id, 
                                  doc.label, 
                                  `${doc.type}_document_path`
                                )}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewDocument?.type}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-2">
            {previewDocument && (
              <div className="flex justify-center">
                {previewDocument.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={previewDocument.url}
                    className="w-full h-[70vh]"
                    title="Document Preview"
                  />
                ) : (
                  <img 
                    src={previewDocument.url} 
                    alt="Document Preview" 
                    className="max-h-[70vh] object-contain"
                  />
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriversPage;
