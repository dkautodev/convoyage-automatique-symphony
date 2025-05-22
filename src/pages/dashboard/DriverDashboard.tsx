
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/useAuth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB, vehicleCategoryLabels } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Truck, CheckCircle, CreditCard, CalendarDays } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const DriverDashboard = () => {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    assignedMissions: 0,
    completedMissions: 0,
    monthlyEarnings: 0,
    inProgressMissions: 0
  });
  
  // État pour la gestion du dialogue de confirmation de livraison
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

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
        
        console.log("Missions converties:", convertedMissions);
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
        toast({
          title: "Erreur",
          description: "Impossible de charger les données du chauffeur",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverData();
  }, [user]);

  // Helper function to get a display friendly address string
  const getAddressString = (address: any) => {
    if (!address) return 'Adresse non spécifiée';
    return address.city || address.formatted_address || 'Adresse incomplète';
  };
  
  // Fonction pour mettre à jour le statut d'une mission
  const updateMissionStatus = async (missionId: string, newStatus: MissionStatus) => {
    if (!user?.id) return;
    
    try {
      setStatusUpdateLoading(true);
      
      const { error } = await typedSupabase
        .from('missions')
        .update({ 
          status: newStatus,
          ...(newStatus === 'livre' ? { completion_date: new Date().toISOString() } : {})
        })
        .eq('id', missionId);
      
      if (error) throw error;
      
      // Mise à jour locale de la mission
      setMissions(missions.map(mission => 
        mission.id === missionId 
          ? { ...mission, status: newStatus } 
          : mission
      ));
      
      toast({
        title: "Succès",
        description: `La mission a été mise à jour avec succès: ${missionStatusLabels[newStatus]}`,
      });
      
      // Fermer le dialogue de confirmation
      setConfirmDialogOpen(false);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut de la mission",
        variant: "destructive"
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };
  
  // Fonction pour gérer la demande de mise à jour du statut
  const handleStatusUpdate = (mission: Mission) => {
    if (!mission.id) return;
    
    // Déterminer le nouveau statut en fonction du statut actuel
    let newStatus: MissionStatus;
    
    if (mission.status === 'accepte') {
      newStatus = 'prise_en_charge';
      updateMissionStatus(mission.id, newStatus);
    } else if (mission.status === 'prise_en_charge') {
      newStatus = 'livraison';
      updateMissionStatus(mission.id, newStatus);
    } else if (mission.status === 'livraison') {
      // Pour le passage à livre, on ouvre une boîte de dialogue de confirmation
      setSelectedMissionId(mission.id);
      setConfirmDialogOpen(true);
    }
  };
  
  // Fonction pour obtenir le libellé du bouton en fonction du statut actuel
  const getNextStatusButtonLabel = (status: MissionStatus) => {
    switch (status) {
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-driver"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-driver">Tableau de bord chauffeur</h2>
        <Button variant="outline" asChild>
          <Link to="/driver/schedule">
            <CalendarDays size={16} className="mr-2" />
            <span className="whitespace-nowrap">Voir le planning</span>
          </Link>
        </Button>
      </div>
      
      {/* Cartes statistiques - Updated for better responsiveness */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 whitespace-nowrap">Missions Assignées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.assignedMissions}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-driver/10 flex items-center justify-center">
                <Truck size={16} className="sm:text-[20px] text-driver" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 whitespace-nowrap">En cours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.inProgressMissions}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <MapPin size={16} className="sm:text-[20px] text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 whitespace-nowrap">Missions Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.completedMissions}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={16} className="sm:text-[20px] text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white min-w-[120px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 whitespace-nowrap">Gains du Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl sm:text-2xl font-bold truncate">{stats.monthlyEarnings.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <CreditCard size={16} className="sm:text-[20px] text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Missions assignées */}
      <Card className="bg-white">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                <div key={mission.id} className="border-b pb-3 last:border-b-0 last:pb-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-medium">Mission #{mission.mission_number || mission.id.slice(0, 8)}</p>
                      <Badge className={missionStatusColors[mission.status]}>
                        {missionStatusLabels[mission.status]}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 break-words">
                      {getAddressString(mission.pickup_address)} → {getAddressString(mission.delivery_address)}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-500">Véhicule: </span>
                        {mission.vehicle_category ? 
                          (vehicleCategoryLabels[mission.vehicle_category] || mission.vehicle_category) 
                          : "Non spécifié"}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Marque: </span>
                        {mission.vehicle_make || "Non spécifié"}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Modèle: </span>
                        {mission.vehicle_model || "Non spécifié"}
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Immat.: </span>
                        {mission.vehicle_registration || "Non spécifié"}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Prévue le {new Date(mission.scheduled_date || '').toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(mission.status === 'accepte' || mission.status === 'prise_en_charge' || mission.status === 'livraison') && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleStatusUpdate(mission)}
                        disabled={statusUpdateLoading}
                      >
                        {statusUpdateLoading && selectedMissionId === mission.id ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                            Mise à jour...
                          </span>
                        ) : (
                          getNextStatusButtonLabel(mission.status as MissionStatus)
                        )}
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
      
      {/* Dialogue de confirmation pour marquer une mission comme livrée */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la livraison</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir marquer cette mission comme livrée ?
              Cette action ne pourra pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-between sm:justify-end mt-4 gap-2">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialogOpen(false)}
              disabled={statusUpdateLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={() => selectedMissionId && updateMissionStatus(selectedMissionId, 'livre')}
              disabled={statusUpdateLoading}
            >
              {statusUpdateLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </span>
              ) : "Confirmer la livraison"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboard;
