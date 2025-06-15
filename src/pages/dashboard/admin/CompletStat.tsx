import React, { useState } from "react";
import { useCompletStats } from "@/hooks/useCompletStats";
import { useAdvancedStats } from "@/hooks/useAdvancedStats";
import { FilterProvider, useFilters } from "@/contexts/FilterContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnnualSummaryCard } from "@/components/dashboard/admin/stats/AnnualSummaryCard";
import { RevenueChart } from "@/components/dashboard/admin/stats/RevenueChart";
import { DriverPaymentsTable } from "@/components/dashboard/admin/stats/DriverPaymentsTable";
import { ClientPaymentsTable } from "@/components/dashboard/admin/stats/ClientPaymentsTable";
import { DriverDetailsDialog } from "@/components/dashboard/admin/stats/DriverDetailsDialog";
import { ClientDetailsDialog } from "@/components/dashboard/admin/stats/ClientDetailsDialog";
import { FilterPanel } from "@/components/dashboard/admin/stats/FilterPanel";
import { MonthlyBreakdownByCategory } from "@/components/dashboard/admin/stats/MonthlyBreakdownByCategory";
import { AnnualEvolutionByCategory } from "@/components/dashboard/admin/stats/AnnualEvolutionByCategory";
import { CategoryPerformanceComparison } from "@/components/dashboard/admin/stats/CategoryPerformanceComparison";
import { ProfitabilityAnalysis } from "@/components/dashboard/admin/stats/ProfitabilityAnalysis";
import { ExportToolbar } from "@/components/dashboard/admin/stats/ExportToolbar";
import { StatsPDFDocument } from "@/components/dashboard/admin/stats/StatsPDFDocument";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
const CompletStatContent = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [detailsMonth, setDetailsMonth] = useState<string | null>(null);
  const [detailsClientMonth, setDetailsClientMonth] = useState<string | null>(null);
  const {
    filters
  } = useFilters();
  const {
    loading: basicLoading,
    monthlyData,
    driverPayments,
    clientPayments,
    years,
    totalRevenue,
    totalVat,
    totalDriverPayments
  } = useCompletStats(year);
  const {
    loading: advancedLoading,
    categoryData,
    monthlyBreakdowns,
    categoryPerformances,
    categoryTotals
  } = useAdvancedStats(year, filters);
  const handleExportPDF = async () => {
    // Génère le PDF synthèse annuelle et télécharge
    try {
      const doc = (
        <StatsPDFDocument
          year={year}
          monthlyData={monthlyData}
          totalRevenue={totalRevenue}
          totalVat={totalVat}
          totalDriverPayments={totalDriverPayments}
        />
      );
      const blob = await pdf(doc).toBlob();
      saveAs(blob, `statistiques_${year}.pdf`);
    } catch (e) {
      // Ajout console log pour faciliter debug si crash
      console.error("Erreur génération PDF :", e);
      alert("Échec export PDF.");
    }
  };
  const handleExportExcel = () => {
    // TODO: Implement Excel export
    console.log("Export Excel functionality to be implemented");
  };
  const handlePrint = () => {
    window.print();
  };
  return <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        <h2 className="font-bold text-2xl">Statistiques comptables complètes</h2>
        <div className="flex items-center gap-4">
          <div>
            <span className="mr-2">Année :</span>
            <select value={year} className="border rounded px-2 py-1" onChange={e => setYear(Number(e.target.value))}>
              {years.map(yr => <option value={yr} key={yr}>
                  {yr}
                </option>)}
            </select>
          </div>
        </div>
      </div>

      <ExportToolbar onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} onPrint={handlePrint} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
        <div className="lg:col-span-4 w-full">
          <Tabs defaultValue="overview" className="space-y-6 w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="monthly">Rapport mensuel</TabsTrigger>
              <TabsTrigger value="annual">Évolution annuelle</TabsTrigger>
              <TabsTrigger value="analysis">Analyse comparative</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <AnnualSummaryCard year={year} totalRevenue={totalRevenue} totalVat={totalVat} totalDriverPayments={totalDriverPayments} />

              <RevenueChart year={year} loading={basicLoading} monthlyData={monthlyData} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DriverPaymentsTable driverPayments={driverPayments} onDetailsClick={setDetailsMonth} />

                <ClientPaymentsTable clientPayments={clientPayments} onDetailsClick={setDetailsClientMonth} />
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-6">
              <MonthlyBreakdownByCategory monthlyBreakdowns={monthlyBreakdowns} loading={advancedLoading} />
            </TabsContent>

            <TabsContent value="annual" className="space-y-6">
              <AnnualEvolutionByCategory categoryData={categoryData} loading={advancedLoading} />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <CategoryPerformanceComparison categoryPerformances={categoryPerformances} loading={advancedLoading} />
              
              <ProfitabilityAnalysis categoryPerformances={categoryPerformances} loading={advancedLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <DriverDetailsDialog open={!!detailsMonth} onOpenChange={open => !open && setDetailsMonth(null)} month={detailsMonth} year={year} driverPayments={driverPayments} />

      <ClientDetailsDialog open={!!detailsClientMonth} onOpenChange={open => !open && setDetailsClientMonth(null)} month={detailsClientMonth} year={year} clientPayments={clientPayments} />
    </div>;
};
const CompletStat = () => {
  return <FilterProvider>
      <CompletStatContent />
    </FilterProvider>;
};
export default CompletStat;
