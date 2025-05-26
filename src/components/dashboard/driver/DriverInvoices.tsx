import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
interface DriverInvoicesProps {
  isAdmin: boolean;
}
const DriverInvoices: React.FC<DriverInvoicesProps> = ({
  isAdmin
}) => {
  const {
    user
  } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    paidInvoices: 0,
    pendingInvoices: 0,
    totalPaid: 0,
    totalPending: 0,
    missionsWithoutInvoice: 0,
    totalMissions: 0
  });

  // Fetch driver missions and calculate stats
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user?.id && !isAdmin) return;
      try {
        setLoading(true);
        let query = supabase.from('missions').select('*').in('status', ['livre', 'termine']);
        if (!isAdmin) {
          query = query.eq('chauffeur_id', user.id);
        }
        const {
          data,
          error
        } = await query.order('created_at', {
          ascending: false
        });
        if (error) throw error;
        const convertedMissions = data.map(mission => convertMissionFromDB(mission as unknown as MissionFromDB));
        setMissions(convertedMissions);

        // Calculate stats
        const paidMissions = convertedMissions.filter(m => m.status === 'termine');
        const pendingMissions = convertedMissions.filter(m => m.status === 'livre');

        // Calculate driver commission (70% of HT price)
        const driverCommission = 0.7;
        const totalPaid = paidMissions.reduce((sum, mission) => sum + (mission.price_ht || 0) * driverCommission, 0);
        const totalPending = pendingMissions.reduce((sum, mission) => sum + (mission.price_ht || 0) * driverCommission, 0);

        // Count missions without invoice (completed but not delivered)
        const {
          count: missionsWithoutInvoice
        } = await supabase.from('missions').select('*', {
          count: 'exact'
        }).eq('chauffeur_id', user?.id).eq('status', 'livre');

        // Count total completed missions
        const {
          count: totalMissions
        } = await supabase.from('missions').select('*', {
          count: 'exact'
        }).eq('chauffeur_id', user?.id).eq('status', 'termine');
        setStats({
          paidInvoices: paidMissions.length,
          pendingInvoices: pendingMissions.length,
          totalPaid,
          totalPending,
          missionsWithoutInvoice: missionsWithoutInvoice || 0,
          totalMissions: totalMissions || 0
        });
      } catch (err) {
        console.error('Error fetching driver invoices data:', err);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };
    fetchDriverData();
  }, [user?.id, isAdmin]);
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };
  if (loading) {
    return <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-driver"></div>
      </div>;
  }
  if (isAdmin) {
    return <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Statistiques de facturation montant H.T. €</CardTitle>
            <p className="text-sm text-gray-600">Synthèse des paiements chauffeur</p>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm sm:text-base">Total restant à payer aux chauffeurs:</span>
                <span className="text-lg sm:text-xl font-bold">{formatPrice(stats.totalPending)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Factures des chauffeurs</CardTitle>
            <p className="text-sm text-gray-600">Gestion des factures des chauffeurs</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {missions.map(mission => <div key={mission.id} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="sm:text-base text-sm font-bold">
                        Mission {mission.mission_number || mission.id.slice(0, 8)}
                      </span>
                      <Button variant="outline" size="sm" className="text-xs">
                        Insérer une facture
                      </Button>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Montant: {formatPrice((mission.price_ht || 0) * 0.7)}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>)}
            
            {missions.length === 0 && <div className="text-center py-8 text-gray-500">
                <p>Aucune mission facturée trouvée</p>
              </div>}
          </CardContent>
        </Card>
      </div>;
  }

  // Driver view
  return <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-center">Revenus du mois</h1>
      
      {/* Compteurs regroupés 2 par 2 */}
      <div className="grid grid-cols-1 gap-4">
        {/* Première ligne - 2 compteurs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Factures payées</p>
                <p className="text-lg font-bold">{formatPrice(stats.totalPaid)}</p>
                <p className="text-xs text-gray-400">{stats.paidInvoices} facture(s) payée(s) ce mois-ci</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Factures non payées</p>
                <p className="text-lg font-bold text-orange-600">{formatPrice(stats.totalPending)}</p>
                <p className="text-xs text-gray-400">{stats.pendingInvoices} facture(s) en attente</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Deuxième ligne - 2 compteurs */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Missions sans facture</p>
                <p className="text-lg font-bold">{formatPrice(0)}</p>
                <p className="text-xs text-gray-400">{stats.missionsWithoutInvoice} mission(s) sans facture</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white">
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Missions terminées</p>
                <p className="text-lg font-bold">{stats.totalMissions}</p>
                <p className="text-xs text-gray-400">{stats.totalMissions} mission(s) terminée(s)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default DriverInvoices;