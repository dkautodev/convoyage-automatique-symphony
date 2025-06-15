
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// Font.register({
//   family: "Inter",
//   src: ... // Optionally add webfont
// });

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 11 },
  heading: { fontSize: 16, fontWeight: "bold", marginBottom: 8 },
  table: { display: "table", width: "auto", marginTop: 16, borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableCell: { borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 6, minWidth: 70 },
  tableHeader: { backgroundColor: "#e5e7eb", fontWeight: "bold" },
  section: { marginBottom: 10 },
});

// Props: synthèse annuelle (basiques, pour cette version)
interface StatsPDFDocumentProps {
  year: number;
  monthlyData: { month: string; revenue: number; vat: number; driverPayments: number; }[];
  totalRevenue: number;
  totalVat: number;
  totalDriverPayments: number;
}

export const StatsPDFDocument: React.FC<StatsPDFDocumentProps> = ({
  year,
  monthlyData,
  totalRevenue,
  totalVat,
  totalDriverPayments,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.heading}>Synthèse annuelle - {year}</Text>
      <View style={styles.section}>
        <Text>Total CA HT: {totalRevenue.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
        <Text>Total TVA collectée: {totalVat.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
        <Text>Total Paiements chauffeurs: {totalDriverPayments.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
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
            <Text style={styles.tableCell}>{d.revenue.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
            <Text style={styles.tableCell}>{d.vat.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
            <Text style={styles.tableCell}>{d.driverPayments.toLocaleString("fr-FR", {style :"currency", currency: "EUR"})}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

