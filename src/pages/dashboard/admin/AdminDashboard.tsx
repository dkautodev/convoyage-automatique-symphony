
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, FileText, User, Users, Truck, Building, CreditCard, BarChart, Euro } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Link, useNavigate } from 'react-router-dom';
import { 
  missionStatusColors, 
  missionStatusLabels, 
  MissionFromDB, 
  convertMissionFromDB, 
  MissionStatus 
} from '@/types/supabase';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMissions: 0,
    activeMissions: 0,
    clients: 0,
    drivers: 0,
    revenue: 0,
    vatCollected: 0,
    driverPayments: 0
  });
  
  const [statusCounts, setStatusCounts] = useState<Record<MissionStatus, number>>({
    en_acceptation: 0,
    accepte: 0,
    prise_en_charge: 0,
    livraison: 0,
    livre: 0,
    termine: 0,
    annule: 0,
    incident: 0
  });
  
  const [recentMissions, setRecentMissions] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  
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

      // 5. Status counts
      const statuses: MissionStatus[] = [
        'en_acceptation', 'accepte', 'prise_en_charge',
        'livraison', 'livre', 'termine', 'annule', 'incident'
      ];
      
      const statusPromises = statuses.map(status => 
        typedSupabase
          .from('missions')
          .select('*', { count: 'exact' })
          .eq('status', status)
          .then(({ count }) => ({ status, count: count || 0 }))
      );
      
      const statusResults = await Promise.all(statusPromises);
      const newStatusCounts = { ...statusCounts };
      
      statusResults.forEach(({ status, count }) => {
        newStatusCounts[status] = count;
      });
      
      setStatusCounts(newStatusCounts);

      // 6. Financial metrics
      const currentYear = new Date().getFullYear();
      const { data: yearMissions } = await typedSupabase
        .from('missions')
        .select('price_ht, price_ttc, chauffeur_price_ht, created_at, status')
        .gte('created_at', `${currentYear}-01-01`)
        .lte('created_at', `${currentYear}-12-31`);

      let totalRevenue = 0;
      let totalVat = 0;
      let totalDriverPayments = 0;
      
      // Calculate monthly revenue data
      const monthlyData: Record<string, { revenue: number, vat: number, driverPayments: number }> = {};
      
      for (let i = 0; i < 12; i++) {
        const monthName = format(new Date(currentYear, i, 1), 'MMM');
        monthlyData[monthName] = { revenue: 0, vat: 0, driverPayments: 0 };
      }
      
      if (yearMissions) {
        yearMissions.forEach(mission => {
          const price_ht = mission.price_ht || 0;
          const price_ttc = mission.price_ttc || 0;
          const vat = price_ttc - price_ht;
          const driverPayment = mission.chauffeur_price_ht || 0;
          
          if (mission.status === 'termine') {
            totalRevenue += price_ht;
            totalVat += vat;
            totalDriverPayments += driverPayment;
          }
          
          // Add to monthly data
          const date = new Date(mission.created_at);
          const monthName = format(date, 'MMM');
          
          if (monthlyData[monthName]) {
            monthlyData[monthName].revenue += price_ht;
            monthlyData[monthName].vat += vat;
            monthlyData[monthName].driverPayments += driverPayment;
          }
        });
      }
      
      const monthlyRevenueData = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        revenue: Number(data.revenue.toFixed(2)),
        vat: Number(data.vat.toFixed(2)),
        driverPayments: Number(data.driverPayments.toFixed(2))
      }));
      
      setMonthlyRevenue(monthlyRevenueData);

      // 7. Recent missions with client info
      const { data: recentMissionsData } = await typedSupabase
        .from('missions')
        .select('*, profiles(full_name, company_name, email)')
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalMissions: totalMissions || 0,
        activeMissions: activeMissions || 0,
        clients: clients || 0,
        drivers: drivers || 0,
        revenue: totalRevenue,
        vatCollected: totalVat,
        driverPayments: totalDriverPayments
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

  // Format currency helper
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    });
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
      
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium text-gray-500">Revenus (HT)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.revenue)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Euro size={20} className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">TVA Collectée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.vatCollected)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <BarChart size={20} className="text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Paiements Chauffeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {loading ? "..." : formatCurrency(stats.driverPayments)}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <CreditCard size={20} className="text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Status des missions */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Status des Missions</CardTitle>
          <CardDescription>Répartition des missions par statut</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Statut</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(statusCounts).map(([status, count]) => (
                    <TableRow key={status}>
                      <TableCell>
                        <Badge className={missionStatusColors[status as MissionStatus]}>
                          {missionStatusLabels[status as MissionStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>{count}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/missions?status=${status}`}>
                            Voir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Graphique de revenus */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Revenus Mensuels</CardTitle>
          <CardDescription>Chiffre d'affaires, TVA et paiements chauffeurs de l'année {new Date().getFullYear()}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-admin"></div>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={monthlyRevenue}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${formatCurrency(Number(value))}`, '']}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Chiffre d'affaires HT" fill="#3b82f6" />
                  <Bar dataKey="vat" name="TVA" fill="#8b5cf6" />
                  <Bar dataKey="driverPayments" name="Paiements chauffeurs" fill="#f59e0b" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Missions récentes */}
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Missions Récentes</CardTitle>
            <CardDescription>Les 5 dernières missions créées</CardDescription>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Référence</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix HT</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentMissions.map((mission) => {
                    const clientProfile = mission.profiles || {};
                    const clientName = clientProfile.company_name || clientProfile.full_name || clientProfile.email || 'Client inconnu';
                    
                    return (
                      <TableRow key={mission.id}>
                        <TableCell>{mission.mission_number || '-'}</TableCell>
                        <TableCell>{clientName}</TableCell>
                        <TableCell>
                          <Badge className={missionStatusColors[mission.status as MissionStatus]}>
                            {missionStatusLabels[mission.status as MissionStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(mission.price_ht || 0)}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/missions/${mission.id}`}>
                              <FileText className="h-4 w-4 mr-1" />
                              Détails
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
