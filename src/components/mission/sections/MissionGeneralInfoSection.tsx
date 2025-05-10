
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { formatFullAddress } from '@/utils/missionUtils';
import { vehicleCategoryLabels } from '@/types/supabase';
import { FileText, MapPin, Clock, Truck, Car, CreditCard, Info, Calendar } from 'lucide-react';

interface MissionGeneralInfoProps {
  mission: Mission;
  client: any;
}

export const MissionGeneralInfoSection: React.FC<MissionGeneralInfoProps> = ({ mission, client }) => {
  const clientName = client?.company_name || client?.full_name || 'Client inconnu';
  const vehicleCategory = mission.vehicle_category ? vehicleCategoryLabels[mission.vehicle_category] : 'Non spécifié';
  
  // Format date and time slots
  const formatDateDisplay = (date: string | null) => {
    if (!date) return 'Non spécifiée';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return date;
    }
  };
  
  const formatTimeSlot = (time: string | null) => {
    if (!time) return '';
    return time;
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informations générales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Client and financial information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
            <p className="font-medium">{clientName}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Distance</h4>
            <p className="font-medium">{mission.distance_km?.toFixed(2) || '0'} km</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Prix HT</h4>
            <p className="font-medium">
              {mission.price_ht?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Prix TTC</h4>
            <p className="font-medium">
              {mission.price_ttc?.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }) || '0 €'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Type de mission</h4>
            <p className="font-medium">{mission.mission_type || 'Non spécifié'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Catégorie de véhicule</h4>
            <p className="font-medium flex items-center gap-1">
              <Truck className="h-4 w-4 text-gray-500" />
              {vehicleCategory}
            </p>
          </div>
        </div>

        {/* Addresses */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Adresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Adresse de départ</h4>
              <p className="font-medium">
                {mission.pickup_address ? formatFullAddress(mission.pickup_address) : 'Adresse non spécifiée'}
              </p>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Contact départ</h5>
                {mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email ? (
                  <div>
                    {mission.contact_pickup_name && <p className="font-medium">{mission.contact_pickup_name}</p>}
                    {mission.contact_pickup_phone && <p>{mission.contact_pickup_phone}</p>}
                    {mission.contact_pickup_email && <p>{mission.contact_pickup_email}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun contact spécifié</p>
                )}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Adresse de livraison</h4>
              <p className="font-medium">
                {mission.delivery_address ? formatFullAddress(mission.delivery_address) : 'Adresse non spécifiée'}
              </p>
              
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-500 mb-1">Contact livraison</h5>
                {mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email ? (
                  <div>
                    {mission.contact_delivery_name && <p className="font-medium">{mission.contact_delivery_name}</p>}
                    {mission.contact_delivery_phone && <p>{mission.contact_delivery_phone}</p>}
                    {mission.contact_delivery_email && <p>{mission.contact_delivery_email}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun contact spécifié</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Vehicle information */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Car className="h-5 w-5" />
            Informations véhicule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mission.vehicle_make && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Marque</h4>
                <p className="font-medium">{mission.vehicle_make}</p>
              </div>
            )}
            {mission.vehicle_model && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Modèle</h4>
                <p className="font-medium">{mission.vehicle_model}</p>
              </div>
            )}
            {mission.vehicle_year && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Année</h4>
                <p className="font-medium">{mission.vehicle_year}</p>
              </div>
            )}
            {mission.vehicle_fuel && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Carburant</h4>
                <p className="font-medium">{mission.vehicle_fuel}</p>
              </div>
            )}
            {mission.vehicle_registration && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Immatriculation</h4>
                <p className="font-medium">{mission.vehicle_registration}</p>
              </div>
            )}
            {mission.vehicle_vin && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">VIN</h4>
                <p className="font-medium">{mission.vehicle_vin}</p>
              </div>
            )}
            {!mission.vehicle_make && !mission.vehicle_model && !mission.vehicle_year && 
             !mission.vehicle_fuel && !mission.vehicle_registration && !mission.vehicle_vin && (
              <div className="col-span-3">
                <p className="text-gray-500 text-center">Aucune information véhicule spécifiée</p>
              </div>
            )}
          </div>
        </div>

        {/* Time slots */}
        <div className="mb-6 border-t pt-6">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dates et créneaux
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Date départ</h4>
              <p className="font-medium">
                {mission.D1_PEC ? formatDateDisplay(mission.D1_PEC) : 'Non spécifiée'}
                {mission.H1_PEC && mission.H2_PEC ? 
                  ` entre ${formatTimeSlot(mission.H1_PEC)} et ${formatTimeSlot(mission.H2_PEC)}` : 
                  mission.H1_PEC ? ` à partir de ${formatTimeSlot(mission.H1_PEC)}` : ''}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Date livraison</h4>
              <p className="font-medium">
                {mission.D2_LIV ? formatDateDisplay(mission.D2_LIV) : 'Non spécifiée'}
                {mission.H1_LIV && mission.H2_LIV ? 
                  ` entre ${formatTimeSlot(mission.H1_LIV)} et ${formatTimeSlot(mission.H2_LIV)}` : 
                  mission.H1_LIV ? ` à partir de ${formatTimeSlot(mission.H1_LIV)}` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {mission.notes && (
          <div className="border-t pt-6">
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Info className="h-5 w-5" />
              Notes complémentaires
            </h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="whitespace-pre-wrap">{mission.notes}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
