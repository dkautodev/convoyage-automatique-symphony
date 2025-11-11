import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Filter, FileText, Truck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, MissionStatus } from '@/types/supabase';
import { toast } from 'sonner';
import { formatAddressDisplay, formatMissionNumber, formatClientName, missionStatusLabels, missionStatusColors } from '@/utils/missionUtils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClients } from '@/hooks/useClients';
import { useProfiles } from '@/hooks/useProfiles';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { useIsMobile } from '@/hooks/use-mobile';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Define valid tab values type that includes 'all' and all mission statuses
type MissionTab = 'all' | MissionStatus;

// Define the order of statuses like in client missions page
const ORDERED_STATUSES: MissionStatus[] = ['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident'];
const MissionsPage = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<MissionTab>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientsData, setClientsData] = useState<Record<string, any>>({});
  const [driversData, setDriversData] = useState<Record<string, any>>({});

  // État pour la boîte de dialogue de changement de statut
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [newStatus, setNewStatus] = useState<MissionStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // État pour la boîte de dialogue de filtres
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [driverSearchTerm, setDriverSearchTerm] = useState('');

  // Utiliser les hooks pour récupérer les clients et chauffeurs
  const {
    clients: clientsList,
    loading: clientsLoading
  } = useClients();
  const {
    profiles: driversList,
    loading: driversLoading
  } = useProfiles('chauffeur');
  useEffect(() => {
    fetchMissions();
  }, []);
  useEffect(() => {
    fetchClients();
    fetchDrivers();
  }, []);
  const fetchClients = async () => {
    try {
      const {
        data,
        error
      } = await typedSupabase.from('profiles').select('id, company_name, full_name').eq('role', 'client');
      if (error) throw error;

      // Create a map of client ID to name for easy lookup
      const clientMap: Record<string, any> = {};
      data?.forEach(client => {
        clientMap[client.id] = {
          name: client.company_name || client.full_name || 'Client inconnu'
        };
      });
      setClientsData(clientMap);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };
  const fetchDrivers = async () => {
    try {
      const {
        data,
        error
      } = await typedSupabase.from('profiles').select('id, full_name').eq('role', 'chauffeur');
      if (error) throw error;

      // Create a map of driver ID to name for easy lookup
      const driverMap: Record<string, any> = {};
      data?.forEach(driver => {
        driverMap[driver.id] = {
          name: driver.full_name || 'Chauffeur inconnu'
        };
      });
      setDriversData(driverMap);
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };
  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = typedSupabase.from('missions').select('*').order('created_at', {
        ascending: false
      });

      // Apply client filter if selected
      if (selectedClientId) {
        query = query.eq('client_id', selectedClientId);
      }

      // Apply driver filter if selected
      if (selectedDriverId) {
        query = query.eq('chauffeur_id', selectedDriverId);
      }
      const {
        data: missionsData,
        error: missionsError
      } = await query;
      if (missionsError) {
        console.error('Erreur lors de la récupération des missions:', missionsError);
        throw missionsError;
      }
      console.log('Missions récupérées:', missionsData);
      const convertedMissions = (missionsData || []).map(mission => {
        const basicMission = convertMissionFromDB(mission as unknown as MissionFromDB);
        return {
          ...basicMission,
          client_name: clientsData[mission.client_id]?.name || 'Client inconnu',
          driver_name: driversData[mission.chauffeur_id]?.name || 'Chauffeur non assigné'
        };
      });
      setMissions(convertedMissions);
    } catch (err) {
      console.error('Error fetching missions:', err);
      setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  // Appliquer les filtres et fermer la boîte de dialogue
  const applyFilters = () => {
    fetchMissions();
    setFilterDialogOpen(false);
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setSelectedClientId(null);
    setSelectedDriverId(null);
    setClientSearchTerm('');
    setDriverSearchTerm('');
    setFilterDialogOpen(false);
    // Utiliser setTimeout pour s'assurer que l'état est bien mis à jour avant de récupérer les missions
    setTimeout(() => {
      fetchMissions();
    }, 0);
  };

  // Nouvelle fonction pour ouvrir la boîte de dialogue de changement de statut
  const openStatusDialog = (mission: Mission) => {
    setSelectedMission(mission);
    setNewStatus(mission.status);
    setStatusDialogOpen(true);
  };

  // Nouvelle fonction pour mettre à jour le statut d'une mission
  const updateMissionStatus = async () => {
    if (!selectedMission || !newStatus || newStatus === selectedMission.status || updatingStatus) return;
    try {
      setUpdatingStatus(true);
      const {
        error
      } = await typedSupabase.from('missions').update({
        status: newStatus
      }).eq('id', selectedMission.id);
      if (error) throw error;
      toast.success(`Statut mis à jour: ${missionStatusLabels[newStatus as MissionStatus]}`);
      fetchMissions(); // Rafraîchir la liste des missions
      setStatusDialogOpen(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Prepare mission counts by status for tabs - Always calculate based on all missions
  const missionCountsByStatus = missions.reduce((acc, mission) => {
    acc[mission.status] = (acc[mission.status] || 0) + 1;
    return acc;
  }, {} as Record<MissionStatus, number>);

  // Filtered missions based on active tab and search query
  const filteredMissions = missions.filter(mission => {
    // Filter by tab (status)
    if (activeTab !== 'all' && mission.status !== activeTab) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (mission.mission_number || mission.id).toLowerCase().includes(searchLower) || (mission.pickup_address?.city || '').toLowerCase().includes(searchLower) || (mission.delivery_address?.city || '').toLowerCase().includes(searchLower) || missionStatusLabels[mission.status].toLowerCase().includes(searchLower) || (mission as any).client_name?.toLowerCase().includes(searchLower) || (mission as any).driver_name?.toLowerCase().includes(searchLower);
  });
  const handleCreateNewMission = () => {
    navigate('/mission/create');
  };
  const navigateToPricingGrid = () => {
    navigate('/admin/pricing-grid');
  };

  // Empty state component
  const EmptyState = () => <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
      
      
    </div>;

  // Tous les statuts disponibles pour la boîte de dialogue de changement de statut
  const allStatuses: MissionStatus[] = ['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident'];

  // Function to handle tab change with proper typing
  const handleTabChange = (value: string) => {
    setActiveTab(value as MissionTab);
  };

  // Filtrer les clients en fonction du terme de recherche
  const filteredClients = Object.entries(clientsList).filter(([_, client]) => client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()));

  // Filtrer les chauffeurs en fonction du terme de recherche
  const filteredDrivers = driversList.filter(driver => driver.label.toLowerCase().includes(driverSearchTerm.toLowerCase()));

  // Get current filter label for mobile dropdown
  const getCurrentFilterLabel = () => {
    if (activeTab === 'all') return 'Toutes';
    return missionStatusLabels[activeTab as MissionStatus] || 'Toutes';
  };
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des missions</h2>
        <div className="flex gap-2">
          <Button onClick={handleCreateNewMission}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle mission
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input type="search" placeholder="Rechercher une mission..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <Button variant="outline" className="flex gap-2" onClick={() => setFilterDialogOpen(true)}>
          <Filter className="h-4 w-4" />
          Filtres
          {(selectedClientId || selectedDriverId) && <Badge variant="secondary" className="ml-1">
              {[selectedClientId, selectedDriverId].filter(Boolean).length}
            </Badge>}
        </Button>
      </div>

      {/* Desktop: Tabs layout */}
      {!isMobile && <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-1">
            <TabsTrigger value="all" className="flex gap-2">
              Toutes
              <Badge variant="secondary" className="ml-1">
                {missions.length}
              </Badge>
            </TabsTrigger>
            
            {/* Always display all statuses in the defined order, even if count is 0 */}
            {ORDERED_STATUSES.map(status => <TabsTrigger key={status} value={status} className="flex gap-2">
                {missionStatusLabels[status]}
                <Badge variant="secondary" className="ml-1">
                  {missionCountsByStatus[status] || 0}
                </Badge>
              </TabsTrigger>)}
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Liste des missions {activeTab !== 'all' ? `(${missionStatusLabels[activeTab as MissionStatus] || ''})` : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
                  </div> : error ? <div className="text-center py-10 text-red-500">
                    <p className="font-medium">Erreur lors du chargement des missions</p>
                    <p className="text-sm mt-1">{error.message}</p>
                    <Button variant="outline" className="mt-4" onClick={() => fetchMissions()}>
                      Réessayer
                    </Button>
                  </div> : filteredMissions.length === 0 ? <EmptyState /> : <div className="space-y-4">
                    {filteredMissions.map(mission => <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex flex-col gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium">Mission #{formatMissionNumber(mission)}</p>
                              <Badge className={missionStatusColors[mission.status]}>
                                {missionStatusLabels[mission.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatAddressDisplay(mission.pickup_address)} → {formatAddressDisplay(mission.delivery_address)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Client: {formatClientName(mission, clientsData)} · {mission.distance_km?.toFixed(2) || '0'} km · {mission.price_ttc?.toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'EUR'
                      }) || '0 €'}
                            </p>
                          </div>
                          <div className="mt-2 flex flex-col gap-2">
                            <Button variant="outline" size="sm" onClick={() => openStatusDialog(mission)} title="Modifier le statut" className="w-full text-sm py-1">
                              <Truck className="h-4 w-4 mr-2" />
                              Modifier le statut
                            </Button>
                            <Button variant="outline" size="sm" asChild className="w-full text-sm py-1">
                              <Link to={`/admin/missions/${mission.id}`}>
                                Détails
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>}

      {/* Mobile: Dropdown layout */}
      {isMobile && <div className="space-y-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  {getCurrentFilterLabel()}
                  <Badge variant="secondary">
                    {activeTab === 'all' ? missions.length : missionCountsByStatus[activeTab as MissionStatus] || 0}
                  </Badge>
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full bg-background border shadow-lg z-50">
              <DropdownMenuItem onSelect={() => setActiveTab('all')} className="flex justify-between">
                <span>Toutes</span>
                <Badge variant="secondary">
                  {missions.length}
                </Badge>
              </DropdownMenuItem>
              {ORDERED_STATUSES.map(status => <DropdownMenuItem key={status} onSelect={() => setActiveTab(status)} className="flex justify-between">
                  <span>{missionStatusLabels[status]}</span>
                  <Badge variant="secondary">
                    {missionCountsByStatus[status] || 0}
                  </Badge>
                </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Liste des missions {activeTab !== 'all' ? `(${missionStatusLabels[activeTab as MissionStatus] || ''})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
                </div> : error ? <div className="text-center py-10 text-red-500">
                  <p className="font-medium">Erreur lors du chargement des missions</p>
                  <p className="text-sm mt-1">{error.message}</p>
                  <Button variant="outline" className="mt-4" onClick={() => fetchMissions()}>
                    Réessayer
                  </Button>
                </div> : filteredMissions.length === 0 ? <EmptyState /> : <div className="space-y-4">
                  {filteredMissions.map(mission => <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex flex-col gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">Mission #{formatMissionNumber(mission)}</p>
                            <Badge className={missionStatusColors[mission.status]}>
                              {missionStatusLabels[mission.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatAddressDisplay(mission.pickup_address)} → {formatAddressDisplay(mission.delivery_address)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Client: {formatClientName(mission, clientsData)} · {mission.distance_km?.toFixed(2) || '0'} km · {mission.price_ttc?.toLocaleString('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }) || '0 €'}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-col gap-2">
                          <Button variant="outline" size="sm" onClick={() => openStatusDialog(mission)} title="Modifier le statut" className="w-full text-sm py-1">
                            <Truck className="h-4 w-4 mr-2" />
                            Modifier le statut
                          </Button>
                          <Button variant="outline" size="sm" asChild className="w-full text-sm py-1">
                            <Link to={`/admin/missions/${mission.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>)}
                </div>}
            </CardContent>
          </Card>
        </div>}
      
      {/* Boîte de dialogue pour modifier rapidement le statut */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le statut de la mission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <div className="font-medium">Mission:</div>
              <div>#{formatMissionNumber(selectedMission || {} as Mission)}</div>
            </div>
            <Select value={newStatus} onValueChange={value => setNewStatus(value as MissionStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map(status => <SelectItem key={status} value={status}>
                    {missionStatusLabels[status]}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={updatingStatus}>
              Annuler
            </Button>
            <Button onClick={updateMissionStatus} disabled={!newStatus || newStatus === selectedMission?.status || updatingStatus}>
              {updatingStatus ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boîte de dialogue pour les filtres */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrer les missions</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Filtre par client */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Client</h3>
              <div className="border rounded-md">
                <Command>
                  <CommandInput placeholder="Rechercher un client..." value={clientSearchTerm} onValueChange={setClientSearchTerm} />
                  <CommandList>
                    <CommandEmpty>Aucun client trouvé</CommandEmpty>
                    <CommandGroup>
                      {clientsLoading ? <div className="py-2 text-center text-sm">Chargement...</div> : filteredClients.length > 0 ? <>
                          <CommandItem className="cursor-pointer" onSelect={() => setSelectedClientId(null)}>
                            <span className={!selectedClientId ? 'font-medium text-primary' : ''}>
                              Tous les clients
                            </span>
                          </CommandItem>
                          {filteredClients.map(([id, client]) => <CommandItem key={id} className="cursor-pointer" onSelect={() => setSelectedClientId(id)}>
                              <span className={selectedClientId === id ? 'font-medium text-primary' : ''}>
                                {client.name}
                              </span>
                            </CommandItem>)}
                        </> : <div className="py-2 text-center text-sm">Aucun client disponible</div>}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
              {selectedClientId && <p className="text-xs text-muted-foreground">
                  Client sélectionné: {clientsList[selectedClientId]?.name}
                </p>}
            </div>

            {/* Filtre par chauffeur */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Chauffeur</h3>
              <div className="border rounded-md">
                <Command>
                  <CommandInput placeholder="Rechercher un chauffeur..." value={driverSearchTerm} onValueChange={setDriverSearchTerm} />
                  <CommandList>
                    <CommandEmpty>Aucun chauffeur trouvé</CommandEmpty>
                    <CommandGroup>
                      {driversLoading ? <div className="py-2 text-center text-sm">Chargement...</div> : filteredDrivers.length > 0 ? <>
                          <CommandItem className="cursor-pointer" onSelect={() => setSelectedDriverId(null)}>
                            <span className={!selectedDriverId ? 'font-medium text-primary' : ''}>
                              Tous les chauffeurs
                            </span>
                          </CommandItem>
                          {filteredDrivers.map(driver => <CommandItem key={driver.id} className="cursor-pointer" onSelect={() => setSelectedDriverId(driver.id)}>
                              <span className={selectedDriverId === driver.id ? 'font-medium text-primary' : ''}>
                                {driver.label}
                              </span>
                            </CommandItem>)}
                        </> : <div className="py-2 text-center text-sm">Aucun chauffeur disponible</div>}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
              {selectedDriverId && <p className="text-xs text-muted-foreground">
                  Chauffeur sélectionné: {driversList.find(d => d.id === selectedDriverId)?.label}
                </p>}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={resetFilters} className="w-full sm:w-auto">
              Réinitialiser
            </Button>
            <Button onClick={applyFilters} className="w-full sm:w-auto">
              Appliquer les filtres
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default MissionsPage;