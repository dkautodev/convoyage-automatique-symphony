
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    vat: number;
    driverPayments: number;
  }>;
}

const RevenueChart = ({ data }: RevenueChartProps) => {
  const isMobile = useIsMobile();
  
  // Format currency helper
  const formatCurrency = (value: number) => {
    return value.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    });
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{ 
          top: 20, 
          right: isMobile ? 10 : 30, 
          left: isMobile ? 0 : 20, 
          bottom: 20 
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{fontSize: isMobile ? 10 : 12}} />
        <YAxis tick={{fontSize: isMobile ? 10 : 12}} width={isMobile ? 40 : 60} />
        <Tooltip 
          formatter={(value) => [`${formatCurrency(Number(value))}`, '']}
          contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{fontSize: isMobile ? 10 : 12}} />
        <Bar dataKey="revenue" name="Chiffre d'affaires HT" fill="#3b82f6" />
        <Bar dataKey="vat" name="TVA" fill="#8b5cf6" />
        <Bar dataKey="driverPayments" name="Paiements chauffeurs" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default React.memo(RevenueChart);
