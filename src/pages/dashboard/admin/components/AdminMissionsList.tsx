
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, Package, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatFullAddress } from '@/utils/missionUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import AdminMissionsFilters from './AdminMissionsFilters';

type AdminMissionTab = 'all' | MissionStatus;

const AdminMissionsList = () => {
  const [activeTab, setActiveTab] = useState<AdminMissionTab>('all');
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchMissions();
  }, [activeTab]);

  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      let query = typedSupabase
        .from('missions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (activeTab !== 'all') {
        query = query.eq('status', activeTab as MissionStatus);
      }
      
      const { data: missionsData, error: missionsError } = await query;
      
      if (missionsError) {
        console.error('Error fetching missions:', missionsError);
        throw missionsError;
      }
      
      const convertedMissions = (missionsData || []).map(mission => 
        convertMissionFromDB(mission as unknown as MissionFromDB)
      );
      
      setMissions(convertedMissions);
    } catch (error) {
      console.error('Error fetching missions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les missions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

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

  const missionCountsByStatus = missions.reduce((acc, mission) => {
    acc[mission.status] = (acc[mission.status] || 0) + 1;
    return acc;
  }, {} as Record<MissionStatus, number>);
  
  const totalMissions = missions.length;

  const EmptyState = () => (
    <div className="text-center py-10 text-neutral-500">
      <Package className="h-12 w-12 mx-auto text-neutral-300 mb-3" />
      <p className="font-medium">Aucune mission à afficher pour le moment.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestion des missions</h2>
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

      <AdminMissionsFilters
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        missionCountsByStatus={missionCountsByStatus}
        totalMissions={totalMissions}
      />

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
                  <div className="flex flex-col gap-3">
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
                        {mission.distance_km?.toFixed(2) || '0'} km · Départ: {formatDate(mission.scheduled_date)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild className="w-full text-sm py-1">
                        <Link to={`/admin/missions/${mission.id}/edit`}>
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="w-full text-sm py-1">
                        <Link to={`/admin/missions/${mission.id}`}>
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
    </div>
  );
};

export default AdminMissionsList;
