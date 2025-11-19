
export interface CategoryData {
  category: string;
  month: string;
  year: number;
  revenue: number;
  vat: number;
  driverPayments: number;
  missionsCount: number;
  averagePrice: number;
  profitMargin: number;
}

export interface FilterState {
  categories: string[];
  period: 'month' | 'quarter' | 'year';
  clients: string[];
  drivers: string[];
  dateRange: { start: Date; end: Date };
}

export interface CategoryPerformance {
  category: string;
  totalRevenue: number;
  totalMissions: number;
  averageRevenue: number;
  profitability: number;
  growth: number;
}

export interface MonthlyBreakdown {
  month: string;
  categories: CategoryData[];
  total: {
    revenue: number;
    vat: number;
    driverPayments: number;
    missionsCount: number;
  };
}

export const VEHICLE_CATEGORIES = [
  'citadine',
  'berline', 
  '4x4_suv',
  'utilitaire_3_5m3',
  'utilitaire_6_12m3',
  'utilitaire_12_15m3',
  'utilitaire_15_20m3',
  'utilitaire_plus_20m3'
] as const;

export type VehicleCategory = typeof VEHICLE_CATEGORIES[number];

export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  citadine: 'Citadine (type 108)',
  berline: 'Berline (type 308)',
  '4x4_suv': '4x4 & SUV (type 3008)',
  'utilitaire_3_5m3': 'Utilitaire 3-5m3 (type Partner)',
  'utilitaire_6_12m3': 'Utilitaire 6-12m3 (type Boxer)',
  'utilitaire_12_15m3': 'Utilitaire 12-15m3 & Benne (type Master)',
  'utilitaire_15_20m3': 'Utilitaire 15-20m3 (type Iveco Daily)',
  'utilitaire_plus_20m3': 'Utilitaire + de 20m3 & Nacelle'
};

export const CATEGORY_COLORS: Record<VehicleCategory, string> = {
  citadine: '#3b82f6',
  berline: '#8b5cf6',
  '4x4_suv': '#f59e0b',
  utilitaire_3_5m3: '#10b981',
  utilitaire_6_12m3: '#ef4444',
  utilitaire_12_15m3: '#f97316',
  utilitaire_15_20m3: '#06b6d4',
  utilitaire_plus_20m3: '#8b5cf6'
};
