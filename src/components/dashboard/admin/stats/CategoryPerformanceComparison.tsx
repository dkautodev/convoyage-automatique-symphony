
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatCurrency } from "@/utils/statsUtils";
import { CategoryPerformance, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/advancedStats";
import { useIsMobile } from "@/hooks/use-mobile";

interface CategoryPerformanceComparisonProps {
  categoryPerformances: CategoryPerformance[];
  loading: boolean;
}

export const CategoryPerformanceComparison: React.FC<CategoryPerformanceComparisonProps> = ({
  categoryPerformances,
  loading
}) => {
  const revenueData = categoryPerformances.map(perf => ({
    category: CATEGORY_LABELS[perf.category as keyof typeof CATEGORY_LABELS] || perf.category,
    revenue: perf.totalRevenue,
    missions: perf.totalMissions,
    averageRevenue: perf.averageRevenue,
    profitability: perf.profitability
  }));

  const pieData = categoryPerformances
    .filter(perf => perf.totalRevenue > 0)
    .map(perf => ({
      name: CATEGORY_LABELS[perf.category as keyof typeof CATEGORY_LABELS] || perf.category,
      value: perf.totalRevenue,
      color: CATEGORY_COLORS[perf.category as keyof typeof CATEGORY_COLORS]
    }));

  const isMobile = useIsMobile();

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
      {/* Revenue Comparison */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Comparaison des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={isMobile ? "h-56" : "h-96"}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{
                top: isMobile ? 10 : 20,
                right: isMobile ? 5 : 30,
                left: isMobile ? 0 : 20,
                bottom: isMobile ? 10 : 20,
              }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={isMobile ? 0 : -45}
                  textAnchor={isMobile ? "middle" : "end"}
                  height={isMobile ? 28 : 100}
                  tick={{fontSize: isMobile ? 10 : 12}}
                  hide={isMobile && revenueData.length > 3}
                />
                <YAxis 
                  tickFormatter={value => formatCurrency(value)} 
                  tick={{fontSize: isMobile ? 10 : 12}} 
                  width={isMobile ? 36 : 60}
                />
                <Tooltip 
                  formatter={value => formatCurrency(Number(value))}
                  wrapperStyle={{ fontSize: isMobile ? 12 : 14, padding: isMobile ? 6 : 12 }}
                />
                <Legend wrapperStyle={{ fontSize: isMobile ? 11 : 13 }} />
                <Bar dataKey="revenue" name="CA" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      {/* Pie chart section responsive size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Répartition du CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={isMobile ? "h-48" : "h-80"}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={isMobile ? 48 : 80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={value => formatCurrency(Number(value))} wrapperStyle={{ fontSize: isMobile ? 12 : 14 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
