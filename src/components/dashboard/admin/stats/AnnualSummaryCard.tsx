
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/utils/statsUtils";

interface AnnualSummaryCardProps {
  year: number;
  totalRevenue: number;
  totalVat: number;
  totalDriverPayments: number;
}

export const AnnualSummaryCard: React.FC<AnnualSummaryCardProps> = ({
  year,
  totalRevenue,
  totalVat,
  totalDriverPayments,
}) => {
  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Résumé annuel {year}</CardTitle>
        <CardDescription>
          Chiffre d'affaires HT : <b>{formatCurrency(totalRevenue)}</b> | TVA collectée :{" "}
          <b>{formatCurrency(totalVat)}</b> | Paiements chauffeurs :{" "}
          <b>{formatCurrency(totalDriverPayments)}</b>
        </CardDescription>
      </CardHeader>
    </Card>
  );
};
