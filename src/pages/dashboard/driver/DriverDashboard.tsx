
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Package, Clock, CreditCard, Calendar, Phone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { formatAddressDisplay, formatMissionNumber } from '@/utils/missionUtils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DriverDashboard = () => {
  const { profile, user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [upcomingMissions, setUpcomingMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayMissions: 0,
    upcomingMissions: 0, 
    completedMissions: 0,
    earnings: 0
  });

  useEffect(() => {
    if (user?.id) {
      fetchDriverMissions();
      fetchDriverStats();
    }
  }, [user?.id]);

  const fetchDriverMissions = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les missions du chauffeur
      const { data: missionsData, error } = await supabase
        .from('missions')
        .select('*')
        .eq('chauffeur_id', user?.id)
        .order('scheduled_date', { ascending: true });
      
      if (error) throw error;
      
      if (missionsData && missionsData.length > 0) {
        // Trouver la mission en cours (en prise en charge ou en livraison)
        const inProgressMission = missionsData.find(m => 
          m.status === 'prise_en_charge' || m.status === 'livraison'
        );
        
        // Trouver les missions à venir (acceptées mais pas encore en cours)
        const upcoming = missionsData
          .filter(m => m.status === 'accepte')
          .slice(0, 3); // Limiter à 3 missions à venir
        
        setCurrentMission(inProgressMission || null);
        setUpcomingMissions(upcoming);
        setMissions(missionsData);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des missions:', error);
      toast.error("Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverStats = async () => {
    if (!user?.id) return;
    
    try {
      // Date du jour à minuit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Missions du jour
      const { count: todayCount } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('chauffeur_id', user.id)
        .gte('scheduled_date', today.toISOString())
        .lt('scheduled_date', new Date(today.getTime() + 86400000).toISOString()); // +24h
      
      // Missions à venir
      const { count: upcomingCount } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('chauffeur_id', user.id)
        .eq('status', 'accepte');
      
      // Missions terminées ce mois-ci
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const { count: completedCount } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('chauffeur_id', user.id)
        .eq('status', 'termine')
        .gte('completion_date', firstDayOfMonth.toISOString());
      
      // Revenus du mois (basés sur chauffeur_price_ht)
      const { data: completedMissions } = await supabase
        .from('missions')
        .select('chauffeur_price_ht')
        .eq('chauffeur_id', user.id)
        .eq('status', 'termine')
        .gte('completion_date', firstDayOfMonth.toISOString());
      
      const monthEarnings = completedMissions?.reduce((sum, mission) => 
        sum + (mission.chauffeur_price_ht || 0), 0) || 0;
      
      setStats({
        todayMissions: todayCount || 0,
        upcomingMissions: upcomingCount || 0,
        completedMissions: completedCount || 0,
        earnings: monthEarnings
      });
      
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const handleCompleteMission = async () => {
    if (!currentMission) return;
    
    try {
      const { error } = await supabase
        .from('missions')
        .update({ 
          status: 'termine',
          completion_date: new Date().toISOString()
        })
        .eq('id', currentMission.id);
      
      if (error) throw error;
      
      toast.success('Mission marquée comme terminée');
      fetchDriverMissions();
      fetchDriverStats();
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord chauffeur</h1>
        <Button asChild>
          <Link to="/driver/missions">
            <MapPin className="mr-2 h-4 w-4" />
            Voir mes missions
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mission du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-7 w-7 text-blue-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">{stats.todayMissions}</div>
                <p className="text-xs text-muted-foreground">Aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-7 w-7 text-green-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">{stats.upcomingMissions}</div>
                <p className="text-xs text-muted-foreground">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missions terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-7 w-7 text-purple-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">{stats.completedMissions}</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-7 w-7 text-amber-500 mr-4" />
              <div>
                <div className="text-2xl font-bold">{stats.earnings.toLocaleString('fr-FR', {style: 'currency', currency: 'EUR'})}</div>
                <p className="text-xs text-muted-foreground">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentMission ? (
        <Card>
          <CardHeader>
            <CardTitle>Ma mission en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-muted/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Mission</h3>
                  <p className="font-semibold text-lg">#{formatMissionNumber(currentMission)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Statut</h3>
                  <Badge className={missionStatusColors[currentMission.status as MissionStatus]}>
                    {missionStatusLabels[currentMission.status as MissionStatus]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Départ</h3>
                  <p>{formatAddressDisplay(currentMission.pickup_address)}</p>
                  <p className="text-sm text-muted-foreground">
                    Départ : {currentMission.D1_PEC ? `${currentMission.D1_PEC} ` : ''}
                    {currentMission.H1_PEC ? `à ${currentMission.H1_PEC}` : ''}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Destination</h3>
                  <p>{formatAddressDisplay(currentMission.delivery_address)}</p>
                  <p className="text-sm text-muted-foreground">
                    Arrivée : {currentMission.D2_LIV ? `${currentMission.D2_LIV} ` : ''}
                    {currentMission.H1_LIV ? `à ${currentMission.H1_LIV}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Véhicule</h3>
                  <p>{currentMission.vehicle_make} {currentMission.vehicle_model} - {currentMission.vehicle_registration || 'Non spécifié'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Distance</h3>
                  <p>{currentMission.distance_km?.toFixed(0) || '0'} km</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" asChild>
                <Link to={`/driver/missions/${currentMission.id}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  Détails de la mission
                </Link>
              </Button>

              <Button onClick={handleCompleteMission}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Marquer comme terminé
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Aucune mission en cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10 text-neutral-500">
              <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
              <p>Vous n'avez pas de mission en cours actuellement.</p>
              <Button asChild className="mt-4">
                <Link to="/driver/missions">
                  Voir toutes mes missions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prochaines missions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMissions.length > 0 ? (
            <div className="space-y-4">
              {upcomingMissions.map((mission) => (
                <div key={mission.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between mb-1">
                    <div className="font-medium">Mission #{formatMissionNumber(mission)}</div>
                    <div className="text-sm text-amber-500 font-medium">
                      {mission.D1_PEC || new Date(mission.scheduled_date || '').toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatAddressDisplay(mission.pickup_address)} → {formatAddressDisplay(mission.delivery_address)} • {mission.distance_km?.toFixed(0) || '0'} km
                  </div>
                </div>
              ))}
              <div className="flex justify-center mt-4">
                <Button variant="outline" asChild>
                  <Link to="/driver/missions">
                    Voir toutes mes missions
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-neutral-500">
              <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
              <p>Vous n'avez pas de missions à venir.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
