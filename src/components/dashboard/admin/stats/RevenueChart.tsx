
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/utils/statsUtils";

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  vat: number;
  driverPayments: number;
  total_ht: number;
}

interface RevenueChartProps {
  year: number;
  loading: boolean;
  monthlyData: MonthlyData[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  year,
  loading,
  monthlyData,
}) => {
  const isMobile = useIsMobile();

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Chiffre d'affaires, TVA, Paiements chauffeurs</CardTitle>
        <CardDescription>
          Données par mois pour l'année {year}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-700"></div>
          </div>
        ) : (
          <div className={isMobile ? "h-60" : "h-96"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="revenue" name="Chiffre d'affaires HT" fill="#3b82f6" />
                <Bar dataKey="vat" name="TVA" fill="#8b5cf6" />
                <Bar dataKey="driverPayments" name="Paiements chauffeurs" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
