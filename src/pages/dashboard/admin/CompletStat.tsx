
import React, { useState } from "react";
import { useCompletStats } from "@/hooks/useCompletStats";
import { AnnualSummaryCard } from "@/components/dashboard/admin/stats/AnnualSummaryCard";
import { RevenueChart } from "@/components/dashboard/admin/stats/RevenueChart";
import { DriverPaymentsTable } from "@/components/dashboard/admin/stats/DriverPaymentsTable";
import { ClientPaymentsTable } from "@/components/dashboard/admin/stats/ClientPaymentsTable";
import { DriverDetailsDialog } from "@/components/dashboard/admin/stats/DriverDetailsDialog";
import { ClientDetailsDialog } from "@/components/dashboard/admin/stats/ClientDetailsDialog";

const CompletStat = () => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [detailsMonth, setDetailsMonth] = useState<string | null>(null);
  const [detailsClientMonth, setDetailsClientMonth] = useState<string | null>(null);

  const {
    loading,
    monthlyData,
    driverPayments,
    clientPayments,
    years,
    totalRevenue,
    totalVat,
    totalDriverPayments,
  } = useCompletStats(year);

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

      <AnnualSummaryCard
        year={year}
        totalRevenue={totalRevenue}
        totalVat={totalVat}
        totalDriverPayments={totalDriverPayments}
      />

      <RevenueChart
        year={year}
        loading={loading}
        monthlyData={monthlyData}
      />

      <DriverPaymentsTable
        driverPayments={driverPayments}
        onDetailsClick={setDetailsMonth}
      />

      <ClientPaymentsTable
        clientPayments={clientPayments}
        onDetailsClick={setDetailsClientMonth}
      />

      <DriverDetailsDialog
        open={!!detailsMonth}
        onOpenChange={(open) => !open && setDetailsMonth(null)}
        month={detailsMonth}
        year={year}
        driverPayments={driverPayments}
      />

      <ClientDetailsDialog
        open={!!detailsClientMonth}
        onOpenChange={(open) => !open && setDetailsClientMonth(null)}
        month={detailsClientMonth}
        year={year}
        clientPayments={clientPayments}
      />
    </div>
  );
};

export default CompletStat;
