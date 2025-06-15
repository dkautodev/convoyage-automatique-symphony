
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
} from "@react-pdf/renderer";
import { StatsPDFDriversSection } from "./pdf/StatsPDFDriversSection";
import { StatsPDFClientsSection } from "./pdf/StatsPDFClientsSection";
import { StatsPDFCategorySection } from "./pdf/StatsPDFCategorySection";
import { StatsPDFProfitabilitySection } from "./pdf/StatsPDFProfitabilitySection";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  heading: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  table: { flexDirection: "column", width: "auto", marginTop: 16, borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableCell: { borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 6, minWidth: 70 },
  tableHeader: { backgroundColor: "#e5e7eb", fontWeight: "bold" },
  section: { marginBottom: 10 },
});

interface StatsPDFDocumentProps {
  year: number;
  monthlyData: { month: string; revenue: number; vat: number; driverPayments: number; }[];
  totalRevenue: number;
  totalVat: number;
  totalDriverPayments: number;
  driverPayments: { driver: string; month: string; year: number; total: number; }[];
  clientPayments: { client: string; month: string; year: number; total: number; vat: number; total_ht: number; }[];
  categoryData: {
    category: string; month: string; year: number; revenue: number; vat: number; driverPayments: number; missionsCount: number;
  }[];
  categoryPerformances: {
    category: string; totalRevenue: number; totalMissions: number; profitability: number;
  }[];
}

export const StatsPDFDocument: React.FC<StatsPDFDocumentProps> = ({
  year,
  monthlyData,
  totalRevenue,
  totalVat,
  totalDriverPayments,
  driverPayments,
  clientPayments,
  categoryData,
  categoryPerformances,
}) => (
  <Document>
    {/* Page 1: Synthèse annuelle */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Synthèse annuelle - {year}</Text>
      <View style={styles.section}>
        <Text>
          Total CA HT: {totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </Text>
        <Text>
          Total TVA collectée: {totalVat.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </Text>
        <Text>
          Total Paiements chauffeurs: {totalDriverPayments.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </Text>
      </View>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Mois</Text>
          <Text style={styles.tableCell}>CA HT</Text>
          <Text style={styles.tableCell}>TVA</Text>
          <Text style={styles.tableCell}>Paiements chauffeurs</Text>
        </View>
        {monthlyData.map((d) => (
          <View style={styles.tableRow} key={d.month}>
            <Text style={styles.tableCell}>{d.month}</Text>
            <Text style={styles.tableCell}>{d.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
            <Text style={styles.tableCell}>{d.vat.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
            <Text style={styles.tableCell}>{d.driverPayments.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
          </View>
        ))}
      </View>
    </Page>
    {/* Page 2: Détail chauffeurs */}
    <Page size="A4" style={styles.page}>
      <StatsPDFDriversSection driverPayments={driverPayments} />
    </Page>
    {/* Page 3: Détail clients */}
    <Page size="A4" style={styles.page}>
      <StatsPDFClientsSection clientPayments={clientPayments} />
    </Page>
    {/* Page 4: Par catégorie */}
    <Page size="A4" style={styles.page}>
      <StatsPDFCategorySection categoryData={categoryData} />
    </Page>
    {/* Page 5: Par rentabilité */}
    <Page size="A4" style={styles.page}>
      <StatsPDFProfitabilitySection categoryPerformances={categoryPerformances} />
    </Page>
  </Document>
);
