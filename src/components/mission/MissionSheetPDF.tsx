
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { formatCurrency, formatDate } from '@/utils/validation';

// Register fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 10,
    flexShrink: 1,
  },
  logo: {
    width: 80,
    height: 60,
    objectFit: 'contain',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    padding: 5,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 3,
    paddingTop: 3,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 3,
    paddingTop: 3,
  },
  label: {
    width: '30%',
    fontWeight: 'bold',
  },
  value: {
    width: '70%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLogo: {
    width: 50,
    height: 30,
    objectFit: 'contain',
  },
  footerText: {
    flex: 1,
    textAlign: 'center',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    fontSize: 8,
  },
});

// Create Document Component
const MissionSheetPDF = ({ mission, clientProfile }: { mission: any, clientProfile: any }) => {
  const pickupAddress = mission.pickup_address ? 
    `${mission.pickup_address.street}, ${mission.pickup_address.postal_code} ${mission.pickup_address.city}, ${mission.pickup_address.country || 'France'}` : 
    'Non spécifiée';
  
  const deliveryAddress = mission.delivery_address ? 
    `${mission.delivery_address.street}, ${mission.delivery_address.postal_code} ${mission.delivery_address.city}, ${mission.delivery_address.country || 'France'}` : 
    'Non spécifiée';

  const formatFullPickupDate = () => {
    if (!mission.D1_PEC) return 'Non spécifiée';
    const date = formatDate(mission.D1_PEC);
    
    let time = '';
    if (mission.H1_PEC && mission.H2_PEC) {
      time = `entre ${mission.H1_PEC} et ${mission.H2_PEC}`;
    } else if (mission.H1_PEC) {
      time = `à partir de ${mission.H1_PEC}`;
    } else if (mission.H2_PEC) {
      time = `jusqu'à ${mission.H2_PEC}`;
    }
    
    return time ? `${date} ${time}` : date;
  };

  const formatFullDeliveryDate = () => {
    if (!mission.D2_LIV) return 'Non spécifiée';
    const date = formatDate(mission.D2_LIV);
    
    let time = '';
    if (mission.H1_LIV && mission.H2_LIV) {
      time = `entre ${mission.H1_LIV} et ${mission.H2_LIV}`;
    } else if (mission.H1_LIV) {
      time = `à partir de ${mission.H1_LIV}`;
    } else if (mission.H2_LIV) {
      time = `jusqu'à ${mission.H2_LIV}`;
    }
    
    return time ? `${date} ${time}` : date;
  };

  // Extraire le nom du convoyeur, ou utiliser DKAUTOMOTIVE par défaut
  const driverName = mission.chauffeur_profile?.full_name || 'DKAUTOMOTIVE';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text>DK AUTOMOTIVE SASU</Text>
            <Text>35 Chemin Du Vieux Chene</Text>
            <Text>38240 MEYLAN</Text>
            <Text>France</Text>
            <Text>SIRET: 92065077300013</Text>
          </View>
          <Image
            src="/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png"
            style={styles.logo}
          />
        </View>

        <Text style={styles.title}>FICHE DE MISSION {mission.mission_number || ''}</Text>

        {/* Section Convoyeur/Chauffeur */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>CONVOYEUR</Text>
          <View style={styles.row}>
            <Text>{driverName}</Text>
          </View>
        </View>

        {/* Section Adresses */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>ADRESSES</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Adresse d'enlèvement</Text>
            <Text style={styles.value}>{pickupAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date d'enlèvement</Text>
            <Text style={styles.value}>{formatFullPickupDate()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{mission.contact_pickup_name || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{mission.contact_pickup_phone || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{mission.contact_pickup_email || 'Non spécifié'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Adresse de livraison</Text>
            <Text style={styles.value}>{deliveryAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de livraison</Text>
            <Text style={styles.value}>{formatFullDeliveryDate()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{mission.contact_delivery_name || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone</Text>
            <Text style={styles.value}>{mission.contact_delivery_phone || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{mission.contact_delivery_email || 'Non spécifié'}</Text>
          </View>
        </View>

        {/* Section véhicule */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>INFORMATIONS VÉHICULE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Type de véhicule</Text>
            <Text style={styles.value}>{mission.vehicle_category || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Marque</Text>
            <Text style={styles.value}>{mission.vehicle_make || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Modèle</Text>
            <Text style={styles.value}>{mission.vehicle_model || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Année</Text>
            <Text style={styles.value}>{mission.vehicle_year || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Carburant</Text>
            <Text style={styles.value}>{mission.vehicle_fuel || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Immatriculation</Text>
            <Text style={styles.value}>{mission.vehicle_registration || 'Non spécifié'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Numéro de châssis</Text>
            <Text style={styles.value}>{mission.vehicle_vin || 'Non spécifié'}</Text>
          </View>
        </View>

        {/* Section Client */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>CLIENT</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{clientProfile?.company_name || ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact</Text>
            <Text style={styles.value}>{clientProfile?.full_name || ''}</Text>
          </View>
        </View>

        {/* Section Prix */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>INFORMATIONS MISSION</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Distance</Text>
            <Text style={styles.value}>{mission.distance_km} km</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Notes</Text>
            <Text style={styles.value}>{mission.notes || '-'}</Text>
          </View>
        </View>

        {/* Pied de page */}
        <View style={styles.footer}>
          <Image
            src="https://app-private.dkautomotive.fr/lovable-uploads/4f0af89a-3624-4a59-9623-2e9852b51049.png"
            style={styles.footerLogo}
          />
          <View style={styles.footerText}>
            <Text>DK AUTOMOTIVE SASU - 35 Chemin Du Vieux Chene, 38240 MEYLAN, France</Text>
            <Text>SIRET: 92065077300013 - TVA: FR83920650773</Text>
          </View>
        </View>
        
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} 
        />
      </Page>
    </Document>
  );
};

export default MissionSheetPDF;
