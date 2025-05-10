
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { formatFullAddress } from '@/utils/missionUtils';

// Enregistrer les polices
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#fff',
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
    padding: '5 10',
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
  halfColumn: {
    width: '50%',
  },
  contactBlock: {
    marginTop: 8,
    paddingLeft: 0,
  },
  contactLabel: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  contactInfo: {
    marginBottom: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
    borderTop: '1pt solid #ccc',
    paddingTop: 10,
  },
});

// Formater la date
const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'Non spécifiée';
  
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return 'Date invalide';
  }
};

// Formater l'heure
const formatTime = (timeStr?: string | null): string => {
  if (!timeStr) return '';
  return timeStr;
};

interface MissionSheetPDFProps {
  mission: Mission;
  driverName?: string;
}

export const MissionSheetPDF: React.FC<MissionSheetPDFProps> = ({ mission, driverName = 'Non assigné' }) => {
  // Utiliser directement le mission_type et mission_number de la mission
  const missionType = mission.mission_type || 'MIS';
  const missionNumber = mission.mission_number || '';
  const fullMissionNumber = `${missionType}-${missionNumber}`;
  const distanceKm = mission.distance_km?.toFixed(2) || '0';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHE DE MISSION</Text>
          <Text style={styles.subtitle}>{fullMissionNumber}</Text>
        </View>

        {/* Adresses avec distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresses ({distanceKm} km)</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{...styles.label, marginBottom: 5}}>Adresse de départ:</Text>
              <Text>{formatFullAddress(mission.pickup_address)}</Text>
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={{...styles.label, marginBottom: 5}}>Adresse de livraison:</Text>
              <Text>{formatFullAddress(mission.delivery_address)}</Text>
            </View>
          </View>
        </View>

        {/* Rendez-vous (ancien Dates et créneaux) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RDV</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Départ:</Text>
              <Text>
                {mission.D1_PEC ? formatDate(mission.D1_PEC) : 'Non spécifiée'}
                {mission.H1_PEC && mission.H2_PEC 
                  ? ` entre ${formatTime(mission.H1_PEC)} et ${formatTime(mission.H2_PEC)}` 
                  : mission.H1_PEC 
                    ? ` à partir de ${formatTime(mission.H1_PEC)}` 
                    : ''}
              </Text>
              
              {(mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email) && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Contact:</Text>
                  {mission.contact_pickup_name && <Text style={styles.contactInfo}>{mission.contact_pickup_name}</Text>}
                  {mission.contact_pickup_phone && <Text style={styles.contactInfo}>{mission.contact_pickup_phone}</Text>}
                  {mission.contact_pickup_email && <Text style={styles.contactInfo}>{mission.contact_pickup_email}</Text>}
                </View>
              )}
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Livraison:</Text>
              <Text>
                {mission.D2_LIV ? formatDate(mission.D2_LIV) : 'Non spécifiée'}
                {mission.H1_LIV && mission.H2_LIV 
                  ? ` entre ${formatTime(mission.H1_LIV)} et ${formatTime(mission.H2_LIV)}` 
                  : mission.H1_LIV 
                    ? ` à partir de ${formatTime(mission.H1_LIV)}` 
                    : ''}
              </Text>
              
              {(mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email) && (
                <View style={styles.contactBlock}>
                  <Text style={styles.contactLabel}>Contact:</Text>
                  {mission.contact_delivery_name && <Text style={styles.contactInfo}>{mission.contact_delivery_name}</Text>}
                  {mission.contact_delivery_phone && <Text style={styles.contactInfo}>{mission.contact_delivery_phone}</Text>}
                  {mission.contact_delivery_email && <Text style={styles.contactInfo}>{mission.contact_delivery_email}</Text>}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Informations véhicule (simplifiées) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations véhicule</Text>
          
          {/* Véhicule: marque + modèle combinés */}
          {(mission.vehicle_make || mission.vehicle_model) && (
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={{fontWeight: 'bold'}}>Véhicule:</Text>
                <Text>{[mission.vehicle_make, mission.vehicle_model].filter(Boolean).join(' ')}</Text>
              </View>
            </View>
          )}
          
          {mission.vehicle_registration && (
            <View style={styles.row}>
              <View style={styles.halfColumn}>
                <Text style={{fontWeight: 'bold'}}>Immatriculation:</Text>
                <Text>{mission.vehicle_registration}</Text>
              </View>
            </View>
          )}
          
          {mission.vehicle_vin && (
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={{fontWeight: 'bold'}}>VIN:</Text>
                <Text>{mission.vehicle_vin}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Notes */}
        {mission.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes complémentaires</Text>
            <Text>{mission.notes}</Text>
          </View>
        )}

        {/* Pied de page */}
        <View style={styles.footer}>
          <Text>Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}</Text>
        </View>
      </Page>
    </Document>
  );
};
