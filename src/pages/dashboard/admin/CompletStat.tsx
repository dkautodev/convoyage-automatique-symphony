import React, { useEffect, useState, useMemo } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [detailsMonth, setDetailsMonth] = useState<string | null>(null);
  const [detailsClientMonth, setDetailsClientMonth] = useState<string | null>(
    null
  );

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

  // Format monétaire
  const formatCurrency = (n: number) =>
    n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  // Sommes annuelles
  const totalRevenue = monthlyData.reduce((acc, x) => acc + x.revenue, 0);
  const totalVat = monthlyData.reduce((acc, x) => acc + x.vat, 0);
  const totalDriverPayments = monthlyData.reduce((acc, x) => acc + x.driverPayments, 0);

  const monthlyDriverSummary = useMemo(() => {
    const summaryMap: Record<string, number> = {};

    driverPayments.forEach((payment) => {
      summaryMap[payment.month] =
        (summaryMap[payment.month] || 0) + payment.total;
    });

    return months.map((month) => ({
      month: month,
      total: summaryMap[month] || 0,
    }));
  }, [driverPayments]);

  const monthlyClientSummary = useMemo(() => {
    const summaryMap: Record<
      string,
      { total_ht: number; total_ttc: number; vat: number }
    > = {};

    clientPayments.forEach((payment) => {
      if (!summaryMap[payment.month]) {
        summaryMap[payment.month] = { total_ht: 0, total_ttc: 0, vat: 0 };
      }
      summaryMap[payment.month].total_ht += payment.total_ht;
      summaryMap[payment.month].total_ttc += payment.total; // 'total' is TTC
      summaryMap[payment.month].vat += payment.vat;
    });

    return months.map((month) => ({
      month: month,
      total_ht: summaryMap[month]?.total_ht || 0,
      total_ttc: summaryMap[month]?.total_ttc || 0,
      vat: summaryMap[month]?.vat || 0,
    }));
  }, [clientPayments]);

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
                <TableHead>Mois</TableHead>
                <TableHead>Total (HT)</TableHead>
                <TableHead>Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyDriverSummary.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.total)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => setDetailsMonth(row.month)}
                      disabled={row.total === 0}
                    >
                      Voir le détail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tableau paiements clients par mois (HT, TTC & TVA) */}
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Paiements clients par mois (HT, TTC & TVA)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mois</TableHead>
                <TableHead>Total HT</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>TVA collectée</TableHead>
                <TableHead>Détail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyClientSummary.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell>{formatCurrency(row.total_ht)}</TableCell>
                  <TableCell>{formatCurrency(row.total_ttc)}</TableCell>
                  <TableCell>{formatCurrency(row.vat)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => setDetailsClientMonth(row.month)}
                      disabled={row.total_ttc === 0}
                    >
                      Voir le détail
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog
        open={!!detailsMonth}
        onOpenChange={(open) => !open && setDetailsMonth(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Détail des paiements pour {detailsMonth} {year}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPayments.filter((p) => p.month === detailsMonth).length >
              0 ? (
                driverPayments
                  .filter((p) => p.month === detailsMonth)
                  .map((payment) => (
                    <TableRow key={payment.driver + payment.month}>
                      <TableCell>{payment.driver}</TableCell>
                      <TableCell>{formatCurrency(payment.total)}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center">
                    Aucun paiement pour ce mois.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!detailsClientMonth}
        onOpenChange={(open) => !open && setDetailsClientMonth(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Détail des paiements clients pour {detailsClientMonth} {year}
            </DialogTitle>
          </DialogHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Total HT</TableHead>
                <TableHead>Total TTC</TableHead>
                <TableHead>TVA collectée</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientPayments.filter((p) => p.month === detailsClientMonth)
                .length > 0 ? (
                clientPayments
                  .filter((p) => p.month === detailsClientMonth)
                  .map((payment) => (
                    <TableRow key={payment.client + payment.month}>
                      <TableCell>{payment.client}</TableCell>
                      <TableCell>{formatCurrency(payment.total_ht)}</TableCell>
                      <TableCell>{formatCurrency(payment.total)}</TableCell>
                      <TableCell>{formatCurrency(payment.vat)}</TableCell>
                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Aucun paiement pour ce mois.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompletStat;
