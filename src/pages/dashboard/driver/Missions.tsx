
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Package, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatFullAddress } from '@/utils/missionUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Define valid tab values type that includes 'all' and all mission statuses
type MissionTab = 'all' | MissionStatus;

const DriverMissionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MissionTab>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchDriverMissions();
  }, [user, activeTab]);

  const fetchDriverMissions = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Build query for missions
      let query = typedSupabase
        .from('missions')
        .select('*')
        .eq('chauffeur_id', user.id)
        .order('created_at', { ascending: false });
      
      // Filter by status if a specific tab is selected
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab as MissionStatus);
      }
      
      const { data: missionsData, error: missionsError } = await query;
      
      if (missionsError) {
        console.error('Error fetching missions:', missionsError);
        throw missionsError;
      }
      
      // Convert the data from DB to missions UI
      const convertedMissions = (missionsData || []).map(mission => 
        convertMissionFromDB(mission as unknown as MissionFromDB)
      );
      
      setMissions(convertedMissions);
      console.log('Fetched missions:', convertedMissions);
    } catch (error) {
      console.error('Error fetching driver missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer vos missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date in DD/MM/YYYY format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Check if a date is today
  const isToday = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Filter missions based on search
  const filteredMissions = missions.filter(mission => {
    if (!searchText) return true;
    
    const search = searchText.toLowerCase();
    const missionNumber = (mission.mission_number || '').toLowerCase();
    const pickupAddress = formatFullAddress(mission.pickup_address).toLowerCase();
    const deliveryAddress = formatFullAddress(mission.delivery_address).toLowerCase();
    
    return missionNumber.includes(search) || 
           pickupAddress.includes(search) || 
           deliveryAddress.includes(search);
  });

  // Group all statuses into logical categories for better organization
  const tabGroups = [
    { id: 'all', label: 'Toutes', color: 'bg-primary text-white' },
    { id: 'en_acceptation', label: 'En attente', color: 'bg-amber-600 text-white' },
    { id: 'accepte', label: 'Accepté', color: 'bg-green-600 text-white' },
    { id: 'prise_en_charge', label: 'En cours', color: 'bg-amber-700 text-white' },
    { id: 'livre', label: 'Livrées', color: 'bg-blue-600 text-white' },
    { id: 'termine', label: 'Terminées', color: 'bg-green-700 text-white' },
    { id: 'annule', label: 'Annulées', color: 'bg-red-600 text-white' },
  ];

  // Update mission status with improved error handling
  const updateMissionStatus = async (newStatus: MissionStatus) => {
    if (!selectedMission || isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      
      console.log('Updating mission status:', selectedMission.id, 'from', selectedMission.status, 'to', newStatus);
      
      // Update the status in the database
      const { data, error } = await typedSupabase
        .from('missions')
        .update({ status: newStatus })
        .eq('id', selectedMission.id)
        .select();
      
      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      
      console.log('Status update response:', data);
      console.log('Status updated successfully');
      
      // Update the local state
      setMissions(missions.map(mission => {
        if (mission.id === selectedMission.id) {
          return { ...mission, status: newStatus };
        }
        return mission;
      }));
      
      // Close dialog and show success message
      setStatusDialogOpen(false);
      setConfirmDialogOpen(false);
      
      toast({
        title: "Statut mis à jour",
        description: `La mission est maintenant en statut "${missionStatusLabels[newStatus]}"`,
      });
      
      // Refetch missions to ensure we have the latest data
      fetchDriverMissions();
      
    } catch (error: any) {
      console.error('Error updating mission status:', error);
      toast({
        title: "Erreur",
        description: "Une erreur s'est produite lors de la mise à jour du statut: " + (error.message || "Erreur inconnue"),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Get the next available status options based on current status
  const getAvailableStatusOptions = (currentStatus: MissionStatus): MissionStatus[] => {
    switch (currentStatus) {
      case 'accepte':
        return ['prise_en_charge'];
      case 'prise_en_charge':
        return ['livraison'];
      case 'livraison':
        return ['livre'];
      default:
        return [];
    }
  };

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
      <p className="text-sm mt-1">Les missions qui vous seront assignées apparaîtront ici</p>
    </div>
  );

  // Check if the status update button should be enabled for a mission
  const isStatusButtonEnabled = (mission: Mission) => {
    console.log('Checking if status button should be enabled for mission:', mission.id);
    console.log('Mission status:', mission.status);
    console.log('D1_PEC:', mission.D1_PEC);
    console.log('Is today:', isToday(mission.D1_PEC));
    
    // Only enable for specific statuses that can be updated
    if (!['accepte', 'prise_en_charge', 'livraison'].includes(mission.status)) {
      console.log('Button disabled: status is not in allowed list');
      return false;
    }
    
    // For 'accepte' status, only enable if today is the scheduled pickup date
    if (mission.status === 'accepte') {
      const enabled = mission.D1_PEC ? isToday(mission.D1_PEC) : false;
      console.log('Button enabled for accepte status:', enabled);
      return enabled;
    }
    
    // For other updateable statuses, always enable
    console.log('Button enabled for status:', mission.status);
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vos missions</h2>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            type="search"
            placeholder="Rechercher une mission..."
            className="pl-8"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex gap-2">
          <Filter className="h-4 w-4" />
          Filtres
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MissionTab)}>
        <TabsList className="w-full mb-4 grid grid-cols-7 gap-1">
          {tabGroups.map((tab) => (
            <TabsTrigger 
              key={tab.id}
              value={tab.id} 
              className={`py-3 text-sm font-medium rounded-md hover:bg-gray-100 data-[state=active]:${tab.color}`}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Liste des missions {activeTab !== 'all' ? `(${missionStatusLabels[activeTab as MissionStatus] || ''})` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : filteredMissions.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-4">
                  {filteredMissions.map((mission) => (
                    <div key={mission.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">Mission #{mission.mission_number || mission.id.slice(0, 8)}</p>
                            <Badge className={missionStatusColors[mission.status]}>
                              {missionStatusLabels[mission.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatFullAddress(mission.pickup_address)} <span className="mx-1">→</span> {formatFullAddress(mission.delivery_address)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {mission.distance_km?.toFixed(2) || '0'} km · Départ: {mission.D1_PEC || formatDate(mission.scheduled_date)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!isStatusButtonEnabled(mission)} 
                            onClick={() => {
                              console.log('Status button clicked for mission:', mission.id);
                              setSelectedMission(mission);
                              setStatusDialogOpen(true);
                            }}
                            title="Mettre à jour le statut"
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/driver/missions/${mission.id}`}>
                              Détails
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour le statut</DialogTitle>
            <DialogDescription>
              Sélectionnez le nouveau statut pour cette mission
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedMission && getAvailableStatusOptions(selectedMission.status).map((status) => (
              <Button
                key={status}
                className="w-full justify-start text-left"
                onClick={() => {
                  if (status === 'livre') {
                    // For final delivery status, show confirmation dialog
                    setConfirmDialogOpen(true);
                    setStatusDialogOpen(false);
                  } else {
                    // For other statuses, update directly
                    updateMissionStatus(status);
                  }
                }}
                disabled={isUpdatingStatus}
              >
                {status === 'prise_en_charge' && 'En cours de prise en charge'}
                {status === 'livraison' && 'En cours de livraison'}
                {status === 'livre' && 'Livraison effectuée'}
              </Button>
            ))}
            
            {selectedMission && getAvailableStatusOptions(selectedMission.status).length === 0 && (
              <p className="text-center text-gray-500">
                Aucun changement de statut possible pour cette mission.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isUpdatingStatus}>Annuler</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delivery Completion */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la livraison</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr que la livraison est effectuée ? Cette action ne pourra pas être modifiée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdatingStatus}>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateMissionStatus('livre')}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Mise à jour...
                </span>
              ) : 'Confirmer la livraison'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DriverMissionsPage;
