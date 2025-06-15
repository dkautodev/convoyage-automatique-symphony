
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { formatCurrency } from "@/utils/statsUtils";
import { MonthlyBreakdown, CATEGORY_LABELS } from "@/types/advancedStats";

interface MonthlyBreakdownByCategoryProps {
  monthlyBreakdowns: MonthlyBreakdown[];
  loading: boolean;
}

export const MonthlyBreakdownByCategory: React.FC<MonthlyBreakdownByCategoryProps> = ({
  monthlyBreakdowns,
  loading
}) => {
  if (loading) {
    return (
      <Card className="bg-white">
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {monthlyBreakdowns.map(monthData => (
        <Card key={monthData.month} className="bg-white">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Détail par catégorie - {monthData.month}</span>
              <span className="text-sm font-normal text-muted-foreground">
                Total: {formatCurrency(monthData.total.revenue)} | {monthData.total.missionsCount} missions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.categories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">Missions</TableHead>
                    <TableHead className="text-right">CA HT</TableHead>
                    <TableHead className="text-right">Prix moyen</TableHead>
                    <TableHead className="text-right">Marge</TableHead>
                    <TableHead className="text-right">Rentabilité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthData.categories.map(category => {
                    const profitabilityPercent = category.revenue > 0 
                      ? (category.profitMargin / category.revenue) * 100 
                      : 0;

                    return (
                      <TableRow key={category.category}>
                        <TableCell className="font-medium">
                          {CATEGORY_LABELS[category.category as keyof typeof CATEGORY_LABELS] || category.category}
                        </TableCell>
                        <TableCell className="text-right">{category.missionsCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.averagePrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.profitMargin)}</TableCell>
                        <TableCell className="text-right">
                          <span className={profitabilityPercent >= 0 ? "text-green-600" : "text-red-600"}>
                            {profitabilityPercent.toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune mission pour ce mois
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
