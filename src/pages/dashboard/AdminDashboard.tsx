
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, CreditCard, Package, User, Users, Truck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    activeMissions: 0,
    totalClients: 0,
    totalDrivers: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les missions récentes
        const { data: missionsData, error: missionsError } = await supabase
          .from('missions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (missionsError) throw missionsError;
        
        setMissions(missionsData || []);
        
        // Récupérer les statistiques
        // 1. Nombre total de missions
        const { count: totalMissions, error: totalMissionsError } = await supabase
          .from('missions')
          .select('*', { count: 'exact' });
        
        if (totalMissionsError) throw totalMissionsError;
        
        // 2. Nombre de missions actives
        const { count: activeMissions, error: activeMissionsError } = await supabase
          .from('missions')
          .select('*', { count: 'exact' })
          .not('status', 'in', '(termine,annule)');
        
        if (activeMissionsError) throw activeMissionsError;
        
        // 3. Nombre total de clients
        const { count: totalClients, error: totalClientsError } = await supabase
          .from('clients')
          .select('*', { count: 'exact' });
        
        if (totalClientsError) throw totalClientsError;
        
        // 4. Nombre total de chauffeurs
        const { count: totalDrivers, error: totalDriversError } = await supabase
          .from('drivers')
          .select('*', { count: 'exact' });
        
        if (totalDriversError) throw totalDriversError;
        
        // 5. Chiffre d'affaires du mois en cours
        // Calculer le premier et dernier jour du mois actuel
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
        
        const { data: monthlyData, error: monthlyDataError } = await supabase
          .from('missions')
          .select('price_ttc')
          .gte('created_at', firstDayOfMonth)
          .lte('created_at', lastDayOfMonth)
          .eq('status', 'termine');
        
        if (monthlyDataError) throw monthlyDataError;
        
        const monthlyRevenue = monthlyData?.reduce((sum, mission) => sum + (mission.price_ttc || 0), 0) || 0;
        
        setStats({
          totalMissions: totalMissions || 0,
          activeMissions: activeMissions || 0,
          totalClients: totalClients || 0,
          totalDrivers: totalDrivers || 0,
          monthlyRevenue
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-admin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-admin">Tableau de bord administrateur</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Missions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-admin/10 flex items-center justify-center">
                <Package size={20} className="text-admin" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Missions Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.activeMissions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Truck size={20} className="text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Chauffeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Users size={20} className="text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">CA Mensuel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missions récentes */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Missions Récentes</CardTitle>
          <CardDescription>Les 5 dernières missions créées</CardDescription>
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
                      {mission.distance_km.toFixed(2)} km · {mission.price_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créée le {new Date(mission.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Voir</Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Aucune mission récente</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Graphiques et statistiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Répartition des Missions</CardTitle>
            <CardDescription>Par statut</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="text-gray-400 flex flex-col items-center">
              <BarChart size={48} />
              <p className="mt-2">Graphique à venir</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Chiffre d'Affaires</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </CardHeader>
          <CardContent className="h-80 flex items-center justify-center">
            <div className="text-gray-400 flex flex-col items-center">
              <BarChart size={48} />
              <p className="mt-2">Graphique à venir</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
