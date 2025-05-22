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

interface InvoicesTableProps {
  missions: Mission[];
  clientsData: Record<string, any>;
}

// Update GenerateInvoiceButtonProps to include className if needed
const InvoicesTable: React.FC<InvoicesTableProps> = ({ missions, clientsData }) => {
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
