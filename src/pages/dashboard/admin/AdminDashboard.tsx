
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Plus, FileText, User, Users, Truck, Building, CreditCard, BarChart } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Link, useNavigate } from 'react-router-dom';
import { missionStatusColors, missionStatusLabels, MissionFromDB, convertMissionFromDB } from '@/types/supabase';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    activeMissions: 0,
    clients: 0,
    drivers: 0,
    revenue: 0
  });
  const [recentMissions, setRecentMissions] = useState<any[]>([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Total missions
      const { count: totalMissions } = await typedSupabase
        .from('missions')
        .select('*', { count: 'exact' });
      
      // 2. Active missions
      const { count: activeMissions } = await typedSupabase
        .from('missions')
        .select('*', { count: 'exact' })
        .not('status', 'in', '(termine,annule)');
      
      // 3. Total clients
      const { count: clients } = await typedSupabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'client');
      
      // 4. Total drivers
      const { count: drivers } = await typedSupabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('role', 'chauffeur');
      
      // 5. Total revenue
      const { data: completedMissions } = await typedSupabase
        .from('missions')
        .select('price_ttc')
        .eq('status', 'termine');
      
      const revenue = completedMissions?.reduce((sum, mission) => sum + (mission.price_ttc || 0), 0) || 0;
      
      // 6. Recent missions
      const { data: recentMissionsData } = await typedSupabase
        .from('missions')
        .select('*, profiles(full_name, company_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setStats({
        totalMissions: totalMissions || 0,
        activeMissions: activeMissions || 0,
        clients: clients || 0,
        drivers: drivers || 0,
        revenue: revenue
      });
      
      setRecentMissions(recentMissionsData || []);
      
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateNewMission = () => {
    navigate('/mission/create');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-admin">Tableau de bord administrateur</h2>
        <div className="flex space-x-2">
          <Button onClick={handleCreateNewMission}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle mission
          </Button>
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
                <p className="text-2xl font-bold">{loading ? "..." : stats.totalMissions}</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : stats.activeMissions}</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : stats.clients}</p>
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
                <p className="text-2xl font-bold">{loading ? "..." : stats.drivers}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Users size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenus Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {loading 
                    ? "..." 
                    : stats.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missions Récentes</CardTitle>
            <CardDescription>Les dernières missions enregistrées</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/missions">
              Voir toutes
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
            </div>
          ) : recentMissions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <Package size={40} className="text-gray-300 mb-3" />
              <p className="text-gray-500 text-center">Aucune mission enregistrée</p>
              <Button className="mt-4" onClick={handleCreateNewMission}>
                <Plus size={16} className="mr-2" />
                Créer une mission
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMissions.map((mission) => {
                const missionData = convertMissionFromDB(mission as unknown as MissionFromDB);
                return (
                  <div key={mission.id} className="border-b pb-3 last:border-b-0 last:pb-0 flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">Mission #{mission.id}</p>
                        <Badge className={missionStatusColors[mission.status]}>
                          {missionStatusLabels[mission.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {mission.pickup_address?.city || 'N/A'} → {mission.delivery_address?.city || 'N/A'} · {mission.distance_km?.toFixed(2) || '0'} km
                      </p>
                      <p className="text-xs text-gray-500">
                        Client: {mission.profiles?.company_name || mission.profiles?.full_name || 'Client inconnu'} · 
                        {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/admin/missions/${mission.id}`}>
                        Détails
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
