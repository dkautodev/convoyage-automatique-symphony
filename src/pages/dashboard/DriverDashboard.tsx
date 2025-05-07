import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CheckCircle, CreditCard, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedMissions: 0,
    completedMissions: 0,
    monthlyEarnings: 0,
    inProgressMissions: 0
  });

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Récupérer les missions du chauffeur
        const { data: missionsData, error: missionsError } = await typedSupabase
          .from('missions')
          .select('*')
          .eq('chauffeur_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (missionsError) throw missionsError;
        
        // Convertir les données de la DB en missions UI
        const convertedMissions = (missionsData || []).map(mission => 
          convertMissionFromDB(mission as unknown as MissionFromDB)
        );
        setMissions(convertedMissions);
        
        // Récupérer les statistiques du chauffeur
        // 1. Nombre de missions assignées
        const { count: assignedMissions, error: assignedMissionsError } = await typedSupabase
          .from('missions')
          .select('*', { count: 'exact' })
          .eq('chauffeur_id', user.id);
        
        if (assignedMissionsError) throw assignedMissionsError;
        
        // 2. Nombre de missions complétées
        const { count: completedMissions, error: completedMissionsError } = await typedSupabase
          .from('missions')
          .select('*', { count: 'exact' })
          .eq('chauffeur_id', user.id)
          .eq('status', 'termine');
        
        if (completedMissionsError) throw completedMissionsError;
        
        // 3. Gains du mois en cours
        // Calculer le premier et dernier jour du mois actuel
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        const { data: monthlyData, error: monthlyDataError } = await typedSupabase
          .from('missions')
          .select('price_ht')
          .eq('chauffeur_id', user.id)
          .eq('status', 'termine')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth);
        
        if (monthlyDataError) throw monthlyDataError;
        
        // Pour simplifier, on considère que le chauffeur gagne 70% du prix HT
        const driverCommission = 0.7;
        const monthlyEarnings = monthlyData?.reduce((sum, mission) => sum + ((mission.price_ht || 0) * driverCommission), 0) || 0;
        
        // 4. Nombre de missions en cours
        const { count: inProgressMissions, error: inProgressMissionsError } = await typedSupabase
          .from('missions')
          .select('*', { count: 'exact' })
          .eq('chauffeur_id', user.id)
          .in('status', ['prise_en_charge', 'livraison']);
        
        if (inProgressMissionsError) throw inProgressMissionsError;
        
        setStats({
          assignedMissions: assignedMissions || 0,
          completedMissions: completedMissions || 0,
          monthlyEarnings: monthlyEarnings,
          inProgressMissions: inProgressMissions || 0
        });
      } catch (error) {
        console.error('Error fetching driver dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-driver"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-driver">Tableau de bord chauffeur</h2>
        <Button variant="outline" asChild>
          <Link to="/driver/schedule">
            <CalendarDays size={16} className="mr-2" />
            Voir le planning
          </Link>
        </Button>
      </div>
      
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Missions Assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.assignedMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-driver/10 flex items-center justify-center">
                <Truck size={20} className="text-driver" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.inProgressMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin size={20} className="text-amber-600" />
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
                <CheckCircle size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gains du Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.monthlyEarnings.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missions assignées */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Vos Missions</CardTitle>
            <CardDescription>Les missions qui vous sont assignées</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/driver/missions">
              Voir toutes
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {missions.length > 0 ? (
              missions.map((mission) => (
                <div key={mission.id} className="border-b pb-3 last:border-b-0 last:pb-0 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Mission #{mission.id}</p>
                      <Badge className={missionStatusColors[mission.status]}>
                        {missionStatusLabels[mission.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {mission.pickup_address.city} → {mission.delivery_address.city} · {mission.distance_km.toFixed(2)} km
                    </p>
                    <p className="text-xs text-gray-500">
                      Prévue le {new Date(mission.scheduled_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(mission.status === 'prise_en_charge' || mission.status === 'livraison') && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/driver/missions/${mission.id}/update`}>
                          Mettre à jour
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/driver/missions/${mission.id}`}>
                        Détails
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center">
                <Truck size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-500 text-center">Aucune mission ne vous est assignée actuellement</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Planning du jour */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Planning du jour</CardTitle>
          <CardDescription>Vos missions prévues aujourd'hui</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <CalendarDays size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucune mission prévue aujourd'hui</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DriverDashboard;
