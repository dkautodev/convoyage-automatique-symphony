
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/utils/statsUtils";

interface ClientPayment {
  client: string;
  month: string;
  year: number;
  total: number;
  vat: number;
  total_ht: number;
}

interface ClientDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string | null;
  year: number;
  clientPayments: ClientPayment[];
}

export const ClientDetailsDialog: React.FC<ClientDetailsDialogProps> = ({
  open,
  onOpenChange,
  month,
  year,
  clientPayments,
}) => {
  const filteredPayments = month 
    ? clientPayments.filter((p) => p.month === month)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Détail des paiements clients pour {month} {year}
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Total HT</TableHead>
              <TableHead>Total TTC</TableHead>
              <TableHead>TVA collectée</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow key={payment.client + payment.month}>
                  <TableCell>{payment.client}</TableCell>
                  <TableCell>{formatCurrency(payment.total_ht)}</TableCell>
                  <TableCell>{formatCurrency(payment.total)}</TableCell>
                  <TableCell>{formatCurrency(payment.vat)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  Aucun paiement pour ce mois.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
};
