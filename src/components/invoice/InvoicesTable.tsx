import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mission } from '@/types/supabase';
import { formatMissionNumber, formatClientName } from '@/utils/missionUtils';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from 'sonner';
import { Check, X, Eye } from 'lucide-react';
import GenerateInvoiceButton from './GenerateInvoiceButton';
interface InvoicesTableProps {
  missions: Mission[];
  clientsData?: Record<string, any>;
  clientData?: any;
  isLoading?: boolean;
  userRole: 'admin' | 'client' | 'chauffeur';
  onMissionStatusUpdate?: () => void;
  layout?: 'table' | 'stacked';
}
const InvoicesTable: React.FC<InvoicesTableProps> = ({
  missions,
  clientsData = {},
  clientData,
  isLoading = false,
  userRole,
  onMissionStatusUpdate,
  layout = 'table'
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
      const {
        error
      } = await supabase.from('missions').update({
        status: newStatus
      }).eq('id', mission.id);
      if (error) throw error;

      // Show success message
      toast.success(`Mission ${formatMissionNumber(mission)} ${newStatus === 'termine' ? 'marquée comme payée' : 'marquée à payer'}`);

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

  // Stacked layout for mobile devices
  if (layout === 'stacked') {
    return <>
        <div className="space-y-4">
          {missions.map(mission => <div key={mission.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <div className="space-y-3 py-[3px] my-[15px] px-[20px]">
                {/* Row 1: Mission number + Status badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{formatMissionNumber(mission)}</span>
                    <Badge className={`${getInvoiceStatusColor(mission.status)} text-xs px-2 py-1`}>
                      {getInvoiceStatusLabel(mission.status)}
                    </Badge>
                  </div>
                  <GenerateInvoiceButton mission={mission} client={userRole === 'admin' ? clientsData[mission.client_id] : clientData} className="h-8 w-8 p-0" />
                </div>
                
                {/* Row 2: Client name (only for admin) */}
                {userRole === 'admin' && <div className="text-sm text-gray-600">
                    {formatClientName(mission, clientsData)}
                  </div>}
                
                {/* Row 3: Date */}
                <div className="text-xs text-gray-500">
                  {mission.D2_LIV ? formatDate(mission.D2_LIV) : 'Date inconnue'}
                </div>
                
                {/* Row 4: Amount + Actions */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-lg">
                    {formatPrice(mission.price_ttc)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="h-8 w-8 p-0">
                      <Link to={`/${userRole}/missions/${mission.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    {userRole === 'admin' && <Button variant={mission.status === 'livre' ? 'default' : 'outline'} size="sm" onClick={() => handleStatusButtonClick(mission)} className="h-8 px-2 text-xs">
                        {mission.status === 'livre' ? <><Check className="h-3 w-3 mr-1" /> Payer</> : <><X className="h-3 w-3 mr-1" /> Impayé</>}
                      </Button>}
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer le changement</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir marquer cette mission à payer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
              <AlertDialogAction className="w-full sm:w-auto" onClick={() => selectedMission && toggleMissionStatus(selectedMission)}>
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>;
  }

  // Table layout for larger screens
  return <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Numéro</TableHead>
            <TableHead>Date liv.</TableHead>
            {userRole === 'admin' && <TableHead>Client</TableHead>}
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Montant (TTC)</TableHead>
            <TableHead className="text-center">Facture</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missions.map(mission => <TableRow key={mission.id}>
              <TableCell className="font-medium">#{formatMissionNumber(mission)}</TableCell>
              <TableCell>{mission.D2_LIV ? formatDate(mission.D2_LIV) : 'Non spécifiée'}</TableCell>
              {userRole === 'admin' && <TableCell>{formatClientName(mission, clientsData)}</TableCell>}
              <TableCell>
                <Badge className={getInvoiceStatusColor(mission.status)}>
                  {getInvoiceStatusLabel(mission.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatPrice(mission.price_ttc)}
              </TableCell>
              <TableCell className="text-center">
                <GenerateInvoiceButton mission={mission} client={userRole === 'admin' ? clientsData[mission.client_id] : clientData} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="icon" asChild title="Voir les détails">
                    <Link to={`/${userRole}/missions/${mission.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  {userRole === 'admin' && <Button variant={mission.status === 'livre' ? 'default' : 'outline'} size="icon" onClick={() => handleStatusButtonClick(mission)} title={mission.status === 'livre' ? 'Marquer payé' : 'Marquer à payer'}>
                      {mission.status === 'livre' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>}
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>

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
    </>;
};
export default InvoicesTable;