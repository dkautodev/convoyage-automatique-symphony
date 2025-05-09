import React from 'react';
import { Mission } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MapPin, Truck, User } from 'lucide-react';
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
                    </div> : <p className="text-gray-500">Aucun contact spécifié</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Contacts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Contact ramassage</h4>
                  {mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email ? <div className="space-y-1">
                      {mission.contact_pickup_name && <p><span className="font-medium">Nom:</span> {mission.contact_pickup_name}</p>}
                      {mission.contact_pickup_phone && <p><span className="font-medium">Téléphone:</span> {mission.contact_pickup_phone}</p>}
                      {mission.contact_pickup_email && <p><span className="font-medium">Email:</span> {mission.contact_pickup_email}</p>}
                    </div> : <p className="text-gray-500">Aucun contact spécifié</p>}
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Contact livraison</h4>
                  {mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email ? <div className="space-y-1">
                      {mission.contact_delivery_name && <p><span className="font-medium">Nom:</span> {mission.contact_delivery_name}</p>}
                      {mission.contact_delivery_phone && <p><span className="font-medium">Téléphone:</span> {mission.contact_delivery_phone}</p>}
                      {mission.contact_delivery_email && <p><span className="font-medium">Email:</span> {mission.contact_delivery_email}</p>}
                    </div> : <p className="text-gray-500">Aucun contact spécifié</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Informations véhicule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mission.vehicle_category && <div>
                  <h4 className="text-sm font-medium text-gray-500">Catégorie</h4>
                  <p>{vehicleCategory}</p>
                </div>}
              {mission.vehicle_make && <div>
                  <h4 className="text-sm font-medium text-gray-500">Marque</h4>
                  <p>{mission.vehicle_make}</p>
                </div>}
              {mission.vehicle_model && <div>
                  <h4 className="text-sm font-medium text-gray-500">Modèle</h4>
                  <p>{mission.vehicle_model}</p>
                </div>}
              {mission.vehicle_registration && <div>
                  <h4 className="text-sm font-medium text-gray-500">Immatriculation</h4>
                  <p>{mission.vehicle_registration}</p>
                </div>}
              {mission.vehicle_vin && <div>
                  <h4 className="text-sm font-medium text-gray-500">VIN</h4>
                  <p>{mission.vehicle_vin}</p>
                </div>}
              {mission.vehicle_fuel && <div>
                  <h4 className="text-sm font-medium text-gray-500">Carburant</h4>
                  <p>{mission.vehicle_fuel}</p>
                </div>}
              {mission.vehicle_year && <div>
                  <h4 className="text-sm font-medium text-gray-500">Année</h4>
                  <p>{mission.vehicle_year}</p>
                </div>}
            </div>
          </CardContent>
        </Card>
        
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