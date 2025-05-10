
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { formatMissionNumber, formatFullAddress } from '@/utils/missionUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #ccc',
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
    borderBottom: '1pt solid #eee',
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flexDirection: 'column',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    width: '30%',
  },
  value: {
    width: '70%',
  },
  companyName: {
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 3,
  },
  address: {
    marginBottom: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: '1pt solid #ccc',
    paddingTop: 10,
    fontSize: 8,
    color: '#666',
  },
  priceTable: {
    marginTop: 30,
    borderBottom: '1pt solid #ccc',
  },
  priceRow: {
    flexDirection: 'row',
    borderTop: '1pt solid #ccc',
    paddingVertical: 4,
  },
  priceLabel: {
    width: '70%',
    paddingLeft: 5,
  },
  priceValue: {
    width: '30%',
    textAlign: 'right',
    paddingRight: 5,
  },
  priceLabelBold: {
    width: '70%',
    fontWeight: 'bold',
    paddingLeft: 5,
  },
  priceValueBold: {
    width: '30%',
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: 5,
  },
  missionDetails: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f9f9f9',
  },
  serviceDetails: {
    marginTop: 5,
    marginBottom: 15,
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  logo: {
    width: 150,
    height: 'auto',
  },
});

interface QuotePDFProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
}

const QuotePDF: React.FC<QuotePDFProps> = ({ mission, client, adminProfile }) => {
  // Format the quote number
  const quoteNumber = `DEV-${formatMissionNumber(mission)}`;
  
  // Calculate VAT amount
  const vatAmount = mission.price_ttc - mission.price_ht;
  
  // Format date
  const creationDate = mission.created_at 
    ? format(new Date(mission.created_at), 'dd MMMM yyyy', { locale: fr })
    : 'Date inconnue';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>DEVIS N° : {quoteNumber}</Text>
          <Text style={styles.subtitle}>Date de création : {creationDate}</Text>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOCIETE DE CONVOYAGE</Text>
          <View style={styles.column}>
            <Text style={styles.companyName}>DK-AUTOMOTIVE</Text>
            <Text style={styles.address}>
              {adminProfile?.billing_address?.address || "123 rue du Convoyage"}
            </Text>
            <Text style={styles.address}>
              {adminProfile?.billing_address?.postal_code || "75000"} {adminProfile?.billing_address?.city || "Paris"}
            </Text>
            <Text style={styles.address}>SIRET : {adminProfile?.siret || "123 456 789 00000"}</Text>
            <Text style={styles.address}>N° TVA : {adminProfile?.tva_number || "FR12 123456789"}</Text>
          </View>
        </View>

        {/* Client Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CLIENT</Text>
          <View style={styles.column}>
            <Text style={styles.companyName}>{client?.company_name || client?.full_name || "Client"}</Text>
            <Text style={styles.address}>
              {client?.billing_address?.address || "Adresse du client"}
            </Text>
            <Text style={styles.address}>
              {client?.billing_address?.postal_code || ""} {client?.billing_address?.city || ""}
            </Text>
            <Text style={styles.address}>SIRET : {client?.siret || "Non spécifié"}</Text>
            <Text style={styles.address}>N° TVA : {client?.tva_number || "Non spécifié"}</Text>
          </View>
        </View>

        {/* Service Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRESTATION</Text>
          <View style={styles.serviceDetails}>
            <Text>CONVOYAGE</Text>
            <View style={styles.missionDetails}>
              <Text>De: {formatFullAddress(mission.pickup_address)}</Text>
              <Text>À: {formatFullAddress(mission.delivery_address)}</Text>
              <Text>Catégorie de véhicule: {mission.vehicle_category || "Non spécifiée"}</Text>
              <Text>Distance: {mission.distance_km.toFixed(2)} km</Text>
            </View>
          </View>

          {/* Pricing Table */}
          <View style={styles.priceTable}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Montant HT</Text>
              <Text style={styles.priceValue}>
                {mission.price_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Montant TVA ({mission.vat_rate || 20}%)</Text>
              <Text style={styles.priceValue}>
                {vatAmount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabelBold}>Montant TTC</Text>
              <Text style={styles.priceValueBold}>
                {mission.price_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Ce devis est valable 30 jours à compter de sa date d'émission</Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuotePDF;
