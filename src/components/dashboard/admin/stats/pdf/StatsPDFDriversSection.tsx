
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  table: { flexDirection: "column", width: "auto", marginTop: 4, borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableCell: { borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 4, minWidth: 70, fontSize: 10 },
  tableHeader: { backgroundColor: "#e5e7eb", fontWeight: "bold" },
});

interface DriverPaymentPDF {
  driver: string;
  month: string;
  year: number;
  total: number;
}

interface StatsPDFDriversSectionProps {
  driverPayments: DriverPaymentPDF[];
}

export const StatsPDFDriversSection: React.FC<StatsPDFDriversSectionProps> = ({ driverPayments }) => {
  if (!driverPayments.length) return null;

  // Regroupement par chauffeur
  const byDriver: Record<string, DriverPaymentPDF[]> = {};
  driverPayments.forEach(p => {
    byDriver[p.driver] = byDriver[p.driver] || [];
    byDriver[p.driver].push(p);
  });

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Détail des paiements chauffeurs</Text>
      {Object.entries(byDriver).map(([driver, payments]) => (
        <View key={driver} wrap={false} style={{marginBottom: 8}}>
          <Text style={{fontSize: 11, fontWeight: "bold", marginBottom: 2}}>{driver}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Mois</Text>
              <Text style={styles.tableCell}>Montant</Text>
            </View>
            {payments.map(p => (
              <View key={p.month} style={styles.tableRow}>
                <Text style={styles.tableCell}>{p.month}</Text>
                <Text style={styles.tableCell}>{p.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};
