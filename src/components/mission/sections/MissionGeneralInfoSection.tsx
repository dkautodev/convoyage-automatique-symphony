
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFullAddress, formatAddressDisplay } from '@/utils/missionUtils';
import { Mission } from '@/types/supabase';
import { Separator } from '@/components/ui/separator';
import { GenerateMissionSheetButton } from '@/components/mission/GenerateMissionSheetButton';

interface MissionGeneralInfoSectionProps {
  mission: Mission;
  client?: any;
  driverName: string;
  adminProfile?: any;
  hideFinancials?: boolean;
}

export const MissionGeneralInfoSection: React.FC<MissionGeneralInfoSectionProps> = ({
  mission,
  client,
  driverName,
  adminProfile,
  hideFinancials = false
}) => {
  // Format the price as a string with a Euro symbol
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR'
    }).format(price);
  };

  // Format date and time
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'Non spécifié';
    
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  // Format time slot
  const formatTimeSlot = (date: string | null, timeStart: string | null, timeEnd: string | null) => {
    if (!date) return 'Non spécifié';
    
    const formattedDate = formatDateTime(date);
    
    if (timeStart && timeEnd) {
      return `${formattedDate} entre ${timeStart} et ${timeEnd}`;
    } else if (timeStart) {
      return `${formattedDate} à partir de ${timeStart}`;
    } else {
      return formattedDate;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Informations générales</CardTitle>
        {hideFinancials && (
          <div>
            <GenerateMissionSheetButton mission={mission} driverName={driverName} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Address Information */}
          <div>
            <h3 className="font-bold text-lg mb-2">Adresses</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Adresse d'enlèvement:</h4>
                <p className="text-gray-700">{formatFullAddress(mission.pickup_address)}</p>
                
                {/* Contact pickup information */}
                {mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email ? (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-semibold">{mission.contact_pickup_name}</p>
                    {mission.contact_pickup_phone && <p>{mission.contact_pickup_phone}</p>}
                    {mission.contact_pickup_email && <p>{mission.contact_pickup_email}</p>}
                  </div>
                ) : null}
              </div>
              <div>
                <h4 className="font-semibold">Adresse de livraison:</h4>
                <p className="text-gray-700">{formatFullAddress(mission.delivery_address)}</p>
                
                {/* Contact delivery information */}
                {mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email ? (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-semibold">{mission.contact_delivery_name}</p>
                    {mission.contact_delivery_phone && <p>{mission.contact_delivery_phone}</p>}
                    {mission.contact_delivery_email && <p>{mission.contact_delivery_email}</p>}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Time slots information */}
          <div>
            <h3 className="font-bold text-lg mb-2">Créneaux horaires</h3>
            <div className="space-y-4">
              {(mission.D1_PEC || mission.H1_PEC) && (
                <div>
                  <h4 className="font-semibold">Créneau de ramassage:</h4>
                  <p className="text-gray-700">{formatTimeSlot(mission.D1_PEC, mission.H1_PEC, mission.H2_PEC)}</p>
                </div>
              )}
              
              {(mission.D2_LIV || mission.H1_LIV) && (
                <div>
                  <h4 className="font-semibold">Créneau de livraison:</h4>
                  <p className="text-gray-700">{formatTimeSlot(mission.D2_LIV, mission.H1_LIV, mission.H2_LIV)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Client Information - Only show if client exists and hideFinancials is false */}
          {client && !hideFinancials && (
            <div>
              <h3 className="font-bold text-lg mb-2">Client</h3>
              <p><span className="font-semibold">Nom:</span> {client.company_name || client.full_name || "Non spécifié"}</p>
              {client.phone1 && <p><span className="font-semibold">Téléphone:</span> {client.phone1}</p>}
              {client.email && <p><span className="font-semibold">Email:</span> {client.email}</p>}
              {client.siret && <p><span className="font-semibold">SIRET:</span> {client.siret}</p>}
            </div>
          )}

          {/* Mission Details */}
          <div className={!hideFinancials ? "md:col-span-2" : ""}>
            <h3 className="font-bold text-lg mb-2">Détails de la mission</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="font-semibold">Chauffeur assigné:</p>
                <p className="text-gray-700">{driverName}</p>
              </div>
              <div>
                <p className="font-semibold">Distance:</p>
                <p className="text-gray-700">{mission.distance_km.toFixed(2)} km</p>
              </div>
              <div>
                <p className="font-semibold">Véhicule:</p>
                <p className="text-gray-700">
                  {mission.vehicle_category ? mission.vehicle_category.replace(/_/g, ' ').toLocaleUpperCase() : 'Non spécifié'}
                </p>
              </div>
              {mission.vehicle_make && (
                <div>
                  <p className="font-semibold">Marque/Modèle:</p>
                  <p className="text-gray-700">
                    {mission.vehicle_make} {mission.vehicle_model || ''}
                  </p>
                </div>
              )}
              {mission.vehicle_registration && (
                <div>
                  <p className="font-semibold">Immatriculation:</p>
                  <p className="text-gray-700">{mission.vehicle_registration}</p>
                </div>
              )}
              {mission.mission_type && (
                <div>
                  <p className="font-semibold">Type de mission:</p>
                  <p className="text-gray-700">{mission.mission_type}</p>
                </div>
              )}
              {mission.notes && (
                <div className="col-span-full">
                  <p className="font-semibold">Notes:</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{mission.notes}</p>
                </div>
              )}
            </div>
            
            {/* Only display financial info if not hidden */}
            {!hideFinancials && (
              <>
                <Separator className="my-4" />
                <div className="mt-4">
                  <h3 className="font-bold text-lg mb-2">Informations financières</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="font-semibold">Prix HT:</p>
                      <p className="text-gray-700">{formatPrice(mission.price_ht)}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Taux TVA:</p>
                      <p className="text-gray-700">{mission.vat_rate || 20}%</p>
                    </div>
                    <div>
                      <p className="font-semibold">Prix TTC:</p>
                      <p className="text-gray-700 font-bold">{formatPrice(mission.price_ttc)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
