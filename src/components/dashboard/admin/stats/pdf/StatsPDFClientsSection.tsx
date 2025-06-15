
import React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  heading: { fontSize: 13, fontWeight: "bold", marginBottom: 6 },
  table: { flexDirection: "column", width: "auto", marginTop: 4, borderStyle: "solid", borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { flexDirection: "row" },
  tableCell: { borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, padding: 4, minWidth: 60, fontSize: 10 },
  tableHeader: { backgroundColor: "#e5e7eb", fontWeight: "bold" },
});

interface ClientPaymentPDF {
  client: string;
  month: string;
  year: number;
  total: number;
  vat: number;
  total_ht: number;
}

interface StatsPDFClientsSectionProps {
  clientPayments: ClientPaymentPDF[];
}

export const StatsPDFClientsSection: React.FC<StatsPDFClientsSectionProps> = ({ clientPayments }) => {
  if (!clientPayments.length) return null;

  // Regrouper par client
  const byClient: Record<string, ClientPaymentPDF[]> = {};
  clientPayments.forEach(p => {
    byClient[p.client] = byClient[p.client] || [];
    byClient[p.client].push(p);
  });

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Détail des paiements clients</Text>
      {Object.entries(byClient).map(([client, payments]) => (
        <View key={client} wrap={false} style={{marginBottom: 8}}>
          <Text style={{fontSize: 11, fontWeight: "bold", marginBottom: 2}}>{client}</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Mois</Text>
              <Text style={styles.tableCell}>HT</Text>
              <Text style={styles.tableCell}>TTC</Text>
              <Text style={styles.tableCell}>TVA</Text>
            </View>
            {payments.map(p => (
              <View key={p.month} style={styles.tableRow}>
                <Text style={styles.tableCell}>{p.month}</Text>
                <Text style={styles.tableCell}>{p.total_ht.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
                <Text style={styles.tableCell}>{p.total.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
                <Text style={styles.tableCell}>{p.vat.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
};
