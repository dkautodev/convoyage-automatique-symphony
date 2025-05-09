
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Filter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, Link } from 'react-router-dom';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, missionStatusLabels, missionStatusColors, MissionStatus } from '@/types/supabase';
import { toast } from 'sonner';

const MissionsPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMissions();
  }, [activeTab]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = typedSupabase
        .from('missions')
        .select('*, profiles(full_name, company_name)')
        .order('created_at', { ascending: false });
      
      // Filtrer par statut si un tab spécifique est sélectionné
      if (activeTab !== 'all') {
        // Convertir le tab actif en statut de mission valide
        const tabAsStatus = activeTab as MissionStatus;
        query = query.eq('status', tabAsStatus);
      }
      
      const { data: missionsData, error: missionsError } = await query;
      
      if (missionsError) {
        console.error('Erreur lors de la récupération des missions:', missionsError);
        throw missionsError;
      }
      
      const convertedMissions = (missionsData || []).map(mission => {
        const basicMission = convertMissionFromDB(mission as unknown as MissionFromDB);
        // Sécuriser l'accès aux propriétés du profil client
        const profileData = mission.profiles as any;
        return {
          ...basicMission,
          client_name: profileData?.company_name || profileData?.full_name || 'Client inconnu'
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

  // Filtered missions based on search query
  const filteredMissions = missions.filter(mission => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      mission.id.toLowerCase().includes(searchLower) ||
      mission.pickup_address?.city?.toLowerCase().includes(searchLower) ||
      mission.delivery_address?.city?.toLowerCase().includes(searchLower) ||
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="en_acceptation">En attente</TabsTrigger>
          <TabsTrigger value="accepte">Accepté</TabsTrigger>
          <TabsTrigger value="prise_en_charge">En cours</TabsTrigger>
          <TabsTrigger value="livre">Livrées</TabsTrigger>
          <TabsTrigger value="termine">Terminées</TabsTrigger>
          <TabsTrigger value="annule">Annulées</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Liste des missions {activeTab !== 'all' ? `(${missionStatusLabels[activeTab as any] || ''})` : ''}
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
                            <p className="font-medium">Mission #{mission.id}</p>
                            <Badge className={missionStatusColors[mission.status]}>
                              {missionStatusLabels[mission.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {mission.pickup_address?.city || 'N/A'} → {mission.delivery_address?.city || 'N/A'} · {mission.distance_km?.toFixed(2) || '0'} km
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Client: {(mission as any).client_name || 'N/A'} · {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/missions/${mission.id}`}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionsPage;
