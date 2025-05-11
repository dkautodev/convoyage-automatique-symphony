
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';

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
        <div className="space-y-6">
          {filteredMissions.map((mission) => (
            <div key={mission.id} className="border-b pb-6 last:border-b-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">Mission #{mission.mission_number || mission.id.slice(0, 8)}</h2>
                  <Badge className={missionStatusColors[mission.status]}>
                    {missionStatusLabels[mission.status]}
                  </Badge>
                </div>
                <Button variant="outline" asChild className="md:w-auto w-full">
                  <Link to={`/driver/missions/${mission.id}`}>
                    Détails
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <p className="flex-1">{getAddressString(mission.pickup_address)}</p>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
                <p className="flex-1">{getAddressString(mission.delivery_address)}</p>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                {(mission.D1_PEC || mission.scheduled_date) && (
                  <span>Départ: {mission.D1_PEC || formatDate(mission.scheduled_date)}</span>
                )}
                {(mission.D2_LIV || mission.delivery_expected_date) && (
                  <span> · Livraison: {mission.D2_LIV || formatDate(mission.delivery_expected_date)}</span>
                )}
              </div>
            </div>
          ))}
          
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
