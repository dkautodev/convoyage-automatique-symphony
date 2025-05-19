
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfYear, endOfYear, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Calendar, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MonthlyStats {
  year: number;
  month: number;
  monthName: string;
  completedMissions: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  noInvoiceAmount: number;
  paidCount: number;
  unpaidCount: number;
  noInvoiceCount: number;
}

const RevenueManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [yearlyStats, setYearlyStats] = useState<MonthlyStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearlyTotal, setYearlyTotal] = useState({
    missions: 0,
    revenue: 0,
    paid: 0,
    unpaid: 0,
    noInvoice: 0,
    paidCount: 0,
    unpaidCount: 0,
    noInvoiceCount: 0
  });

  useEffect(() => {
    if (user) {
      fetchAvailableYears();
      fetchYearlyData(selectedYear);
      fetchCurrentMonthStats();
    }
  }, [user, selectedYear]);

  const fetchAvailableYears = async () => {
    try {
      const { data, error } = await typedSupabase
        .from('missions')
        .select('created_at')
        .eq('chauffeur_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const years = [...new Set(data.map(item => new Date(item.created_at).getFullYear()))];
        setAvailableYears(years);
      } else {
        setAvailableYears([new Date().getFullYear()]);
      }
    } catch (error) {
      console.error('Error fetching available years:', error);
    }
  };

  const fetchYearlyData = async (year: number) => {
    try {
      setLoading(true);
      
      const startDate = startOfYear(new Date(year, 0, 1));
      const endDate = endOfYear(new Date(year, 0, 1));
      
      const { data, error } = await typedSupabase
        .from('missions')
        .select('*')
        .eq('chauffeur_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;
      
      const monthlyData: MonthlyStats[] = Array.from({ length: 12 }, (_, i) => {
        return {
          year: year,
          month: i + 1,
          monthName: format(new Date(year, i, 1), 'MMMM', { locale: fr }),
          completedMissions: 0,
          totalAmount: 0,
          paidAmount: 0,
          unpaidAmount: 0,
          noInvoiceAmount: 0,
          paidCount: 0,
          unpaidCount: 0,
          noInvoiceCount: 0
        };
      });
      
      let yearlyTotalMissions = 0;
      let yearlyTotalRevenue = 0;
      let yearlyPaidAmount = 0;
      let yearlyUnpaidAmount = 0;
      let yearlyNoInvoiceAmount = 0;
      let yearlyPaidCount = 0;
      let yearlyUnpaidCount = 0;
      let yearlyNoInvoiceCount = 0;
      
      data?.forEach(mission => {
        const missionDate = new Date(mission.created_at);
        const month = missionDate.getMonth();
        const price = mission.chauffeur_price_ht || 0;
        
        // Count completed missions with status 'livre' or 'termine'
        if (mission.status === 'livre' || mission.status === 'termine') {
          monthlyData[month].completedMissions += 1;
          monthlyData[month].totalAmount += price;
          yearlyTotalMissions += 1;
          yearlyTotalRevenue += price;
          
          // Check invoice and payment status
          if (mission.chauffeur_invoice) {
            if (mission.chauffeur_paid) {
              monthlyData[month].paidAmount += price;
              monthlyData[month].paidCount += 1;
              yearlyPaidAmount += price;
              yearlyPaidCount += 1;
            } else {
              monthlyData[month].unpaidAmount += price;
              monthlyData[month].unpaidCount += 1;
              yearlyUnpaidAmount += price;
              yearlyUnpaidCount += 1;
            }
          } else {
            monthlyData[month].noInvoiceAmount += price;
            monthlyData[month].noInvoiceCount += 1;
            yearlyNoInvoiceAmount += price;
            yearlyNoInvoiceCount += 1;
          }
        }
      });
      
      setYearlyStats(monthlyData);
      setYearlyTotal({
        missions: yearlyTotalMissions,
        revenue: yearlyTotalRevenue,
        paid: yearlyPaidAmount,
        unpaid: yearlyUnpaidAmount,
        noInvoice: yearlyNoInvoiceAmount,
        paidCount: yearlyPaidCount,
        unpaidCount: yearlyUnpaidCount,
        noInvoiceCount: yearlyNoInvoiceCount
      });
      
    } catch (error) {
      console.error('Error fetching yearly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentMonthStats = async () => {
    try {
      const now = new Date();
      const startDate = startOfMonth(now);
      const endDate = endOfMonth(now);
      
      const { data, error } = await typedSupabase
        .from('missions')
        .select('*')
        .eq('chauffeur_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      if (error) throw error;
      
      const stats: MonthlyStats = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        monthName: format(now, 'MMMM yyyy', { locale: fr }),
        completedMissions: 0,
        totalAmount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        noInvoiceAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
        noInvoiceCount: 0
      };
      
      data?.forEach(mission => {
        const price = mission.chauffeur_price_ht || 0;
        
        // Count completed missions with status 'livre' or 'termine'
        if (mission.status === 'livre' || mission.status === 'termine') {
          stats.completedMissions += 1;
          stats.totalAmount += price;
          
          // Check invoice and payment status
          if (mission.chauffeur_invoice) {
            if (mission.chauffeur_paid) {
              stats.paidAmount += price;
              stats.paidCount += 1;
            } else {
              stats.unpaidAmount += price;
              stats.unpaidCount += 1;
            }
          } else {
            stats.noInvoiceAmount += price;
            stats.noInvoiceCount += 1;
          }
        }
      });
      
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error fetching current month stats:', error);
    }
  };

  // Préparation des données pour le graphique en barres horizontales
  const prepareHorizontalBarData = (stats: MonthlyStats) => {
    const total = stats.totalAmount;
    return [
      {
        name: 'Payé',
        value: stats.paidAmount,
        percentage: total > 0 ? Math.round((stats.paidAmount / total) * 100) : 0,
        color: '#4ade80',
        count: stats.paidCount
      },
      {
        name: 'En attente',
        value: stats.unpaidAmount,
        percentage: total > 0 ? Math.round((stats.unpaidAmount / total) * 100) : 0,
        color: '#f97316',
        count: stats.unpaidCount
      },
      {
        name: 'Sans facture',
        value: stats.noInvoiceAmount,
        percentage: total > 0 ? Math.round((stats.noInvoiceAmount / total) * 100) : 0,
        color: '#a1a1aa',
        count: stats.noInvoiceCount
      }
    ];
  };

  // Colors for charts
  const COLORS = ['#4ade80', '#f97316', '#a1a1aa'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild className="h-8 w-8">
            <Link to="/driver/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Pilotage Chiffre d'Affaires</h1>
        </div>
      </div>

      <Tabs defaultValue="month" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
          <TabsTrigger value="month">Mois en cours</TabsTrigger>
          <TabsTrigger value="year">Année {selectedYear}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="month" className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : monthlyStats ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Missions terminées</CardTitle>
                    <CardDescription>{monthlyStats.monthName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{monthlyStats.completedMissions}</div>
                    <p className="text-sm text-muted-foreground">Missions ce mois-ci</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA Total</CardTitle>
                    <CardDescription>{monthlyStats.monthName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {monthlyStats.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <p className="text-sm text-muted-foreground">Total des missions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA Payé</CardTitle>
                    <CardDescription>{monthlyStats.monthName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {monthlyStats.paidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <p className="text-sm text-muted-foreground">{monthlyStats.paidCount} facture(s) payée(s)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA En attente</CardTitle>
                    <CardDescription>{monthlyStats.monthName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xl font-bold text-orange-500">
                          {monthlyStats.unpaidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground">{monthlyStats.unpaidCount} en attente</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-500">
                          {monthlyStats.noInvoiceAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground">{monthlyStats.noInvoiceCount} sans facture</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Horizontal Bar Chart for Monthly Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des revenus - {monthlyStats.monthName}</CardTitle>
                  <CardDescription>État des factures pour le mois en cours</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row items-center justify-center gap-6">
                  {/* Horizontal Bar Chart */}
                  <div className="w-full h-64">
                    {prepareHorizontalBarData(monthlyStats).map((item, index) => (
                      <div key={`bar-${index}`} className="flex items-center mb-4">
                        <div className="flex-1">
                          <p className="font-medium mb-1 flex items-center">
                            <span className="w-4 h-4 mr-2 inline-block" style={{ backgroundColor: item.color }}></span>
                            {item.name}
                          </p>
                          <div className="relative h-8">
                            <div 
                              className="absolute left-0 top-0 h-full" 
                              style={{ 
                                width: `${item.percentage}%`, 
                                backgroundColor: item.color,
                                minWidth: item.value > 0 ? '2%' : '0%'
                              }}
                            ></div>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pr-2 flex items-center">
                              <span className="font-mono font-bold text-right">
                                {item.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                              </span>
                              <span className="ml-2 text-xs text-gray-500">
                                {item.percentage > 0 ? `(${item.percentage}%)` : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Status Summary */}
                  <div className="w-full lg:w-1/2 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Factures payées</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">{monthlyStats.paidCount} factures</p>
                          <p className="font-semibold text-right">
                            {monthlyStats.paidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Factures en attente de paiement</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">{monthlyStats.unpaidCount} factures</p>
                          <p className="font-semibold text-right">
                            {monthlyStats.unpaidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Missions sans facture</p>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">{monthlyStats.noInvoiceCount} missions</p>
                          <p className="font-semibold text-right">
                            {monthlyStats.noInvoiceAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Aucune donnée disponible pour ce mois</p>
                <p className="text-sm text-muted-foreground">Vous n'avez pas encore de missions terminées ce mois-ci.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="year" className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">Année {selectedYear}</h2>
                  <p className="text-sm text-muted-foreground">Répartition annuelle des revenus</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {availableYears.map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedYear(year)}
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Missions terminées</CardTitle>
                    <CardDescription>{selectedYear}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{yearlyTotal.missions}</div>
                    <p className="text-sm text-muted-foreground">Missions cette année</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA Total</CardTitle>
                    <CardDescription>{selectedYear}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {yearlyTotal.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <p className="text-sm text-muted-foreground">Total des missions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA Payé</CardTitle>
                    <CardDescription>{selectedYear}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {yearlyTotal.paid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <p className="text-sm text-muted-foreground">{yearlyTotal.paidCount} facture(s) payée(s)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">CA En attente</CardTitle>
                    <CardDescription>{selectedYear}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div>
                        <div className="text-xl font-bold text-orange-500">
                          {yearlyTotal.unpaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground">{yearlyTotal.unpaidCount} en attente</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-500">
                          {yearlyTotal.noInvoice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <p className="text-xs text-muted-foreground">{yearlyTotal.noInvoiceCount} sans facture</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Yearly Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Évolution mensuelle des revenus {selectedYear}</CardTitle>
                  <CardDescription>Montant total par mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={yearlyStats}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="monthName" 
                          tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1, 3)}
                        />
                        <YAxis 
                          tickFormatter={(value) => 
                            `${(value / 1000).toFixed(0)}k€`
                          }
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            const formattedValue = Number(value).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
                            let displayName;
                            switch (name) {
                              case "paidAmount": displayName = "Payé"; break;
                              case "unpaidAmount": displayName = "En attente"; break;
                              case "noInvoiceAmount": displayName = "Sans facture"; break;
                              default: displayName = name;
                            }
                            return [formattedValue, displayName];
                          }}
                        />
                        <Legend 
                          payload={[
                            { value: 'Payé', type: 'rect', color: '#4ade80' },
                            { value: 'En attente', type: 'rect', color: '#f97316' },
                            { value: 'Sans facture', type: 'rect', color: '#a1a1aa' },
                          ]}
                        />
                        <Bar dataKey="paidAmount" stackId="a" fill="#4ade80" name="Payé" />
                        <Bar dataKey="unpaidAmount" stackId="a" fill="#f97316" name="En attente" />
                        <Bar dataKey="noInvoiceAmount" stackId="a" fill="#a1a1aa" name="Sans facture" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Yearly Summary Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Récapitulatif par mois {selectedYear}</CardTitle>
                  <CardDescription>Détail des montants par statut</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2">Mois</th>
                          <th className="text-right py-3 px-2">Missions</th>
                          <th className="text-right py-3 px-2">CA Total</th>
                          <th className="text-right py-3 px-2">CA Payé</th>
                          <th className="text-right py-3 px-2">CA En attente</th>
                          <th className="text-right py-3 px-2">Sans facture</th>
                        </tr>
                      </thead>
                      <tbody>
                        {yearlyStats.map((monthData) => (
                          <tr key={monthData.month} className="border-b">
                            <td className="py-2 px-2 font-medium capitalize">
                              {monthData.monthName}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {monthData.completedMissions}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {monthData.totalAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="py-2 px-2 text-right text-green-600">
                              {monthData.paidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="py-2 px-2 text-right text-orange-600">
                              {monthData.unpaidAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="py-2 px-2 text-right text-gray-500">
                              {monthData.noInvoiceAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                          </tr>
                        ))}
                        <tr className="font-semibold bg-muted/50">
                          <td className="py-2 px-2">Total</td>
                          <td className="py-2 px-2 text-right">{yearlyTotal.missions}</td>
                          <td className="py-2 px-2 text-right">
                            {yearlyTotal.revenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="py-2 px-2 text-right text-green-600">
                            {yearlyTotal.paid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="py-2 px-2 text-right text-orange-600">
                            {yearlyTotal.unpaid.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="py-2 px-2 text-right text-gray-500">
                            {yearlyTotal.noInvoice.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManagement;

