import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/auth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, missionStatusLabels, missionStatusColors, MissionStatus } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Search, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatAddressDisplay } from '@/utils/missionUtils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const ALL_TABS_VALUE = 'all';

// Define the order of statuses as shown in the attached image
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

const ClientMissionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>(ALL_TABS_VALUE);

  useEffect(() => {
    const fetchMissions = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        console.log("Fetching missions for client ID:", user.id);
        const {
          data: missionsData,
          error: missionsError
        } = await typedSupabase.from('missions').select('*').eq('client_id', user.id).order('created_at', {
          ascending: false
        });
        if (missionsError) {
          console.error('Erreur lors de la récupération des missions:', missionsError);
          throw missionsError;
        }
        console.log("Missions récupérées:", missionsData);
        const convertedMissions = (missionsData || []).map(mission => convertMissionFromDB(mission as unknown as MissionFromDB));
        setMissions(convertedMissions);
      } catch (err) {
        console.error('Error fetching missions:', err);
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    };
    fetchMissions();
  }, [user]);

  // Prepare mission counts by status for tabs
  const missionCountsByStatus = missions.reduce((acc, mission) => {
    acc[mission.status] = (acc[mission.status] || 0) + 1;
    return acc;
  }, {} as Record<MissionStatus, number>);

  // Filter missions based on active tab and search query
  const filteredMissions = missions.filter(mission => {
    // Filter by tab (status)
    if (activeTab !== ALL_TABS_VALUE && mission.status !== activeTab) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const missionNumberFormatted = mission.mission_number ? 
      mission.mission_number.replace('#', '') : 
      mission.id.slice(0, 8);
    const searchNumberClean = searchLower.replace('#', '');
    
    return (
      missionNumberFormatted.toLowerCase().includes(searchNumberClean) || 
      (mission.pickup_address?.city || '').toLowerCase().includes(searchLower) || 
      (mission.delivery_address?.city || '').toLowerCase().includes(searchLower) || 
      missionStatusLabels[mission.status].toLowerCase().includes(searchLower)
    );
  });

  // Format the mission number for display
  const formatMissionNumber = (mission: Mission) => {
    return mission.mission_number || mission.id.slice(0, 8);
  };

  // Format the dates for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Non spécifié";
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Modified Empty state component - removed the "Demandez votre première mission" text and button
  const EmptyState = () => (
    <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
    </div>
  );

  const handleCreateNewMission = () => {
    navigate('/mission/create');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mes missions</h2>
        <Button onClick={handleCreateNewMission}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle mission
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            type="search" 
            placeholder="Rechercher une mission..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 flex flex-wrap">
          <TabsTrigger value={ALL_TABS_VALUE} className="flex gap-2">
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
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {loading ? "Chargement des missions..." : `${filteredMissions.length} mission(s)`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-client"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10 text-red-500">
                <p className="font-medium">Erreur lors du chargement des missions</p>
                <p className="text-sm mt-1">{error.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Réessayer
                </Button>
              </div>
            ) : filteredMissions.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {filteredMissions.map(mission => (
                  <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">Mission #{formatMissionNumber(mission)}</p>
                          <Badge className={missionStatusColors[mission.status]}>
                            {missionStatusLabels[mission.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {mission.pickup_address?.formatted_address || formatAddressDisplay(mission.pickup_address)} → {mission.delivery_address?.formatted_address || formatAddressDisplay(mission.delivery_address)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Départ: {formatDate(mission.D1_PEC)} · Livraison: {formatDate(mission.D2_LIV)}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="md:self-center mt-2 md:mt-0">
                        <Link to={`/client/missions/${mission.id}`}>
                          Détails
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default ClientMissionsPage;
