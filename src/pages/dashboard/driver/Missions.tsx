
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { formatFullAddress } from '@/utils/missionUtils';

const DriverMissionsPage = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchDriverMissions = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Récupérer les missions du chauffeur
        const { data: missionsData, error: missionsError } = await typedSupabase
          .from('missions')
          .select('*')
          .eq('chauffeur_id', user.id)
          .order('scheduled_date', { ascending: false });
        
        if (missionsError) throw missionsError;
        
        // Convertir les données de la DB en missions UI
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
    
    fetchDriverMissions();
  }, [user]);

  // Helper function to format date in DD/MM/YYYY format
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Function to get formatted address string
  const getAddressString = (address: any) => {
    if (!address) return '';
    
    if (address.formatted_address) {
      return address.formatted_address;
    }
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.postal_code || address.city) {
      const cityPart = [address.postal_code, address.city].filter(Boolean).join(' ');
      if (cityPart) parts.push(cityPart);
    }
    if (address.country) parts.push(address.country);
    
    return parts.join(', ') || 'Adresse non spécifiée';
  };

  // Filter missions based on search
  const filteredMissions = missions.filter(mission => {
    if (!searchText) return true;
    
    const search = searchText.toLowerCase();
    const missionNumber = (mission.mission_number || '').toLowerCase();
    const pickupAddress = getAddressString(mission.pickup_address).toLowerCase();
    const deliveryAddress = getAddressString(mission.delivery_address).toLowerCase();
    
    return missionNumber.includes(search) || 
           pickupAddress.includes(search) || 
           deliveryAddress.includes(search);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Vos Missions</h1>
          <p className="text-muted-foreground mt-1">Suivez l'état de vos missions récentes</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="search"
            placeholder="Rechercher une mission..."
            className="pl-10 w-full md:w-[300px]"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <p className="text-muted-foreground">Aucune mission trouvée</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6 shadow-lg border">
          <div className="space-y-4">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex flex-grow gap-4 items-center">
                  <div className="flex flex-col min-w-[140px]">
                    <p className="font-medium">#{mission.mission_number || mission.id.slice(0, 8)}</p>
                    <Badge className={`${missionStatusColors[mission.status]} mt-1`}>
                      {missionStatusLabels[mission.status]}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-grow text-sm">
                    <p className="flex-1 truncate text-gray-600">{formatFullAddress(mission.pickup_address)}</p>
                    <ArrowRight className="h-4 w-4 flex-shrink-0 text-gray-400" />
                    <p className="flex-1 truncate text-gray-600">{formatFullAddress(mission.delivery_address)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground hidden md:block">
                    {mission.D1_PEC && (
                      <span>Départ: {mission.D1_PEC}</span>
                    )}
                    {mission.D2_LIV && (
                      <span className="ml-2">· Livraison: {mission.D2_LIV}</span>
                    )}
                  </div>
                  <Button variant="outline" asChild size="sm">
                    <Link to={`/driver/missions/${mission.id}`}>
                      Détails
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {filteredMissions.length > 10 && (
            <div className="flex justify-center mt-6">
              <Button variant="outline">Voir plus de missions</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverMissionsPage;
