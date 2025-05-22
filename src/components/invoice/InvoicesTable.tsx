
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mission, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { formatMissionNumber, formatClientName } from '@/utils/missionUtils';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Check, X, FileText, Eye } from 'lucide-react';
import GenerateInvoiceButton from './GenerateInvoiceButton';
import { Card } from '@/components/ui/card';

interface InvoicesTableProps {
  missions: Mission[];
  clientsData?: Record<string, any>;
  clientData?: any;
  isLoading?: boolean;
  userRole: 'admin' | 'client' | 'chauffeur';
  onMissionStatusUpdate?: () => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({
  missions,
  clientsData = {},
  clientData,
  isLoading = false,
  userRole,
  onMissionStatusUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedMission, setSelectedMission] = React.useState<Mission | null>(null);

  if (isLoading) {
    return <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-700"></div>
      </div>;
  }
  
  if (missions.length === 0) {
    return <div className="text-center py-8 text-neutral-500">
        <p className="font-medium">Aucune mission à facturer</p>
      </div>;
  }

  // Format price for display
  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  };

  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Non spécifiée';
    return new Date(dateStr).toLocaleDateString('fr-FR');
  };

  // Toggle mission status between 'livre' and 'termine'
  const toggleMissionStatus = async (mission: Mission) => {
    if (!mission) return;
    
    const newStatus = mission.status === 'livre' ? 'termine' : 'livre';
    
    try {
      const { error } = await supabase
        .from('missions')
        .update({ status: newStatus })
        .eq('id', mission.id);
      
      if (error) throw error;
      
      // Show success message
      toast.success(
        `Mission ${formatMissionNumber(mission)} ${newStatus === 'termine' ? 'marquée comme payée' : 'marquée à payer'}`
      );
      
      // Call the callback to refresh missions list
      if (onMissionStatusUpdate) {
        onMissionStatusUpdate();
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      toast.error("Erreur lors de la mise à jour du statut");
    }
    
    setIsDialogOpen(false);
    setSelectedMission(null);
  };

  // Handle button click based on mission status
  const handleStatusButtonClick = (mission: Mission) => {
    if (mission.status === 'termine') {
      // Show confirmation dialog before changing to 'livre'
      setSelectedMission(mission);
      setIsDialogOpen(true);
    } else {
      // Directly change from 'livre' to 'termine'
      toggleMissionStatus(mission);
    }
  };

  // Custom status display for invoices page
  const getInvoiceStatusLabel = (status: string) => {
    return status === 'livre' ? 'À payer' : 'Payé';
  };

  // Custom status color for invoices page
  const getInvoiceStatusColor = (status: string) => {
    return status === 'livre' ? 'bg-red-600 text-white' : 'bg-green-700 text-white';
  };

  // Truncate text if too long
  const truncateText = (text: string, maxLength: number = 20) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  };

  return (
    <>
      <div className="space-y-4">
        {missions.map(mission => (
          <Card key={mission.id} className="p-4">
            {/* Line 1: Mission Number + Generate Invoice Button */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-base">#{formatMissionNumber(mission)}</h3>
              <div>
                {userRole === 'admin' ? (
                  <GenerateInvoiceButton 
                    mission={mission} 
                    client={clientsData[mission.client_id]} 
                    className="h-8 px-2 py-1 text-xs"
                  />
                ) : (
                  <GenerateInvoiceButton 
                    mission={mission} 
                    client={clientData} 
                    className="h-8 px-2 py-1 text-xs"
                  />
                )}
              </div>
            </div>
            
            {/* Line 2: Delivery Date + Client Name (Admin) + Payment Status */}
            <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
              <span className="text-gray-500">{mission.D2_LIV ? formatDate(mission.D2_LIV) : 'Livraison non spécifiée'}</span>
              {userRole === 'admin' && (
                <span className="text-gray-700 mx-1">• {truncateText(formatClientName(mission, clientsData))}</span>
              )}
              <Badge className={getInvoiceStatusColor(mission.status)}>
                {getInvoiceStatusLabel(mission.status)}
              </Badge>
            </div>
            
            {/* Line 3: Amount + Details/Action Button */}
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{formatPrice(mission.price_ttc)}</span>
              <div className="flex gap-2">
                {userRole === 'admin' ? (
                  <Button 
                    variant={mission.status === 'livre' ? 'default' : 'outline'} 
                    size="sm"
                    className="h-8 px-3 py-1 text-xs"
                    onClick={() => handleStatusButtonClick(mission)}
                    title={mission.status === 'livre' ? 'Marquer payé' : 'Marquer à payer'}
                  >
                    {mission.status === 'livre' ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        <span>Marquer payé</span>
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1" />
                        <span>Marquer à payer</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-3 py-1 text-xs"
                    asChild
                  >
                    <Link to={`/${userRole}/missions/${mission.id}`}>
                      <Eye className="h-3 w-3 mr-1" />
                      Détails
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir marquer cette mission à payer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedMission && toggleMissionStatus(selectedMission)}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InvoicesTable;
