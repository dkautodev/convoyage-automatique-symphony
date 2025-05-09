
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, CreditCard, Package, User, Users, Truck, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { formatAddressDisplay, formatMissionNumber, formatClientName } from '@/utils/missionUtils';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalMissions: 0,
    activeMissions: 0,
    clients: 0
  });
  const [recentMissions, setRecentMissions] = useState<Mission[]>([]);
  const [clientsData, setClientsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total missions count
      const { count: totalMissions, error: totalError } = await typedSupabase
        .from('missions')
        .select('*', { count: 'exact', head: true });
        
      // Fetch active missions count (not terminated or cancelled)
      const { count: activeMissions, error: activeError } = await typedSupabase
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("termine","annule")');
        
      // Fetch clients count
      const { count: clientsCount, error: clientsError } = await typedSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'client');
        
      // Fetch recent missions
      const { data: recentData, error: recentError } = await typedSupabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!totalError && !activeError && !clientsError) {
        setStats({
          totalMissions: totalMissions || 0,
          activeMissions: activeMissions || 0,
          clients: clientsCount || 0
        });
      }
      
      if (!recentError && recentData) {
        const convertedMissions = recentData.map(mission => 
          convertMissionFromDB(mission as unknown as MissionFromDB)
        );
        setRecentMissions(convertedMissions);
      }
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-admin">Tableau de bord administrateur</h2>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-2xl font-bold">{stats.clients}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Building size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tableau de missions simplifié */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missions Récentes</CardTitle>
            <CardDescription>Les dernières missions créées</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/missions">Voir toutes</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
            </div>
          ) : recentMissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune mission récente
            </div>
          ) : (
            <div className="space-y-4">
              {recentMissions.map((mission) => (
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
                        {formatAddressDisplay(mission.pickup_address)} → {formatAddressDisplay(mission.delivery_address)} · {mission.distance_km?.toFixed(2) || '0'} km
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Client: {formatClientName(mission, clientsData)} · {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
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
    </div>
  );
};

export default AdminDashboard;
