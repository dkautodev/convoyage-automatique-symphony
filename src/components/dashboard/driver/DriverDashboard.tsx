import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Package, Clock, CreditCard, Calendar, Phone, CheckCircle, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB, vehicleCategoryLabels } from '@/types/supabase';
import { formatAddressDisplay, formatMissionNumber } from '@/utils/missionUtils';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
const DriverDashboard = () => {
  const {
    profile,
    user
  } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [currentMission, setCurrentMission] = useState<Mission | null>(null);
  const [upcomingMissions, setUpcomingMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayMissions: 0,
    upcomingMissions: 0,
    completedMissions: 0,
    earnings: 0,
    paidInvoices: 0
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
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
      const {
        data: missionsData,
        error
      } = await supabase.from('missions').select('*').eq('chauffeur_id', user?.id).order('scheduled_date', {
        ascending: true
      });
      if (error) throw error;
      if (missionsData && missionsData.length > 0) {
        // Convert all missions to the correct type
        const convertedMissions: Mission[] = missionsData.map(mission => convertMissionFromDB(mission as unknown as MissionFromDB));

        // Trouver la mission en cours (en prise en charge ou en livraison)
        const inProgressMission = convertedMissions.find(m => m.status === 'prise_en_charge' || m.status === 'livraison');

        // Trouver les missions à venir (acceptées mais pas encore en cours)
        const upcoming = convertedMissions.filter(m => m.status === 'accepte').slice(0, 3); // Limiter à 3 missions à venir

        setCurrentMission(inProgressMission || null);
        setUpcomingMissions(upcoming);
        setMissions(convertedMissions);
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
      const {
        count: todayCount
      } = await supabase.from('missions').select('*', {
        count: 'exact',
        head: true
      }).eq('chauffeur_id', user.id).gte('scheduled_date', today.toISOString()).lt('scheduled_date', new Date(today.getTime() + 86400000).toISOString()); // +24h

      // Missions à venir
      const {
        count: upcomingCount
      } = await supabase.from('missions').select('*', {
        count: 'exact',
        head: true
      }).eq('chauffeur_id', user.id).eq('status', 'accepte');

      // Missions terminées ce mois-ci
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const {
        count: completedCount
      } = await supabase.from('missions').select('*', {
        count: 'exact',
        head: true
      }).eq('chauffeur_id', user.id).eq('status', 'termine').gte('completion_date', firstDayOfMonth.toISOString());

      // Factures payées du mois (basées sur chauffeur_paid)
      const {
        data: paidMissions
      } = await supabase.from('missions').select('chauffeur_price_ht').eq('chauffeur_id', user.id).eq('chauffeur_paid', true).gte('updated_at', firstDayOfMonth.toISOString());
      const monthEarnings = paidMissions?.reduce((sum, mission) => sum + (mission.chauffeur_price_ht || 0), 0) || 0;

      // Nombre de factures payées
      const {
        count: paidInvoicesCount
      } = await supabase.from('missions').select('*', {
        count: 'exact',
        head: true
      }).eq('chauffeur_id', user.id).eq('chauffeur_paid', true).gte('updated_at', firstDayOfMonth.toISOString());
      setStats({
        todayMissions: todayCount || 0,
        upcomingMissions: upcomingCount || 0,
        completedMissions: completedCount || 0,
        earnings: monthEarnings,
        paidInvoices: paidInvoicesCount || 0
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };
  const handleStatusUpdate = async () => {
    if (!currentMission) return;
    try {
      setStatusUpdateLoading(true);
      let newStatus: MissionStatus;

      // Determine next status based on current status
      if (currentMission.status === 'accepte') {
        newStatus = 'prise_en_charge';
      } else if (currentMission.status === 'prise_en_charge') {
        newStatus = 'livraison';
      } else if (currentMission.status === 'livraison') {
        newStatus = 'livre';
      } else {
        // If already delivered or in another status, no change
        setStatusUpdateLoading(false);
        return;
      }

      // For 'livre' status, confirmation is handled by the dialog
      if (newStatus === 'livre') {
        setConfirmDialogOpen(true);
        setStatusUpdateLoading(false);
        return;
      }

      // Update status directly for other status transitions
      await updateMissionStatus(newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast.error("Erreur lors de la mise à jour du statut");
      setStatusUpdateLoading(false);
    }
  };
  const updateMissionStatus = async (newStatus: MissionStatus) => {
    if (!currentMission) return;
    try {
      setStatusUpdateLoading(true);
      const {
        error
      } = await supabase.from('missions').update({
        status: newStatus,
        ...(newStatus === 'livre' ? {
          completion_date: new Date().toISOString()
        } : {})
      }).eq('id', currentMission.id);
      if (error) throw error;
      toast.success(`Mission mise à jour avec succès: ${missionStatusLabels[newStatus]}`);
      fetchDriverMissions();
      fetchDriverStats();

      // Close dialog if open
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la mission:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Function to get the next status button label
  const getNextStatusLabel = (mission: Mission | null) => {
    if (!mission) return "Mettre à jour le statut";
    switch (mission.status) {
      case 'accepte':
        return "Démarrer la prise en charge";
      case 'prise_en_charge':
        return "Démarrer la livraison";
      case 'livraison':
        return "Marquer comme livré";
      default:
        return "Mettre à jour le statut";
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/driver/missions">
              <MapPin className="mr-2 h-4 w-4" />
              Voir mes missions
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards - Updated for better responsiveness */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">Mission du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Package className="h-6 w-6 sm:h-7 sm:w-7 text-blue-500 mr-3 sm:mr-4" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{stats.todayMissions}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Aujourd'hui</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">Missions à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-green-500 mr-3 sm:mr-4" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{stats.upcomingMissions}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">Missions terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-purple-500 mr-3 sm:mr-4" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{stats.completedMissions}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">Factures payées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-500 mr-3 sm:mr-4" />
              <div>
                <div className="text-xl sm:text-2xl font-bold">{stats.paidInvoices}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium whitespace-nowrap">Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-amber-500 mr-3 sm:mr-4" />
              <div>
                <div className="text-xl sm:text-2xl font-bold truncate">{stats.earnings.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                })}</div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Ce mois-ci</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentMission ? <Card>
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    <span className="flex items-center">
                      <Truck className="h-4 w-4 mr-1" />
                      Type de véhicule
                    </span>
                  </h3>
                  <p>{currentMission.vehicle_category ? vehicleCategoryLabels[currentMission.vehicle_category] || currentMission.vehicle_category : "Non spécifié"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Marque
                  </h3>
                  <p>{currentMission.vehicle_make || "Non spécifié"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Modèle
                  </h3>
                  <p>{currentMission.vehicle_model || "Non spécifié"}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Immatriculation
                  </h3>
                  <p>{currentMission.vehicle_registration || "Non spécifié"}</p>
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

              <Button onClick={handleStatusUpdate} disabled={statusUpdateLoading || ['termine', 'livre', 'annule', 'incident'].includes(currentMission.status)}>
                {statusUpdateLoading ? <span className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Mise à jour...
                  </span> : <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {getNextStatusLabel(currentMission)}
                  </>}
              </Button>
            </div>
          </CardContent>
        </Card> : <Card>
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
        </Card>}

      {/* Upcoming Missions Section - This was missing and now restored */}
      <Card>
        <CardHeader>
          <CardTitle>Prochaines missions</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMissions.length > 0 ? <div className="space-y-4">
              {upcomingMissions.map(mission => <div key={mission.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex justify-between mb-1">
                    <div className="font-medium">Mission #{formatMissionNumber(mission)}</div>
                    <div className="text-sm text-amber-500 font-medium">
                      {mission.D1_PEC || new Date(mission.scheduled_date || '').toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Type: </span>
                      {mission.vehicle_category ? vehicleCategoryLabels[mission.vehicle_category] || mission.vehicle_category : "Non spécifié"}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Marque: </span>
                      {mission.vehicle_make || "Non spécifié"}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Modèle: </span>
                      {mission.vehicle_model || "Non spécifié"}
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Immat.: </span>
                      {mission.vehicle_registration || "Non spécifié"}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {formatAddressDisplay(mission.pickup_address)} → {formatAddressDisplay(mission.delivery_address)}
                  </div>
                </div>)}
              <div className="flex justify-center mt-4">
                <Button variant="outline" asChild>
                  <Link to="/driver/missions">
                    Voir toutes mes missions
                  </Link>
                </Button>
              </div>
            </div> : <div className="text-center py-10 text-neutral-500">
              <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
              <p>Vous n'avez pas de missions à venir.</p>
            </div>}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog for Delivery completion */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la livraison</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir marquer cette mission comme livrée ? 
              Cette action ne pourra pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={statusUpdateLoading}>
              Annuler
            </Button>
            <Button onClick={() => updateMissionStatus('livre')} disabled={statusUpdateLoading}>
              {statusUpdateLoading ? <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </span> : 'Confirmer la livraison'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default DriverDashboard;