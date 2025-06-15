
import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, months } from "@/utils/statsUtils";

interface DriverPayment {
  driver: string;
  month: string;
  year: number;
  total: number;
}

interface DriverPaymentsTableProps {
  driverPayments: DriverPayment[];
  onDetailsClick: (month: string) => void;
}

export const DriverPaymentsTable: React.FC<DriverPaymentsTableProps> = ({
  driverPayments,
  onDetailsClick,
}) => {
  const monthlyDriverSummary = useMemo(() => {
    const summaryMap: Record<string, number> = {};

    driverPayments.forEach((payment) => {
      summaryMap[payment.month] = (summaryMap[payment.month] || 0) + payment.total;
    });

    return months.map((month) => ({
      month: month,
      total: summaryMap[month] || 0,
    }));
  }, [driverPayments]);

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Paiements chauffeurs par mois</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mois</TableHead>
              <TableHead>Total (HT)</TableHead>
              <TableHead>Détail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyDriverSummary.map((row) => (
              <TableRow key={row.month}>
                <TableCell>{row.month}</TableCell>
                <TableCell>{formatCurrency(row.total)}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    onClick={() => onDetailsClick(row.month)}
                    disabled={row.total === 0}
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
