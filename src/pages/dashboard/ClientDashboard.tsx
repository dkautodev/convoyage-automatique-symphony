
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, FileText, Clock, MapPin, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState({
    activeMissions: 0,
    completedMissions: 0,
    totalSpent: 0,
    pendingMissions: 0
  });

  useEffect(() => {
    const fetchClientData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Récupérer les missions du client
        const { data: missionsData, error: missionsError } = await typedSupabase
          .from('missions')
          .select('*')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (missionsError) {
          console.error('Erreur lors de la récupération des missions:', missionsError);
          throw missionsError;
        }
        
        // Convertir les données de la DB en missions UI
        const convertedMissions = (missionsData || []).map(mission => 
          convertMissionFromDB(mission as unknown as MissionFromDB)
        );
        setMissions(convertedMissions);
        
        // Récupérer les statistiques du client
        try {
          // 1. Nombre de missions actives
          const { count: activeMissions, error: activeMissionsError } = await typedSupabase
            .from('missions')
            .select('*', { count: 'exact' })
            .eq('client_id', user.id)
            .not('status', 'in', '(termine,annule)');
          
          if (activeMissionsError) throw activeMissionsError;
          
          // 2. Nombre de missions complétées
          const { count: completedMissions, error: completedMissionsError } = await typedSupabase
            .from('missions')
            .select('*', { count: 'exact' })
            .eq('client_id', user.id)
            .eq('status', 'termine');
          
          if (completedMissionsError) throw completedMissionsError;
          
          // 3. Total des dépenses
          const { data: allMissions, error: allMissionsError } = await typedSupabase
            .from('missions')
            .select('price_ttc')
            .eq('client_id', user.id)
            .eq('status', 'termine');
          
          if (allMissionsError) throw allMissionsError;
          
          const totalSpent = allMissions?.reduce((sum, mission) => sum + (mission.price_ttc || 0), 0) || 0;
          
          // 4. Nombre de missions en attente
          const { count: pendingMissions, error: pendingMissionsError } = await typedSupabase
            .from('missions')
            .select('*', { count: 'exact' })
            .eq('client_id', user.id)
            .eq('status', 'en_acceptation');
          
          if (pendingMissionsError) throw pendingMissionsError;
          
          setStats({
            activeMissions: activeMissions || 0,
            completedMissions: completedMissions || 0,
            totalSpent: totalSpent,
            pendingMissions: pendingMissions || 0
          });
        } catch (statsError) {
          console.error('Erreur lors de la récupération des statistiques:', statsError);
          // Continue execution even if stats fail
        }
        
      } catch (err) {
        console.error('Error fetching client dashboard data:', err);
        setError(err instanceof Error ? err : new Error('Une erreur est survenue'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchClientData();
  }, [user]);

  // Helper function to get a display friendly address string
  const getAddressString = (address: any) => {
    if (!address) return 'Adresse non spécifiée';
    return address.city || address.formatted_address || 'Adresse incomplète';
  };

  const handleCreateNewMission = () => {
    navigate('/mission/create');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-client"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Erreur de chargement</h2>
        <p className="text-gray-600 text-center mb-4">{error.message}</p>
        <Button onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-client">Tableau de bord client</h2>
        <Button onClick={handleCreateNewMission}>
          <Plus size={16} className="mr-2" />
          <span className="whitespace-nowrap">Nouvelle mission</span>
        </Button>
      </div>
      
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Missions Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-client/10 flex items-center justify-center">
                <Package size={20} className="text-client" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.pendingMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Missions Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.completedMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <MapPin size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Dépensé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalSpent.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missions récentes */}
      <Card className="bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Vos Missions</CardTitle>
            <CardDescription>Suivez l'état de vos missions récentes</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/client/missions">
              Voir toutes
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missions.length > 0 ? (
              missions.map((mission) => (
                <div key={mission.id} className="border-b pb-3 last:border-b-0 last:pb-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">Mission #{mission.mission_number || mission.id.slice(0, 8)}</p>
                      <Badge className={missionStatusColors[mission.status]}>
                        {missionStatusLabels[mission.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 break-words">
                      {getAddressString(mission.pickup_address)} → {getAddressString(mission.delivery_address)} · {mission.distance_km?.toFixed(2) || '0'} km
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(mission.created_at).toLocaleDateString('fr-FR')} · {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="self-start" asChild>
                    <Link to={`/client/missions/${mission.id}`}>
                      {isMobile ? "Détails" : "Voir la mission"}
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center">
                <Package size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-center">Vous n'avez pas encore de missions</p>
                <Button className="mt-4" onClick={handleCreateNewMission}>
                  <Plus size={16} className="mr-2" />
                  Créer une mission
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Activité récente */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Documents récents</CardTitle>
          <CardDescription>Vos derniers devis et factures</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Vos documents apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientDashboard;
