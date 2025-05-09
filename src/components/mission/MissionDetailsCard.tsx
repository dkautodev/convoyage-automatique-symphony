
import React from 'react';
import { Mission } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MapPin, Truck, User, Calendar, Clock } from 'lucide-react';
import { formatFullAddress, formatContactInfo } from '@/utils/missionUtils';
import { vehicleCategoryLabels } from '@/types/supabase';
interface MissionDetailsCardProps {
  mission: Mission;
  client: any;
  isAdmin: boolean;
  onEditClick: () => void;
  editMode: boolean;
  onCancelEdit: () => void;
}
export const MissionDetailsCard: React.FC<MissionDetailsCardProps> = ({
  mission,
  client,
  isAdmin,
  onEditClick,
  editMode,
  onCancelEdit
}) => {
  const clientName = client?.company_name || client?.full_name || 'Client inconnu';
  const vehicleCategory = mission.vehicle_category ? vehicleCategoryLabels[mission.vehicle_category] : 'Non spécifiée';
  
  // Formatter les créneaux horaires
  const formatTimeSlot = (date: string | null, timeStart: string | null, timeEnd: string | null) => {
    if (!date) return 'Non spécifié';
    
    let formattedDate;
    try {
      // Convertir la date au format français
      formattedDate = new Date(date).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      formattedDate = date;
    }
    
    if (timeStart && timeEnd) {
      return `${formattedDate} entre ${timeStart} et ${timeEnd}`;
    } else if (timeStart) {
      return `${formattedDate} à partir de ${timeStart}`;
    } else {
      return formattedDate;
    }
  };
  
  return <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Informations générales
        </CardTitle>
        {isAdmin && !editMode && <Button variant="outline" onClick={onEditClick} size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Modifier les détails
          </Button>}
        {editMode && <Button variant="outline" onClick={onCancelEdit} size="sm">
            Annuler
          </Button>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
            <p className="text-lg font-medium flex items-center gap-1">
              <User className="h-4 w-4 text-gray-500" />
              {clientName}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Distance</h4>
            <p className="text-lg font-medium">{mission.distance_km.toFixed(2)} km</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Prix HT</h4>
            <p className="text-lg font-medium">{mission.price_ht.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            })}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Prix TTC</h4>
            <p className="text-lg font-medium">{mission.price_ttc.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR'
            })}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Catégorie de véhicule</h4>
            <p className="text-lg font-medium flex items-center gap-1">
              <Truck className="h-4 w-4 text-gray-500" />
              {vehicleCategory}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">Type de mission</h4>
            <p className="text-lg font-medium">{mission.mission_type || 'Non spécifié'}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adresse de départ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p>{formatFullAddress(mission.pickup_address)}</p>
                  
                  {mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email ? <div className="mt-2 pt-2 border-t">
                      <p className="font-medium">{mission.contact_pickup_name}</p>
                      {mission.contact_pickup_phone && <p>{mission.contact_pickup_phone}</p>}
                      {mission.contact_pickup_email && <p>{mission.contact_pickup_email}</p>}
                      {/* Afficher le créneau horaire de ramassage s'il existe */}
                      {(mission.D1_PEC || mission.H1_PEC) && (
                        <div className="mt-2 flex items-start gap-1">
                          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                          <p className="text-sm">
                            {formatTimeSlot(mission.D1_PEC, mission.H1_PEC, mission.H2_PEC)}
                          </p>
                        </div>
                      )}
                    </div> : <p className="text-gray-500">Aucun contact spécifié</p>}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Adresse de livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                <div>
                  <p>{formatFullAddress(mission.delivery_address)}</p>
                  
                  {mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email ? <div className="mt-2 pt-2 border-t">
                      <p className="font-medium">{mission.contact_delivery_name}</p>
                      {mission.contact_delivery_phone && <p>{mission.contact_delivery_phone}</p>}
                      {mission.contact_delivery_email && <p>{mission.contact_delivery_email}</p>}
                      {/* Afficher le créneau horaire de livraison s'il existe */}
                      {(mission.D2_LIV || mission.H1_LIV) && (
                        <div className="mt-2 flex items-start gap-1">
                          <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                          <p className="text-sm">
                            {formatTimeSlot(mission.D2_LIV, mission.H1_LIV, mission.H2_LIV)}
                          </p>
                        </div>
                      )}
                    </div> : <p className="text-gray-500">Aucun contact spécifié</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          {/* Créneaux horaires (si existants et pas déjà affichés) */}
          {(mission.D1_PEC || mission.D2_LIV) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Créneaux horaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(mission.D1_PEC || mission.H1_PEC) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Créneau de ramassage</h4>
                    <p>{formatTimeSlot(mission.D1_PEC, mission.H1_PEC, mission.H2_PEC)}</p>
                  </div>
                )}
                
                {(mission.D2_LIV || mission.H1_LIV) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Créneau de livraison</h4>
                    <p>{formatTimeSlot(mission.D2_LIV, mission.H1_LIV, mission.H2_LIV)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        
        
        {mission.notes && <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{mission.notes}</p>
            </CardContent>
          </Card>}
      </CardContent>
    </Card>;
};
