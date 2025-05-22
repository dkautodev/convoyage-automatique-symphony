
import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Mission } from '@/types/supabase';
import { formatClientName, formatMissionNumber, formatPrice } from '@/utils/missionUtils';
import GenerateInvoiceButton from './GenerateInvoiceButton';

export interface InvoicesTableProps {
  missions: Mission[];
  clientsData: Record<string, any>;
  isLoading?: boolean;
  userRole?: string;
  clientData?: any;
  onMissionStatusUpdate?: () => void;
}

const InvoicesTable: React.FC<InvoicesTableProps> = ({ 
  missions, 
  clientsData = {},
  isLoading = false,
  userRole = 'admin'
}) => {
  if (isLoading) {
    return <div className="py-4 text-center">Chargement des factures...</div>;
  }
  
  if (missions.length === 0) {
    return <div className="py-4 text-center">Aucune facture disponible</div>;
  }

  return (
    <div className="w-full">
      <Table>
        <TableCaption>Liste des missions facturables.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Mission N°</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {missions.map((mission) => {
            const client = clientsData[mission.client_id];
            return (
              <TableRow key={mission.id}>
                <TableCell className="font-medium">{formatMissionNumber(mission)}</TableCell>
                <TableCell>{formatClientName(mission, clientsData)}</TableCell>
                <TableCell>{formatPrice(mission.price_ttc)}</TableCell>
                <TableCell className="text-right">
                  <GenerateInvoiceButton mission={mission} client={client} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default InvoicesTable;
