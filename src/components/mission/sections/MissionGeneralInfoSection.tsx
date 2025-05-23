import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFullAddress, formatAddressDisplay } from '@/utils/missionUtils';
import { Mission } from '@/types/supabase';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, Clock, Truck, Info, FileText, Ban } from 'lucide-react';
import { GenerateMissionSheetButton } from '@/components/mission/GenerateMissionSheetButton';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth';
import { typedSupabase } from '@/types/database';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface MissionGeneralInfoSectionProps {
  mission: Mission;
  client?: any;
  driverName: string;
  adminProfile?: any;
  hideFinancials?: boolean;
  refetchMission?: () => void;
}

export const MissionGeneralInfoSection: React.FC<MissionGeneralInfoSectionProps> = ({
  mission,
  client,
  driverName,
  adminProfile,
  hideFinancials = false,
  refetchMission
}) => {
  const { user, profile } = useAuth();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isClient = profile?.role === 'client';
  const isAdmin = profile?.role === 'admin';
  const showCancelButton = mission.status === 'en_acceptation' && isClient && user?.id === mission.client_id;

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
  
  // Fonction pour ouvrir la boîte de dialogue de confirmation
  const openCancelDialog = () => {
    if (!mission || mission.status !== 'en_acceptation') {
      toast.error('Seuls les devis en cours d\'acceptation peuvent être annulés');
      return;
    }
    setCancelDialogOpen(true);
  };

  // Fonction pour annuler le devis après confirmation
  const handleCancelQuote = async () => {
    if (cancelling || !mission) return;
    if (mission.status !== 'en_acceptation') {
      toast.error('Seuls les devis en cours d\'acceptation peuvent être annulés');
      return;
    }

    try {
      setCancelling(true);
      const { error } = await typedSupabase
        .from('missions')
        .update({ status: 'annule' })
        .eq('id', mission.id);
      
      if (error) {
        throw error;
      }
      
      toast.success('Le devis a été annulé avec succès');
      if (refetchMission) {
        refetchMission();
      }
      setCancelDialogOpen(false);
    } catch (error: any) {
      console.error('Erreur lors de l\'annulation du devis:', error);
      toast.error(`Erreur: ${error.message || 'Impossible d\'annuler le devis'}`);
    } finally {
      setCancelling(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Informations générales</CardTitle>
        <div className="flex gap-2">
          {/* Bouton de génération de fiche mission - pour tous les utilisateurs */}
          <GenerateMissionSheetButton mission={mission} driverName={driverName} />
          
          {/* Bouton de génération de devis - pour admin et clients seulement */}
          {!hideFinancials && (isAdmin || isClient) && (
            <GenerateQuoteButton mission={mission} client={client} adminProfile={adminProfile} />
          )}
          
          {/* Bouton d'annulation de devis - seulement pour les clients et pour les missions en acceptation */}
          {showCancelButton && (
            <Button onClick={openCancelDialog} disabled={cancelling} variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              {cancelling ? 'Annulation...' : 'Annuler le devis'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Information blocks at the top in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Client - Only show if not hideFinancials (i.e., not a driver) */}
          {!hideFinancials && client && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Client</h3>
              <p className="text-lg font-medium">{client.company_name || client.full_name || "Non spécifié"}</p>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Type de mission</h3>
            <p className="text-lg font-medium">{mission.mission_type || "Non spécifié"}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Catégorie de véhicule</h3>
            <p className="text-lg font-medium">
              {mission.vehicle_category ? mission.vehicle_category.replace(/_/g, ' ').toLocaleUpperCase() : 'Non spécifié'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Distance</h3>
            <p className="text-lg font-medium">{mission.distance_km.toFixed(2)} km</p>
          </div>
          
          {/* Financial info - Only show if not hideFinancials */}
          {!hideFinancials && (
            <>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prix HT</h3>
                <p className="text-lg font-medium">{formatPrice(mission.price_ht)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Prix TTC</h3>
                <p className="text-lg font-medium">{formatPrice(mission.price_ttc)}</p>
              </div>
            </>
          )}
        </div>
        
        <Separator />
        
        {/* Addresses section */}
        <div>
          <h3 className="font-bold text-lg mb-4 flex items-center">
            <MapPin className="mr-2 h-5 w-5" />
            Adresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold">Adresse de départ</h4>
              <p className="text-gray-700">{formatFullAddress(mission.pickup_address)}</p>
              
              {/* Contact pickup information */}
              {mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email ? (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-medium">Contact départ</p>
                  <p>{mission.contact_pickup_name}</p>
                  {mission.contact_pickup_phone && <p>{mission.contact_pickup_phone}</p>}
                  {mission.contact_pickup_email && <p>{mission.contact_pickup_email}</p>}
                </div>
              ) : null}
            </div>
            <div>
              <h4 className="font-semibold">Adresse de livraison</h4>
              <p className="text-gray-700">{formatFullAddress(mission.delivery_address)}</p>
              
              {/* Contact delivery information */}
              {mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email ? (
                <div className="mt-2 pt-2 border-t">
                  <p className="font-medium">Contact livraison</p>
                  <p>{mission.contact_delivery_name}</p>
                  {mission.contact_delivery_phone && <p>{mission.contact_delivery_phone}</p>}
                  {mission.contact_delivery_email && <p>{mission.contact_delivery_email}</p>}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Vehicle information section if available */}
        {(mission.vehicle_make || mission.vehicle_model || mission.vehicle_registration) && (
          <>
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <Truck className="mr-2 h-5 w-5" />
                Informations véhicule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mission.vehicle_make && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Marque</h4>
                    <p className="text-lg font-medium">{mission.vehicle_make}</p>
                  </div>
                )}
                
                {mission.vehicle_model && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Modèle</h4>
                    <p className="text-lg font-medium">{mission.vehicle_model}</p>
                  </div>
                )}
                
                {mission.vehicle_year && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Année</h4>
                    <p className="text-lg font-medium">{mission.vehicle_year}</p>
                  </div>
                )}
                
                {mission.vehicle_fuel && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Carburant</h4>
                    <p className="text-lg font-medium">{mission.vehicle_fuel}</p>
                  </div>
                )}
                
                {mission.vehicle_registration && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Immatriculation</h4>
                    <p className="text-lg font-medium">{mission.vehicle_registration}</p>
                  </div>
                )}
                
                {mission.vehicle_vin && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">VIN</h4>
                    <p className="text-lg font-medium">{mission.vehicle_vin}</p>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
          </>
        )}
        
        {/* Dates and time slots */}
        {(mission.D1_PEC || mission.D2_LIV || mission.H1_PEC || mission.H1_LIV) && (
          <>
            <div>
              <h3 className="font-bold text-lg mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Dates et créneaux
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(mission.D1_PEC || mission.H1_PEC) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date départ</h4>
                    <p className="text-lg font-medium">{formatTimeSlot(mission.D1_PEC, mission.H1_PEC, mission.H2_PEC)}</p>
                  </div>
                )}
                
                {(mission.D2_LIV || mission.H1_LIV) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Date livraison</h4>
                    <p className="text-lg font-medium">{formatTimeSlot(mission.D2_LIV, mission.H1_LIV, mission.H2_LIV)}</p>
                  </div>
                )}
              </div>
            </div>
            
            <Separator />
          </>
        )}
        
        {/* Notes section if available */}
        {mission.notes && (
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Notes complémentaires
            </h3>
            <p className="whitespace-pre-wrap">{mission.notes}</p>
          </div>
        )}
      </CardContent>

      {/* Boîte de dialogue de confirmation pour l'annulation */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler le devis</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Une fois le devis annulé, il ne pourra plus être modifié.
              Voulez-vous vraiment annuler ce devis ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancelQuote} 
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelling}
            >
              {cancelling ? 'Annulation en cours...' : 'Confirmer l\'annulation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
