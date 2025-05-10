import React from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Mission, missionStatusLabels, missionStatusColors } from '@/types/supabase';
import { formatMissionNumber, formatClientName } from '@/utils/missionUtils';
interface InvoicesTableProps {
  missions: Mission[];
  clientsData?: Record<string, any>;
  isLoading?: boolean;
  userRole: 'admin' | 'client' | 'chauffeur';
}
const InvoicesTable: React.FC<InvoicesTableProps> = ({
  missions,
  clientsData = {},
  isLoading = false,
  userRole
}) => {
  if (isLoading) {
    return <div className="flex justify-center py-8">
        <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-${userRole}`}></div>
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
  return <Table>
      
      <TableHeader>
        <TableRow>
          <TableHead>Numéro</TableHead>
          <TableHead>Date</TableHead>
          {userRole === 'admin' && <TableHead>Client</TableHead>}
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Montant (TTC)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {missions.map(mission => <TableRow key={mission.id}>
            <TableCell className="font-medium">#{formatMissionNumber(mission)}</TableCell>
            <TableCell>{formatDate(mission.created_at)}</TableCell>
            {userRole === 'admin' && <TableCell>{formatClientName(mission, clientsData)}</TableCell>}
            <TableCell>
              <Badge className={missionStatusColors[mission.status]}>
                {missionStatusLabels[mission.status]}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatPrice(mission.price_ttc)}
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/${userRole}/missions/${mission.id}`}>
                  Détails
                </Link>
              </Button>
            </TableCell>
          </TableRow>)}
      </TableBody>
    </Table>;
};
export default InvoicesTable;