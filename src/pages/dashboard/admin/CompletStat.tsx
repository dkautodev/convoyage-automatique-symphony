
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { typedSupabase } from "@/types/database";

interface MonthlyData { month: string; year: number; revenue: number; vat: number; driverPayments: number; }
interface DriverPayment { driver: string; month: string; year: number; total: number; }
interface ClientPayment { client: string; month: string; year: number; total: number; vat: number; }
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
    // get available years for navigation
    fetchYears();
  }, [year]);

  const fetchYears = async () => {
    const { data } = await typedSupabase.from("missions").select("created_at");
    if (data) {
      const yrs = Array.from(
        new Set(
          data.map(x => new Date(x.created_at).getFullYear())
        )
      );
      setYears(yrs.sort((a, b) => b - a));
    }
  };

  const fetchStats = async (selectedYear: number) => {
    setLoading(true);
    // 1. Fetch missions for the year and join client/driver info
    const { data: missions } = await typedSupabase.from("missions").select(`*, profiles:profiles!missions_client_id_fkey(full_name, company_name, email), driver:profiles!missions_chauffeur_id_fkey(full_name, company_name, email)`).gte('created_at', `${selectedYear}-01-01`).lte('created_at', `${selectedYear}-12-31`);
    if (!missions) {
      setLoading(false);
      return;
    }
    // prepare per-month stats
    const monthlyStats: Record<string, MonthlyData> = {};
    const driverStats: Record<string, DriverPayment> = {};
    const clientStats: Record<string, ClientPayment> = {};
    months.forEach(m => {
      monthlyStats[m] = { month: m, year: selectedYear, revenue: 0, vat: 0, driverPayments: 0 };
    });
    // aggregate
    missions.forEach((mission: any) => {
      const date = new Date(mission.created_at);
      const monthName = months[date.getMonth()];
      const vat = (mission.price_ttc || 0) - (mission.price_ht || 0);
      if (mission.status === 'termine') {
        if (monthlyStats[monthName]) {
          monthlyStats[monthName].revenue += mission.price_ht || 0;
          monthlyStats[monthName].vat += vat;
          monthlyStats[monthName].driverPayments += mission.chauffeur_price_ht || 0;
        }
        // driver payments
        if (mission.driver) {
          const driverKey = `${mission.driver.full_name || mission.driver.company_name || mission.driver.email || "Inconnu"}-${monthName}`;
          if (!driverStats[driverKey]) {
            driverStats[driverKey] = {
              driver: mission.driver.full_name || mission.driver.company_name || mission.driver.email || "Inconnu",
              month: monthName, year: selectedYear, total: 0
            };
          }
          driverStats[driverKey].total += mission.chauffeur_price_ht || 0;
        }
        // client payments
        if (mission.profiles) {
          const clientKey = `${mission.profiles.company_name || mission.profiles.full_name || mission.profiles.email || "Inconnu"}-${monthName}`;
          if (!clientStats[clientKey]) {
            clientStats[clientKey] = {
              client: mission.profiles.company_name || mission.profiles.full_name || mission.profiles.email || "Inconnu",
              month: monthName, year: selectedYear, total: 0, vat: 0
            };
          }
          clientStats[clientKey].total += mission.price_ttc || 0;
          clientStats[clientKey].vat += vat;
        }
      }
    });
    setMonthlyData(Object.values(monthlyStats));
    setDriverPayments(Object.values(driverStats));
    setClientPayments(Object.values(clientStats));
    setLoading(false);
  };

  const formatCurrency = (n: number) =>
    n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <h2 className="font-bold text-2xl">Statistiques comptables complètes</h2>
        <div>
          <span className="mr-2">Année:</span>
          <select
            value={year}
            className="border rounded px-2 py-1"
            onChange={e => setYear(Number(e.target.value))}
          >
            {years.map(yr => (
              <option value={yr} key={yr}>{yr}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Chiffre d'affaires, TVA, Paiements chauffeurs</CardTitle>
          <CardDescription>
            Total par mois pour l'année {year}
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
                  <Tooltip formatter={v => formatCurrency(Number(v))} />
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
              {driverPayments.map(row => (
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
              {clientPayments.map(row => (
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
