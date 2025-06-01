
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Euro, Clock, User, Car } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { formatAddressDisplay } from '@/utils/missionUtils';

interface MissionGeneralInfoSectionProps {
  mission: Mission;
  client?: any;
  driverName?: string;
  adminProfile?: any;
  hideFinancials?: boolean;
  refetchMission: () => void;
}

export const MissionGeneralInfoSection: React.FC<MissionGeneralInfoSectionProps> = ({
  mission,
  client,
  driverName,
  hideFinancials = false
}) => {
  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return time.substring(0, 5); // Format HH:MM
  };

  const formatTimeRange = (startTime: string | null, endTime: string | null) => {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    if (!start && !end) return 'Non défini';
    if (!end) return start;
    return `${start} - ${end}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Informations générales
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations en grid 2 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 min-w-[120px]">Client</span>
            <span className="font-medium text-right flex-1">{client?.company_name || client?.full_name || 'Client inconnu'}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 min-w-[120px]">Type de mission</span>
            <span className="font-medium text-right flex-1">{mission.mission_type || 'RES'}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 min-w-[120px]">Catégorie de véhicule</span>
            <span className="font-medium text-right flex-1">{mission.vehicle_category || 'BERLINE'}</span>
          </div>
          
          <div className="flex justify-between items-start">
            <span className="text-sm text-gray-500 min-w-[120px]">Distance</span>
            <span className="font-medium text-right flex-1">{mission.distance_km?.toFixed(2) || '0'} km</span>
          </div>
          
          {!hideFinancials && (
            <>
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 min-w-[120px]">Prix HT</span>
                <span className="font-medium text-stone-900 text-right flex-1">
                  {mission.price_ht?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0,00 €'}
                </span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-500 min-w-[120px]">Prix TTC</span>
                <span className="text-stone-900 font-medium text-right flex-1">
                  {mission.price_ttc?.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }) || '0,00 €'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Adresses - Grid 2 colonnes responsive */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Départ</p>
              <p className="text-sm">{formatAddressDisplay(mission.pickup_address)}</p>
              {(mission.contact_pickup_name || mission.contact_pickup_phone) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {mission.contact_pickup_name && <p>Contact: {mission.contact_pickup_name}</p>}
                  {mission.contact_pickup_phone && <p>Tél: {mission.contact_pickup_phone}</p>}
                  {mission.contact_pickup_email && <p>Email: {mission.contact_pickup_email}</p>}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Livraison</p>
              <p className="text-sm">{formatAddressDisplay(mission.delivery_address)}</p>
              {(mission.contact_delivery_name || mission.contact_delivery_phone) && (
                <div className="text-xs text-gray-500 space-y-1">
                  {mission.contact_delivery_name && <p>Contact: {mission.contact_delivery_name}</p>}
                  {mission.contact_delivery_phone && <p>Tél: {mission.contact_delivery_phone}</p>}
                  {mission.contact_delivery_email && <p>Email: {mission.contact_delivery_email}</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Créneaux horaires - Grid 2 colonnes avec 3 lignes */}
        <div className="border-t pt-6">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Créneaux horaires
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            {/* Première ligne : Labels */}
            <div className="text-sm text-gray-500 mb-2">Départ</div>
            <div className="text-sm text-gray-500 mb-2">Livraison</div>
            
            {/* Deuxième ligne : Dates */}
            <div className="text-sm mb-2">
              {formatDate(mission.D1_PEC)}
            </div>
            <div className="text-sm mb-2">
              {formatDate(mission.D2_LIV)}
            </div>
            
            {/* Troisième ligne : Créneaux horaires */}
            <div className="text-sm text-gray-600">
              {formatTimeRange(mission.H1_PEC, mission.H2_PEC)}
            </div>
            <div className="text-sm text-gray-600">
              {formatTimeRange(mission.H1_LIV, mission.H2_LIV)}
            </div>
          </div>
        </div>

        {/* Informations véhicule */}
        {(mission.vehicle_make || mission.vehicle_model || mission.vehicle_year || mission.vehicle_registration) && (
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Car className="h-4 w-4" />
              Informations véhicule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(mission.vehicle_make || mission.vehicle_model) && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Marque / Modèle</p>
                  <p className="text-sm">
                    {[mission.vehicle_make, mission.vehicle_model].filter(Boolean).join(' ')}
                    {mission.vehicle_year && <span className="text-gray-500"> ({mission.vehicle_year})</span>}
                  </p>
                </div>
              )}
              {mission.vehicle_registration && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Immatriculation</p>
                  <p className="text-sm">{mission.vehicle_registration}</p>
                </div>
              )}
              {mission.vehicle_vin && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">VIN</p>
                  <p className="text-sm">{mission.vehicle_vin}</p>
                </div>
              )}
              {mission.vehicle_fuel && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Carburant</p>
                  <p className="text-sm">{mission.vehicle_fuel}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {mission.notes && (
          <div className="border-t pt-6">
            <h3 className="mb-4 font-extrabold">Notes complémentaires</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{mission.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
