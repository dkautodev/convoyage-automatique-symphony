
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/utils/statsUtils";
import { CategoryData, CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/advancedStats";
import { months } from "@/utils/statsUtils";

interface AnnualEvolutionByCategoryProps {
  categoryData: CategoryData[];
  loading: boolean;
}

export const AnnualEvolutionByCategory: React.FC<AnnualEvolutionByCategoryProps> = ({
  categoryData,
  loading
}) => {
  const chartData = months.map(month => {
    const monthData: any = { month };
    
    Object.keys(CATEGORY_LABELS).forEach(category => {
      const categoryStats = categoryData.find(
        data => data.category === category && data.month === month
      );
      monthData[category] = categoryStats?.revenue || 0;
    });
    
    return monthData;
  });

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
    <Card className="bg-white">
      <CardHeader>
        <CardTitle>Évolution annuelle du chiffre d'affaires par catégorie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]}
                  strokeWidth={2}
                  name={label}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
