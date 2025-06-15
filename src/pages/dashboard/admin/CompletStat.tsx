import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface MonthlyData {
  month: string;
  year: number;
  revenue: number;
  vat: number;
  driverPayments: number;
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
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const CompletStat = () => {
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([]);
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [years, setYears] = useState<number[]>([]);

  useEffect(() => {
    fetchStats(year);
    fetchYears();
  }, [year]);

  // Récupérer toutes les années présentes dans _missions_
  const fetchYears = async () => {
    const { data } = await supabase.from("missions").select("created_at");
    if (data) {
      const yrs = Array.from(
        new Set(data.map((x: any) => new Date(x.created_at).getFullYear()))
      );
      setYears(yrs.sort((a, b) => b - a));
    }
  };

  // Calcul agrégé sur toutes les missions terminées
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
      setMonthlyData(months.map(m => ({ month: m, year: selectedYear, revenue: 0, vat: 0, driverPayments: 0 })));
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
          };
        }
        clientStats[clientKey].total += mission.price_ttc || 0;
        clientStats[clientKey].vat += vat;
      }
    });

    setMonthlyData(Object.values(monthlyStats));
    setDriverPayments(Object.values(driverStats));
    setClientPayments(Object.values(clientStats));
    setLoading(false);
  };

  // Format monétaire
  const formatCurrency = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  // Sommes annuelles
  const totalRevenue = monthlyData.reduce((acc, x) => acc + x.revenue, 0);
  const totalVat = monthlyData.reduce((acc, x) => acc + x.vat, 0);
  const totalDriverPayments = monthlyData.reduce((acc, x) => acc + x.driverPayments, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-bold text-2xl">Statistiques comptables complètes</h2>
        <div>
          <span className="mr-2">Année :</span>
          <select
            value={year}
            className="border rounded px-2 py-1"
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((yr) => (
              <option value={yr} key={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Résumé annuel */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Résumé annuel {year}</CardTitle>
          <CardDescription>
            Chiffre d'affaires HT : <b>{formatCurrency(totalRevenue)}</b> | TVA collectée :{" "}
            <b>{formatCurrency(totalVat)}</b> | Paiements chauffeurs :{" "}
            <b>{formatCurrency(totalDriverPayments)}</b>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Graphique multi-barres par mois */}
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

      {/* Tableau paiements chauffeurs */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Paiements chauffeurs par mois</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPayments.map((row) => (
                <TableRow key={row.driver + row.month}>
                  <TableCell>{row.driver}</TableCell>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tableau paiements clients */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Paiements clients par mois (TTC & TVA)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Mois</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>TVA collectée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientPayments.map((row) => (
                <TableRow key={row.client + row.month}>
                  <TableCell>{row.client}</TableCell>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.total)}</TableCell>
                  <TableCell>{formatCurrency(row.vat)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompletStat;
