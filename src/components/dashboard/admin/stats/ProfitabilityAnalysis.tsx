import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/statsUtils";
import { CategoryPerformance, CATEGORY_LABELS, CATEGORY_COLORS, VehicleCategory } from "@/types/advancedStats";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
interface ProfitabilityAnalysisProps {
  categoryPerformances: CategoryPerformance[];
  loading: boolean;
}
export const ProfitabilityAnalysis: React.FC<ProfitabilityAnalysisProps> = ({
  categoryPerformances,
  loading
}) => {
  // Ajout: calculons la valeur "paie chauffeur" pour chaque catégorie à partir de la profitabilité et du CA
  // profitabilité = (CA - paie chauffeur) / CA * 100 donc paie chauffeur = CA - (profitabilité * CA / 100)
  // Pourcentage de rentabilité peut-être négatif !
  const performancesWithChauffeurPay = categoryPerformances.map(perf => {
    const chauffeurPay = perf.totalRevenue - perf.totalRevenue * perf.profitability / 100;
    return {
      ...perf,
      chauffeurPay
    };
  });
  const scatterData = performancesWithChauffeurPay.map(perf => ({
    x: perf.totalMissions,
    y: perf.profitability,
    category: CATEGORY_LABELS[perf.category as VehicleCategory] || perf.category,
    revenue: perf.totalRevenue,
    color: CATEGORY_COLORS[perf.category as VehicleCategory]
  }));
  const getRentabilityStatus = (profitability: number) => {
    if (profitability >= 20) return {
      status: "Excellente",
      color: "bg-green-500",
      icon: TrendingUp
    };
    if (profitability >= 10) return {
      status: "Bonne",
      color: "bg-blue-500",
      icon: TrendingUp
    };
    if (profitability >= 0) return {
      status: "Correcte",
      color: "bg-yellow-500",
      icon: Minus
    };
    return {
      status: "Faible",
      color: "bg-red-500",
      icon: TrendingDown
    };
  };
  if (loading) {
    return <Card className="bg-white">
        <CardContent className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
    {/* Profitability Table */}
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>
          Analyse détaillée <span className="hidden sm:inline">de la marge chauffeur</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop: Table */}
        <div className="sm:block hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Missions</TableHead>
                <TableHead className="text-right">CA Total</TableHead>
                <TableHead className="text-right">Paie Chauffeur</TableHead>
                <TableHead className="text-right">Rentabilité</TableHead>
                <TableHead className="text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performancesWithChauffeurPay.sort((a, b) => b.profitability - a.profitability).map(perf => {
                const status = getRentabilityStatus(perf.profitability);
                const StatusIcon = status.icon;
                return <TableRow key={perf.category}>
                  <TableCell className="font-medium">
                    {CATEGORY_LABELS[perf.category as VehicleCategory] || perf.category}
                  </TableCell>
                  <TableCell className="text-right">{perf.totalMissions}</TableCell>
                  <TableCell className="text-right">{formatCurrency(perf.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(perf.chauffeurPay)}</TableCell>
                  <TableCell className="text-right">
                    <span className={perf.profitability >= 0 ? "text-green-600" : "text-red-600"}>
                      {perf.profitability.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className={`${status.color} text-white`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.status}
                    </Badge>
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </div>
        {/* Mobile: Cards */}
        <div className="sm:hidden flex flex-col gap-3">
          {performancesWithChauffeurPay
            .sort((a, b) => b.profitability - a.profitability)
            .map(perf => {
              const status = getRentabilityStatus(perf.profitability);
              const StatusIcon = status.icon;
              return (
                <div key={perf.category} className="rounded shadow-sm p-3 border flex flex-col gap-1 bg-white">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {CATEGORY_LABELS[perf.category as VehicleCategory] || perf.category}
                    </span>
                    <Badge variant="secondary" className={`${status.color} text-white flex items-center`}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap text-xs gap-x-4 gap-y-1 mt-2">
                    <span>Missions&nbsp;: <b>{perf.totalMissions}</b></span>
                    <span>CA&nbsp;: <b>{formatCurrency(perf.totalRevenue)}</b></span>
                    <span>Paie&nbsp;: <b>{formatCurrency(perf.chauffeurPay)}</b></span>
                    <span>Renta. :&nbsp;
                      <b className={perf.profitability >= 0 ? "text-green-600" : "text-red-600"}>
                        {perf.profitability.toFixed(1)}%
                      </b>
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  </div>;
};
