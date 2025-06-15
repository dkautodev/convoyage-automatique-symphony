
import * as XLSX from "xlsx";

type StatsExcelParams = {
  year: number;
  monthlyData: { month: string; revenue: number; vat: number; driverPayments: number; }[];
  totalRevenue: number;
  totalVat: number;
  totalDriverPayments: number;
  driverPayments: { driver: string; month: string; year: number; total: number; }[];
  clientPayments: { client: string; month: string; year: number; total: number; vat: number; total_ht: number; }[];
  categoryData: {
    category: string; month: string; year: number; revenue: number; vat: number; driverPayments: number; missionsCount: number;
    averagePrice?: number; profitMargin?: number;
  }[];
  categoryPerformances: {
    category: string; totalRevenue: number; totalMissions: number; profitability: number; averageRevenue?: number; growth?: number;
  }[];
};

export function generateCompletStatsExcel(params: StatsExcelParams) {
  const {
    year,
    monthlyData,
    totalRevenue,
    totalVat,
    totalDriverPayments,
    driverPayments,
    clientPayments,
    categoryData,
    categoryPerformances,
  } = params;

  const toCurrency = (v: number) => typeof v === "number" ? v.toLocaleString("fr-FR", {style: "currency", currency: "EUR"}) : v;

  // Onglet Synthèse Annuelle
  const annualSheet = [
    ["Année", year],
    [],
    ["Total CA HT", toCurrency(totalRevenue)],
    ["Total TVA collectée", toCurrency(totalVat)],
    ["Total Paiements chauffeurs", toCurrency(totalDriverPayments)],
    [],
    ["Mois", "CA HT", "TVA", "Paiements chauffeurs"],
    ...monthlyData.map(row => [
      row.month,
      toCurrency(row.revenue),
      toCurrency(row.vat),
      toCurrency(row.driverPayments),
    ]),
  ];

  // Onglet Paiements Chauffeurs détaillé
  const chauffeursHeaders = ["Chauffeur", "Mois", "Année", "Montant HT"];
  const chauffeursSheet = [
    chauffeursHeaders,
    ...driverPayments.map(p => [
      p.driver,
      p.month,
      p.year,
      toCurrency(p.total),
    ]),
  ];

  // Onglet Paiements Clients détaillé
  const clientsHeaders = ["Client", "Mois", "Année", "Total HT", "Total TTC", "TVA"];
  const clientsSheet = [
    clientsHeaders,
    ...clientPayments.map(p => [
      p.client,
      p.month,
      p.year,
      toCurrency(p.total_ht),
      toCurrency(p.total),
      toCurrency(p.vat),
    ]),
  ];

  // Onglet Catégories
  const categoriesHeaders = ["Catégorie", "Mois", "Année", "CA HT", "TVA", "Paiements chauffeurs", "Nb missions", "Prix moyen", "Marge"];
  const categoriesSheet = [
    categoriesHeaders,
    ...categoryData.map(data => [
      data.category,
      data.month,
      data.year,
      toCurrency(data.revenue),
      toCurrency(data.vat),
      toCurrency(data.driverPayments),
      data.missionsCount,
      data.averagePrice ? toCurrency(data.averagePrice) : "",
      data.profitMargin ? toCurrency(data.profitMargin) : "",
    ]),
  ];

  // Onglet Rentabilité/Catégorie
  const rentabiliteHeaders = ["Catégorie", "CA HT total", "Nb missions", "Rentabilité (%)", "CA moyen"];
  const rentabiliteSheet = [
    rentabiliteHeaders,
    ...categoryPerformances.map(perf => [
      perf.category,
      toCurrency(perf.totalRevenue),
      perf.totalMissions,
      perf.profitability?.toFixed(2) ?? "",
      perf.averageRevenue ? toCurrency(perf.averageRevenue) : "",
    ]),
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(annualSheet), "Synthèse annuelle");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(chauffeursSheet), "Paiements chauffeurs");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(clientsSheet), "Paiements clients");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(categoriesSheet), "Catégories");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rentabiliteSheet), "Rentabilité");

  // Générer le fichier comme blob
  const wbout = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([wbout], { type: "application/octet-stream" });
}
