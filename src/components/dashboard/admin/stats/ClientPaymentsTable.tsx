
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, months } from "@/utils/statsUtils";

interface ClientPayment {
  client: string;
  month: string;
  year: number;
  total: number;
  vat: number;
  total_ht: number;
}

interface ClientPaymentsTableProps {
  clientPayments: ClientPayment[];
  onDetailsClick: (month: string) => void;
}

export const ClientPaymentsTable: React.FC<ClientPaymentsTableProps> = ({
  clientPayments,
  onDetailsClick,
}) => {
  const monthlyClientSummary = useMemo(() => {
    const summaryMap: Record<
      string,
      { total_ht: number; total_ttc: number; vat: number }
    > = {};

    clientPayments.forEach((payment) => {
      if (!summaryMap[payment.month]) {
        summaryMap[payment.month] = { total_ht: 0, total_ttc: 0, vat: 0 };
      }
      summaryMap[payment.month].total_ht += payment.total_ht;
      summaryMap[payment.month].total_ttc += payment.total;
      summaryMap[payment.month].vat += payment.vat;
    });

    return months.map((month) => ({
      month: month,
      total_ht: summaryMap[month]?.total_ht || 0,
      total_ttc: summaryMap[month]?.total_ttc || 0,
      vat: summaryMap[month]?.vat || 0,
    }));
  }, [clientPayments]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Paiements clients par mois (HT, TTC & TVA)</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Total HT</TableHead>
              <TableHead>Total TTC</TableHead>
              <TableHead>TVA collectée</TableHead>
              <TableHead>Détail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyClientSummary.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{formatCurrency(row.total_ht)}</TableCell>
                <TableCell>{formatCurrency(row.total_ttc)}</TableCell>
                <TableCell>{formatCurrency(row.vat)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => onDetailsClick(row.month)}
                    disabled={row.total_ttc === 0}
                  >
                    Voir le détail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
