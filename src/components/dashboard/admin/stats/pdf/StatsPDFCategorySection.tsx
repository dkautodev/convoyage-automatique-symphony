
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

interface CategoryDataPDF {
  category: string;
  month: string;
  year: number;
  revenue: number;
  vat: number;
  driverPayments: number;
  missionsCount: number;
}

interface StatsPDFCategorySectionProps {
  categoryData: CategoryDataPDF[];
}

export const StatsPDFCategorySection: React.FC<StatsPDFCategorySectionProps> = ({ categoryData }) => {
  if (!categoryData.length) return null;

  // Groupons par catégorie pour un tableau synthétique
  const byCat: Record<string, CategoryDataPDF[]> = {};
  categoryData.forEach(c => {
    byCat[c.category] = byCat[c.category] || [];
    byCat[c.category].push(c);
  });

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Synthèse par catégorie de véhicule</Text>
      {Object.entries(byCat).map(([cat, records]) => (
        <View key={cat} wrap={false} style={{marginBottom: 8}}>
          <Text style={{fontSize: 11, fontWeight: "bold", marginBottom: 2}}>
            {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}
          </Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Mois</Text>
              <Text style={styles.tableCell}>CA HT</Text>
              <Text style={styles.tableCell}>Missions</Text>
              <Text style={styles.tableCell}>Paie Chauffeur</Text>
            </View>
            {records.map(r => (
              <View key={r.month} style={styles.tableRow}>
                <Text style={styles.tableCell}>{r.month}</Text>
                <Text style={styles.tableCell}>{r.revenue.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
                <Text style={styles.tableCell}>{r.missionsCount}</Text>
                <Text style={styles.tableCell}>{r.driverPayments.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};
