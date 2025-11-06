
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { formatMissionNumber, formatFullAddress } from '@/utils/missionUtils';
import { format, addDays } from 'date-fns';
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
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  dateValue: {
    fontSize: 11,
  },
  sectionsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  section: {
    width: '48%',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    borderBottom: '1pt solid #000',
    paddingBottom: 3,
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 10,
  },
  logo: {
    height: 25,
    objectFit: 'contain',
  },
  legalText: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 1.4,
  },
  paymentTermsContainer: {
    position: 'absolute',
    bottom: 75, // Positionnement au-dessus du footer
    left: 30,
    right: 30,
    marginBottom: 10, // Fixed here: changed from margin-botton to marginBottom
  },
  paymentTermsText: {
    fontSize: 7,
    textAlign: 'left',
    color: '#666',
    lineHeight: 1.3,
  },
  bankDetailsContainer: {
    position: 'absolute',
    bottom: 130,
    left: 30,
    width: '40%',
  },
  bankDetailsText: {
    fontSize: 9,
    textAlign: 'left',
    color: '#000',
    lineHeight: 1.4,
  },
  bankDetailsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  bankDetailsLabel: {
    fontWeight: 'bold',
  },
});

interface InvoicePDFProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  bankInfo?: {
    admin_bank?: string;
    admin_iban?: string;
    admin_bic?: string;
  };
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ mission, client, adminProfile, bankInfo }) => {
  // Format the invoice number
  const invoiceNumber = `FAC-${formatMissionNumber(mission)}`;
  
  // Calculate VAT amount
  const vatAmount = mission.price_ttc - mission.price_ht;
  
  // Find the mission delivery date (D2_LIV) or use creation date as fallback
  const emissionDate = mission.D2_LIV 
    ? new Date(mission.D2_LIV) 
    : new Date(mission.created_at);
  
  // Format emission date
  const formattedEmissionDate = format(emissionDate, 'dd MMMM yyyy', { locale: fr });
  
  // Calculate due date (emission date + 15 days)
  const dueDate = addDays(emissionDate, 15);
  const formattedDueDate = format(dueDate, 'dd MMMM yyyy', { locale: fr });

  // Format vehicle information in the requested format - EXACTLY like in QuotePDF
  const vehicleMakeModel = mission.vehicle_make && mission.vehicle_model 
    ? `${mission.vehicle_make} ${mission.vehicle_model}` 
    : "Non spécifié";
  
  // VIN and registration separated by "/" - EXACTLY like in QuotePDF
  const vehicleVinReg = [
    mission.vehicle_vin ? `VIN: ${mission.vehicle_vin}` : null,
    mission.vehicle_registration ? `Immatriculation: ${mission.vehicle_registration}` : null
  ].filter(Boolean).join(' / ');
  
  // Path for the new logo
  const logoPath = '/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>FACTURE N° : {invoiceNumber}</Text>
        </View>

        {/* Date Section - Redesigned to be on a single line and aligned with below sections */}
        <View style={[styles.dateSection, { marginBottom: 15 }]}>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Date d'émission:</Text>
            <Text style={styles.dateValue}>{formattedEmissionDate}</Text>
          </View>
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Date d'échéance (15 jours):</Text>
            <Text style={styles.dateValue}>{formattedDueDate}</Text>
          </View>
        </View>

        {/* Company and Client Information Side by Side */}
        <View style={styles.sectionsContainer}>
          {/* Company Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SOCIETE DE CONVOYAGE</Text>
            <View style={styles.column}>
              <Text style={styles.companyName}>DK-AUTOMOTIVE</Text>
              {adminProfile?.billing_address && (
                <>
                  <Text style={styles.address}>{adminProfile.billing_address.street || ""}</Text>
                  <Text style={styles.address}>
                    {adminProfile.billing_address.postal_code || ""} {adminProfile.billing_address.city || ""}
                  </Text>
                </>
              )}
              <Text style={styles.address}>SIRET : {adminProfile?.siret || "123 456 789 00000"}</Text>
              <Text style={styles.address}>N° TVA : {adminProfile?.tva_number || "FR12 123456789"}</Text>
            </View>
          </View>

          {/* Client Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CLIENT</Text>
            <View style={styles.column}>
              <Text style={styles.companyName}>{client?.company_name || client?.full_name || "Client"}</Text>
              {client?.billing_address && (
                <>
                  <Text style={styles.address}>{client.billing_address.street || ""}</Text>
                  <Text style={styles.address}>
                    {client.billing_address.postal_code || ""} {client.billing_address.city || ""}
                  </Text>
                </>
              )}
              <Text style={styles.address}>SIRET : {client?.siret || "Non spécifié"}</Text>
              <Text style={styles.address}>N° TVA : {client?.tva_number || "Non spécifié"}</Text>
            </View>
          </View>
        </View>

        {/* Service Description */}
        <View style={{marginTop: 20}}>
          <Text style={styles.sectionTitle}>PRESTATION</Text>
          <View style={styles.serviceDetails}>
            <Text>CONVOYAGE (quantité : 1)</Text>
            <View style={styles.missionDetails}>
              <Text>De: {formatFullAddress(mission.pickup_address)}</Text>
              <Text>À: {formatFullAddress(mission.delivery_address)}</Text>
              <Text>Catégorie de véhicule: {mission.vehicle_category || "Non spécifiée"}</Text>
              <Text>Véhicule: {vehicleMakeModel}</Text>
              {vehicleVinReg && <Text>{vehicleVinReg}</Text>}
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

        {/* Texte de conditions de paiement déplacé ici, avant le footer */}
        <View style={styles.paymentTermsContainer}>
          <Text style={styles.paymentTermsText}>
            Pas d'escompte accordé pour paiement anticipé. En cas de non-paiement à la date d'échéance, des pénalités calculées à trois fois le taux d'intérêt légal seront appliquées.{"\n"}
            Tout retard de paiement entraînera une indemnité forfaitaire pour frais de recouvrement de 40€.
          </Text>
        </View>

        {/* Bank Details - Bottom Left */}
        {bankInfo && (bankInfo.admin_bank || bankInfo.admin_iban || bankInfo.admin_bic) && (
          <View style={styles.bankDetailsContainer}>
            <Text style={styles.bankDetailsTitle}>Détails du paiement</Text>
            {bankInfo.admin_bank && (
              <Text style={styles.bankDetailsText}>
                <Text style={styles.bankDetailsLabel}>Banque : </Text>
                {bankInfo.admin_bank}
              </Text>
            )}
            {bankInfo.admin_iban && (
              <Text style={styles.bankDetailsText}>
                <Text style={styles.bankDetailsLabel}>Iban : </Text>
                {bankInfo.admin_iban}
              </Text>
            )}
            {bankInfo.admin_bic && (
              <Text style={styles.bankDetailsText}>
                <Text style={styles.bankDetailsLabel}>BIC : </Text>
                {bankInfo.admin_bic}
              </Text>
            )}
          </View>
        )}

        {/* Footer avec uniquement le logo */}
        <View style={styles.footer}>
          <View style={styles.logoContainer}>
            <Image 
              src={logoPath} 
              style={styles.logo} 
            />
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
