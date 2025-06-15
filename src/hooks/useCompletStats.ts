
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  vat: number;
  driverPayments: number;
  total_ht: number;
}

interface DriverPayment {
  driver: string;
  month: string;
  year: number;
  total: number;
}

interface ClientPayment {
  client: string;
  month: string;
  year: number;
  total: number;
  vat: number;
  total_ht: number;
}

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const useCompletStats = (year: number) => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const fetchYears = async () => {
    const { data } = await supabase.from("missions").select("created_at");
    const yearSet = new Set<number>();

    if (data) {
      data.forEach((mission: any) => {
        yearSet.add(new Date(mission.created_at).getFullYear());
      });
    }

    yearSet.add(2024);
    yearSet.add(new Date().getFullYear());

    setYears(Array.from(yearSet).sort((a, b) => b - a));
  };

  const fetchStats = async (selectedYear: number) => {
    setLoading(true);

    const { data: missions, error: missionsError } = await supabase
      .from("missions")
      .select(`*`)
      .eq('status', 'termine')
      .gte("created_at", `${selectedYear}-01-01T00:00:00.000Z`)
      .lte("created_at", `${selectedYear}-12-31T23:59:59.999Z`);

    if (missionsError) {
      console.error("Error fetching missions:", missionsError);
      setMonthlyData([]);
      setDriverPayments([]);
      setClientPayments([]);
      setLoading(false);
      return;
    }

    if (!missions || missions.length === 0) {
      setMonthlyData(months.map(m => ({ month: m, year: selectedYear, revenue: 0, vat: 0, driverPayments: 0, total_ht: 0 })));
      setDriverPayments([]);
      setClientPayments([]);
      setLoading(false);
      return;
    }

    const clientIds = Array.from(new Set(missions.map(m => m.client_id).filter(id => id)));
    const driverIds = Array.from(new Set(missions.map(m => m.chauffeur_id).filter(id => id)));
    const profileIds = Array.from(new Set([...clientIds, ...driverIds]));

    let profilesMap = new Map();
    if (profileIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .in('id', profileIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else if (profiles) {
        profiles.forEach(profile => {
          profilesMap.set(profile.id, profile);
        });
      }
    }

    const monthlyStats: Record<string, MonthlyData> = {};
    months.forEach((m) => {
      monthlyStats[m] = {
        month: m,
        year: selectedYear,
        revenue: 0,
        vat: 0,
        driverPayments: 0,
        total_ht: 0,
      };
    });

    const driverStats: Record<string, DriverPayment> = {};
    const clientStats: Record<string, ClientPayment> = {};

    missions.forEach((mission: any) => {
      const date = new Date(mission.created_at);
      const monthName = months[date.getMonth()];
      const vat = (mission.price_ttc || 0) - (mission.price_ht || 0);

      if (monthlyStats[monthName]) {
        monthlyStats[monthName].revenue += mission.price_ht || 0;
        monthlyStats[monthName].vat += vat;
        monthlyStats[monthName].driverPayments += mission.chauffeur_price_ht || 0;
        monthlyStats[monthName].total_ht += mission.price_ht || 0;
      }

      const driverProfile = mission.chauffeur_id ? profilesMap.get(mission.chauffeur_id) : null;
      if (driverProfile) {
        const driverName = driverProfile.full_name || driverProfile.company_name || driverProfile.email || "Inconnu";
        const driverKey = driverName + "-" + monthName;
        if (!driverStats[driverKey]) {
          driverStats[driverKey] = {
            driver: driverName,
            month: monthName,
            year: selectedYear,
            total: 0,
          };
        }
        driverStats[driverKey].total += mission.chauffeur_price_ht || 0;
      }

      const clientProfile = mission.client_id ? profilesMap.get(mission.client_id) : null;
      if (clientProfile) {
        const clientName = clientProfile.company_name || clientProfile.full_name || clientProfile.email || "Inconnu";
        const clientKey = clientName + "-" + monthName;
        if (!clientStats[clientKey]) {
          clientStats[clientKey] = {
            client: clientName,
            month: monthName,
            year: selectedYear,
            total: 0,
            vat: 0,
            total_ht: 0,
          };
        }
        clientStats[clientKey].total += mission.price_ttc || 0;
        clientStats[clientKey].vat += vat;
        clientStats[clientKey].total_ht += mission.price_ht || 0;
      }
    });

    setMonthlyData(Object.values(monthlyStats));
    setDriverPayments(Object.values(driverStats));
    setClientPayments(Object.values(clientStats));
    setLoading(false);
  };

  useEffect(() => {
    fetchStats(year);
    fetchYears();
  }, [year]);

  const totalRevenue = useMemo(() => monthlyData.reduce((acc, x) => acc + x.revenue, 0), [monthlyData]);
  const totalVat = useMemo(() => monthlyData.reduce((acc, x) => acc + x.vat, 0), [monthlyData]);
  const totalDriverPayments = useMemo(() => monthlyData.reduce((acc, x) => acc + x.driverPayments, 0), [monthlyData]);

  return {
    loading,
    monthlyData,
    driverPayments,
    clientPayments,
    years,
    totalRevenue,
    totalVat,
    totalDriverPayments,
  };
};
