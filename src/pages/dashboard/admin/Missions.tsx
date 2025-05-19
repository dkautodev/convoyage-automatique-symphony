
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Filter, FileText, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, MissionStatus } from '@/types/supabase';
import { toast } from 'sonner';
import { formatAddressDisplay, formatMissionNumber, formatClientName, missionStatusLabels, missionStatusColors } from '@/utils/missionUtils';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Define valid tab values type that includes 'all' and all mission statuses
type MissionTab = 'all' | MissionStatus;

// Define the order of statuses like in client missions page
const ORDERED_STATUSES: MissionStatus[] = [
  'en_acceptation',
  'accepte',
  'prise_en_charge',
  'livraison',
  'livre',
  'termine',
  'annule',
  'incident'
];

const MissionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<MissionTab>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientsData, setClientsData] = useState<Record<string, any>>({});
  
  // État pour la boîte de dialogue de changement de statut
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [newStatus, setNewStatus] = useState<MissionStatus | ''>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);
  
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await typedSupabase
        .from('profiles')
        .select('id, company_name, full_name')
        .eq('role', 'client');
        
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

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = typedSupabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data: missionsData, error: missionsError } = await query;
      
      if (missionsError) {
        console.error('Erreur lors de la récupération des missions:', missionsError);
        throw missionsError;
      }
      
      console.log('Missions récupérées:', missionsData);
      
      const convertedMissions = (missionsData || []).map(mission => {
        const basicMission = convertMissionFromDB(mission as unknown as MissionFromDB);
        return {
          ...basicMission,
          client_name: clientsData[mission.client_id]?.name || 'Client inconnu'
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
      const { error } = await typedSupabase
        .from('missions')
        .update({ status: newStatus })
        .eq('id', selectedMission.id);
      
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
    return (
      (mission.mission_number || mission.id).toLowerCase().includes(searchLower) ||
      (mission.pickup_address?.city || '').toLowerCase().includes(searchLower) ||
      (mission.delivery_address?.city || '').toLowerCase().includes(searchLower) ||
      missionStatusLabels[mission.status].toLowerCase().includes(searchLower) ||
      (mission as any).client_name?.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateNewMission = () => {
    navigate('/mission/create');
  };

  const navigateToPricingGrid = () => {
    navigate('/admin/pricing-grid');
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
      <p className="text-sm mt-1">Créez votre première mission en cliquant sur "Nouvelle mission"</p>
      <Button className="mt-4" onClick={handleCreateNewMission}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle mission
      </Button>
    </div>
  );

  // Tous les statuts disponibles pour la boîte de dialogue de changement de statut
  const allStatuses: MissionStatus[] = ['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident'];

  // Function to handle tab change with proper typing
  const handleTabChange = (value: string) => {
    setActiveTab(value as MissionTab);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des missions</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={navigateToPricingGrid} className="gap-2">
            <FileText className="h-4 w-4" />
            Grille tarifaire
          </Button>
          <Button onClick={handleCreateNewMission}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle mission
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Rechercher une mission..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full mb-4 flex flex-wrap">
          <TabsTrigger value="all" className="flex gap-2">
            Toutes
            <Badge variant="secondary" className="ml-1">
              {missions.length}
            </Badge>
          </TabsTrigger>
          
          {/* Always display all statuses in the defined order, even if count is 0 */}
          {ORDERED_STATUSES.map(status => (
            <TabsTrigger key={status} value={status} className="flex gap-2">
              {missionStatusLabels[status]}
              <Badge variant="secondary" className="ml-1">
                {missionCountsByStatus[status] || 0}
              </Badge>
            </TabsTrigger>
          ))}
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
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-red-500">
                  <p className="font-medium">Erreur lors du chargement des missions</p>
                  <p className="text-sm mt-1">{error.message}</p>
                  <Button variant="outline" className="mt-4" onClick={() => fetchMissions()}>
                    Réessayer
                  </Button>
                </div>
              ) : filteredMissions.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredMissions.map((mission) => (
                    <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
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
                            Client: {formatClientName(mission, clientsData)} · {mission.distance_km?.toFixed(2) || '0'} km · {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openStatusDialog(mission)}
                            title="Modifier le statut"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/missions/${mission.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
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
            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as MissionStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {missionStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setStatusDialogOpen(false)}
              disabled={updatingStatus}
            >
              Annuler
            </Button>
            <Button 
              onClick={updateMissionStatus}
              disabled={!newStatus || newStatus === selectedMission?.status || updatingStatus}
            >
              {updatingStatus ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MissionsPage;
