
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import { CATEGORY_LABELS } from "@/types/advancedStats";

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  table: { flexDirection: "column", width: "auto", marginTop: 4, borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableCell: { borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 4, minWidth: 60, fontSize: 10 },
  tableHeader: { backgroundColor: "#e5e7eb", fontWeight: "bold" },
});

interface CategoryPerformancePDF {
  category: string;
  totalRevenue: number;
  totalMissions: number;
  profitability: number;
}

interface StatsPDFProfitabilitySectionProps {
  categoryPerformances: CategoryPerformancePDF[];
}

export const StatsPDFProfitabilitySection: React.FC<StatsPDFProfitabilitySectionProps> = ({ categoryPerformances }) => {
  if (!categoryPerformances.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Analyse de la rentabilité par catégorie</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.tableCell}>Catégorie</Text>
          <Text style={styles.tableCell}>CA Total</Text>
          <Text style={styles.tableCell}>Missions</Text>
          <Text style={styles.tableCell}>Rentabilité (%)</Text>
        </View>
        {categoryPerformances.map(perf => (
          <View style={styles.tableRow} key={perf.category}>
            <Text style={styles.tableCell}>{CATEGORY_LABELS[perf.category as keyof typeof CATEGORY_LABELS] || perf.category}</Text>
            <Text style={styles.tableCell}>{perf.totalRevenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
            <Text style={styles.tableCell}>{perf.totalMissions}</Text>
            <Text style={styles.tableCell}>{perf.profitability.toFixed(2)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};
