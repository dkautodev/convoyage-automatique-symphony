
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryData, FilterState, CategoryPerformance, MonthlyBreakdown, VEHICLE_CATEGORIES, CATEGORY_LABELS, VehicleCategory } from "@/types/advancedStats";
import { months } from "@/utils/statsUtils";

export const useAdvancedStats = (year: number, filters?: Partial<FilterState>) => {
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [monthlyBreakdowns, setMonthlyBreakdowns] = useState<MonthlyBreakdown[]>([]);
  const [categoryPerformances, setCategoryPerformances] = useState<CategoryPerformance[]>([]);

  const fetchAdvancedStats = async (selectedYear: number) => {
    setLoading(true);

    let query = supabase
      .from("missions")
      .select(`
        *,
        vehicle_category,
        chauffeur_id,
        client_id,
        price_ht,
        price_ttc,
        chauffeur_price_ht
      `)
      .eq('status', 'termine')
      .gte("created_at", `${selectedYear}-01-01T00:00:00.000Z`)
      .lte("created_at", `${selectedYear}-12-31T23:59:59.999Z`);

    // Correction TS2345
    if (filters?.categories && filters.categories.length > 0) {
      query = query.in('vehicle_category', filters.categories as VehicleCategory[]);
    }
    if (filters?.clients && filters.clients.length > 0) {
      query = query.in('client_id', filters.clients);
    }
    if (filters?.drivers && filters.drivers.length > 0) {
      query = query.in('chauffeur_id', filters.drivers);
    }

    const { data: missions, error } = await query;

    if (error) {
      console.error("Error fetching advanced stats:", error);
      setLoading(false);
      return;
    }

    if (!missions || missions.length === 0) {
      setCategoryData([]);
      setMonthlyBreakdowns([]);
      setCategoryPerformances([]);
      setLoading(false);
      return;
    }

    // Process data by category and month
    const categoryStats: Record<string, CategoryData> = {};
    const monthlyStats: Record<string, MonthlyBreakdown> = {};

    // Initialize monthly breakdowns
    months.forEach(month => {
      monthlyStats[month] = {
        month,
        categories: [],
        total: { revenue: 0, vat: 0, driverPayments: 0, missionsCount: 0 }
      };
    });

    missions.forEach((mission: any) => {
      const date = new Date(mission.created_at);
      const monthName = months[date.getMonth()];
      const category: VehicleCategory = (mission.vehicle_category || 'citadine') as VehicleCategory;
      const vat = (mission.price_ttc || 0) - (mission.price_ht || 0);
      const profitMargin = (mission.price_ht || 0) - (mission.chauffeur_price_ht || 0);

      const key = `${category}-${monthName}`;

      if (!categoryStats[key]) {
        categoryStats[key] = {
          category,
          month: monthName,
          year: selectedYear,
          revenue: 0,
          vat: 0,
          driverPayments: 0,
          missionsCount: 0,
          averagePrice: 0,
          profitMargin: 0
        };
      }

      categoryStats[key].revenue += mission.price_ht || 0;
      categoryStats[key].vat += vat;
      categoryStats[key].driverPayments += mission.chauffeur_price_ht || 0;
      categoryStats[key].missionsCount += 1;
      categoryStats[key].profitMargin += profitMargin;

      // Update monthly totals
      monthlyStats[monthName].total.revenue += mission.price_ht || 0;
      monthlyStats[monthName].total.vat += vat;
      monthlyStats[monthName].total.driverPayments += mission.chauffeur_price_ht || 0;
      monthlyStats[monthName].total.missionsCount += 1;
    });

    // Calculate average prices
    Object.values(categoryStats).forEach((stat) => {
      if (stat.missionsCount > 0) {
        stat.averagePrice = stat.revenue / stat.missionsCount;
      }
    });

    // Group by month for monthly breakdowns
    months.forEach(month => {
      const monthCategories = Object.values(categoryStats).filter(
        (stat) => (stat as CategoryData).month === month
      ) as CategoryData[];
      monthlyStats[month].categories = monthCategories;
    });

    setCategoryData(Object.values(categoryStats) as CategoryData[]);
    setMonthlyBreakdowns(Object.values(monthlyStats));

    // Correction TS2448 et TS2339 (déclaration + typage explicite)
    const performances: CategoryPerformance[] = VEHICLE_CATEGORIES.map(category => {
      const stats = Object.values(categoryStats).filter(
        (stat) => (stat as CategoryData).category === category
      ) as CategoryData[];
      const totalRevenue = stats.reduce((sum, stat) => sum + stat.revenue, 0);
      const totalMissions = stats.reduce((sum, stat) => sum + stat.missionsCount, 0);
      const totalProfitMargin = stats.reduce((sum, stat) => sum + stat.profitMargin, 0);

      return {
        category,
        totalRevenue,
        totalMissions,
        averageRevenue: totalMissions > 0 ? totalRevenue / totalMissions : 0,
        profitability: totalRevenue > 0 ? (totalProfitMargin / totalRevenue) * 100 : 0,
        growth: 0 // TODO: Calculer la croissance annuelle si besoin
      };
    });

    setCategoryPerformances(performances);
    setLoading(false);
  };

  useEffect(() => {
    fetchAdvancedStats(year);
  }, [year, filters]);

  const categoryTotals = useMemo(() => {
    return VEHICLE_CATEGORIES.reduce((acc, category) => {
      const stats = categoryData.filter(data => data.category === category);
      acc[category] = {
        revenue: stats.reduce((sum, stat) => sum + stat.revenue, 0),
        missions: stats.reduce((sum, stat) => sum + stat.missionsCount, 0),
        profitMargin: stats.reduce((sum, stat) => sum + stat.profitMargin, 0)
      };
      return acc;
    }, {} as Record<string, { revenue: number; missions: number; profitMargin: number }>);
  }, [categoryData]);

  return {
    loading,
    categoryData,
    monthlyBreakdowns,
    categoryPerformances,
    categoryTotals
  };
};
