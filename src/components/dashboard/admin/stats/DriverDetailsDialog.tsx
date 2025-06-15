
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/utils/statsUtils";

interface DriverPayment {
  driver: string;
  month: string;
  year: number;
  total: number;
}

interface DriverDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string | null;
  year: number;
  driverPayments: DriverPayment[];
}

export const DriverDetailsDialog: React.FC<DriverDetailsDialogProps> = ({
  open,
  onOpenChange,
  month,
  year,
  driverPayments,
}) => {
  const filteredPayments = month 
    ? driverPayments.filter((p) => p.month === month)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Détail des paiements pour {month} {year}
          </DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chauffeur</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow key={payment.driver + payment.month}>
                  <TableCell>{payment.driver}</TableCell>
                  <TableCell>{formatCurrency(payment.total)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
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
