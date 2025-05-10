
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import { Mission } from '@/types/supabase';
import { formatMissionNumber, formatFullAddress, missionStatusLabels } from '@/utils/missionUtils';
import { vehicleCategoryLabels } from '@/types/supabase';

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
  status: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e6f7ff',
    borderRadius: 4,
    textAlign: 'center',
    fontWeight: 'bold',
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

// Fonction pour déterminer le préfixe du numéro de mission
const getMissionPrefix = (missionType?: string | null): string => {
  if (missionType?.toLowerCase().includes('livraison')) {
    return 'LIV';
  } else if (missionType?.toLowerCase().includes('restitution')) {
    return 'RES';
  } else {
    return 'MIS';
  }
};

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
  const missionNumber = formatMissionNumber(mission);
  const prefix = getMissionPrefix(mission.mission_type);
  const fullMissionNumber = `${prefix}-${missionNumber}`;
  
  // Catégorie de véhicule
  const vehicleCategory = mission.vehicle_category 
    ? vehicleCategoryLabels[mission.vehicle_category] 
    : 'Non spécifiée';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>FICHE DE MISSION</Text>
          <Text style={styles.subtitle}>{fullMissionNumber}</Text>
        </View>

        {/* Statut de la mission */}
        <View style={styles.status}>
          <Text>Statut: {missionStatusLabels[mission.status]}</Text>
        </View>

        {/* Adresses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adresses</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{...styles.label, marginBottom: 5}}>Adresse de départ:</Text>
              <Text>{formatFullAddress(mission.pickup_address)}</Text>
              
              {(mission.contact_pickup_name || mission.contact_pickup_phone || mission.contact_pickup_email) && (
                <View style={{marginTop: 8}}>
                  <Text style={{fontWeight: 'bold', marginBottom: 3}}>Contact:</Text>
                  {mission.contact_pickup_name && <Text>{mission.contact_pickup_name}</Text>}
                  {mission.contact_pickup_phone && <Text>{mission.contact_pickup_phone}</Text>}
                  {mission.contact_pickup_email && <Text>{mission.contact_pickup_email}</Text>}
                </View>
              )}
            </View>
            
            <View style={styles.halfColumn}>
              <Text style={{...styles.label, marginBottom: 5}}>Adresse de livraison:</Text>
              <Text>{formatFullAddress(mission.delivery_address)}</Text>
              
              {(mission.contact_delivery_name || mission.contact_delivery_phone || mission.contact_delivery_email) && (
                <View style={{marginTop: 8}}>
                  <Text style={{fontWeight: 'bold', marginBottom: 3}}>Contact:</Text>
                  {mission.contact_delivery_name && <Text>{mission.contact_delivery_name}</Text>}
                  {mission.contact_delivery_phone && <Text>{mission.contact_delivery_phone}</Text>}
                  {mission.contact_delivery_email && <Text>{mission.contact_delivery_email}</Text>}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Dates et créneaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dates et créneaux</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Date de départ:</Text>
              <Text>
                {mission.D1_PEC ? formatDate(mission.D1_PEC) : 'Non spécifiée'}
                {mission.H1_PEC && mission.H2_PEC 
                  ? ` entre ${formatTime(mission.H1_PEC)} et ${formatTime(mission.H2_PEC)}` 
                  : mission.H1_PEC 
                    ? ` à partir de ${formatTime(mission.H1_PEC)}` 
                    : ''}
              </Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Date de livraison:</Text>
              <Text>
                {mission.D2_LIV ? formatDate(mission.D2_LIV) : 'Non spécifiée'}
                {mission.H1_LIV && mission.H2_LIV 
                  ? ` entre ${formatTime(mission.H1_LIV)} et ${formatTime(mission.H2_LIV)}` 
                  : mission.H1_LIV 
                    ? ` à partir de ${formatTime(mission.H1_LIV)}` 
                    : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Informations véhicule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations véhicule</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Type de mission:</Text>
              <Text>{mission.mission_type || 'Non spécifié'}</Text>
            </View>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Catégorie de véhicule:</Text>
              <Text>{vehicleCategory}</Text>
            </View>
          </View>
          
          {(mission.vehicle_make || mission.vehicle_model || mission.vehicle_year || mission.vehicle_registration) && (
            <View style={{marginTop: 10}}>
              <View style={styles.row}>
                {mission.vehicle_make && (
                  <View style={styles.halfColumn}>
                    <Text style={{fontWeight: 'bold'}}>Marque:</Text>
                    <Text>{mission.vehicle_make}</Text>
                  </View>
                )}
                {mission.vehicle_model && (
                  <View style={styles.halfColumn}>
                    <Text style={{fontWeight: 'bold'}}>Modèle:</Text>
                    <Text>{mission.vehicle_model}</Text>
                  </View>
                )}
              </View>
              
              <View style={styles.row}>
                {mission.vehicle_year && (
                  <View style={styles.halfColumn}>
                    <Text style={{fontWeight: 'bold'}}>Année:</Text>
                    <Text>{mission.vehicle_year}</Text>
                  </View>
                )}
                {mission.vehicle_registration && (
                  <View style={styles.halfColumn}>
                    <Text style={{fontWeight: 'bold'}}>Immatriculation:</Text>
                    <Text>{mission.vehicle_registration}</Text>
                  </View>
                )}
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

        {/* Information chauffeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information chauffeur</Text>
          <View style={styles.row}>
            <View style={styles.halfColumn}>
              <Text style={{fontWeight: 'bold'}}>Chauffeur assigné:</Text>
              <Text>{driverName}</Text>
            </View>
            {mission.chauffeur_price_ht !== undefined && mission.chauffeur_price_ht > 0 && (
              <View style={styles.halfColumn}>
                <Text style={{fontWeight: 'bold'}}>Rémunération chauffeur (HT):</Text>
                <Text>{mission.chauffeur_price_ht.toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                })}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance</Text>
          <Text>{mission.distance_km?.toFixed(2) || '0'} km</Text>
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
