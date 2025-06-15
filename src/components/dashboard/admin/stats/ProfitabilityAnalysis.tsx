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
      {/* Profitability Matrix */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Matrice de rentabilité (Missions vs Profitabilité)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="x" name="Missions" label={{
                value: 'Nombre de missions',
                position: 'insideBottom',
                offset: -10
              }} />
                <YAxis type="number" dataKey="y" name="Rentabilité" label={{
                value: 'Rentabilité (%)',
                angle: -90,
                position: 'insideLeft'
              }} />
                <Tooltip cursor={{
                strokeDasharray: '3 3'
              }} content={({
                active,
                payload
              }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return <div className="bg-white p-2 border rounded shadow">
                          <p className="font-medium">{data.category}</p>
                          <p>Missions: {data.x}</p>
                          <p>Rentabilité: {data.y.toFixed(1)}%</p>
                          <p>CA: {formatCurrency(data.revenue)}</p>
                        </div>;
                }
                return null;
              }} />
                <Scatter data={scatterData} fill="#3b82f6" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profitability Table */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Analyse détaillée de la marge chauffeur</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>;
};