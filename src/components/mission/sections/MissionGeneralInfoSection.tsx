
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFullAddress, formatAddressDisplay } from '@/utils/missionUtils';
import { Mission } from '@/types/supabase';
import { Separator } from '@/components/ui/separator';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations générales</CardTitle>
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
              </div>
              <div>
                <h4 className="font-semibold">Adresse de livraison:</h4>
                <p className="text-gray-700">{formatFullAddress(mission.delivery_address)}</p>
              </div>
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
          <div className="md:col-span-2">
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
