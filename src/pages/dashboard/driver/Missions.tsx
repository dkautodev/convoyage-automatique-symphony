
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatFullAddress } from '@/utils/missionUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define valid tab values type that includes 'all' and all mission statuses
type MissionTab = 'all' | MissionStatus;

const DriverMissionsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MissionTab>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

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
      
      if (missionsError) throw missionsError;
      
      // Convert the data from DB to missions UI
      const convertedMissions = (missionsData || []).map(mission => 
        convertMissionFromDB(mission as unknown as MissionFromDB)
      );
      
      setMissions(convertedMissions);
    } catch (error) {
      console.error('Error fetching driver missions:', error);
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

  // Empty state component
  const EmptyState = () => (
    <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
      <p className="text-sm mt-1">Les missions qui vous seront assignées apparaîtront ici</p>
    </div>
  );

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
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/driver/missions/${mission.id}`}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverMissionsPage;
