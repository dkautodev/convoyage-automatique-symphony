
import React, { useState, useEffect } from 'react';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Mission, MissionStatus, missionStatusLabels, missionStatusColors, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DriverMissionsPage = () => {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

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
          .order('created_at', { ascending: false });
        
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

  // Filtrer les missions selon le statut sélectionné
  const filteredMissions = missions.filter(mission => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['prise_en_charge', 'livraison'].includes(mission.status);
    if (filter === 'pending') return ['demande', 'accepte'].includes(mission.status);
    if (filter === 'completed') return mission.status === 'termine';
    if (filter === 'cancelled') return mission.status === 'annule';
    return true;
  });

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Non planifiée';
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  // Helper function to get a display friendly address string
  const getAddressString = (address: any) => {
    if (!address) return 'Adresse non spécifiée';
    return address.city || address.formatted_address || 'Adresse incomplète';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Mes Missions</h1>
      
      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={filter === 'all' ? 'default' : 'outline'} 
          onClick={() => setFilter('all')}
        >
          Toutes
        </Button>
        <Button 
          variant={filter === 'active' ? 'default' : 'outline'} 
          onClick={() => setFilter('active')}
          className="border-blue-500 text-blue-700 hover:bg-blue-50"
        >
          <Loader2 className="mr-2 h-4 w-4" />
          En cours
        </Button>
        <Button 
          variant={filter === 'pending' ? 'default' : 'outline'} 
          onClick={() => setFilter('pending')}
          className="border-amber-500 text-amber-700 hover:bg-amber-50"
        >
          <AlertCircle className="mr-2 h-4 w-4" />
          En attente
        </Button>
        <Button 
          variant={filter === 'completed' ? 'default' : 'outline'} 
          onClick={() => setFilter('completed')}
          className="border-green-500 text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Terminées
        </Button>
        <Button 
          variant={filter === 'cancelled' ? 'default' : 'outline'} 
          onClick={() => setFilter('cancelled')}
          className="border-red-500 text-red-700 hover:bg-red-50"
        >
          <XCircle className="mr-2 h-4 w-4" />
          Annulées
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : filteredMissions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin size={40} className="text-gray-300 mb-3" />
            <p className="text-gray-500 text-center">Aucune mission trouvée pour ce filtre</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredMissions.map((mission) => (
            <Card key={mission.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      Mission #{mission.mission_number || mission.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      Planifiée le {formatDate(mission.scheduled_date)}
                    </CardDescription>
                  </div>
                  <Badge className={missionStatusColors[mission.status]}>
                    {missionStatusLabels[mission.status]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold flex items-center gap-1 mb-1">
                      <MapPin size={16} className="text-red-500" />
                      Adresse d'enlèvement
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getAddressString(mission.pickup_address)}
                    </p>
                    
                    <h3 className="font-semibold flex items-center gap-1 mt-4 mb-1">
                      <MapPin size={16} className="text-green-500" />
                      Adresse de livraison
                    </h3>
                    <p className="text-sm text-gray-600">
                      {getAddressString(mission.delivery_address)}
                    </p>
                    
                    <div className="mt-4 text-sm text-gray-500">
                      <p>Distance: {mission.distance_km?.toFixed(2) || '0'} km</p>
                      {mission.duration_minutes && (
                        <p>Durée estimée: {Math.floor(mission.duration_minutes / 60)}h{mission.duration_minutes % 60 > 0 ? ` ${mission.duration_minutes % 60}min` : ''}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold flex items-center gap-1 mb-1">
                      <Calendar size={16} />
                      Détails de la mission
                    </h3>
                    
                    <div className="text-sm space-y-2">
                      {mission.description && (
                        <p className="text-gray-600">{mission.description}</p>
                      )}
                      
                      <div className="flex gap-4 mt-6">
                        <Button asChild variant="default">
                          <Link to={`/driver/missions/${mission.id}`}>
                            Voir les détails
                          </Link>
                        </Button>
                        
                        {(['prise_en_charge', 'livraison'].includes(mission.status)) && (
                          <Button asChild variant="outline">
                            <Link to={`/driver/missions/${mission.id}/update`}>
                              Mettre à jour
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverMissionsPage;
