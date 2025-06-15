import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, ArrowRight, ArrowLeft, Check, Calculator, Calendar, Clock, FileText, ArrowLeftRight, ArrowUpDown, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { typedSupabase } from '@/types/database';
import { vehicleCategoryLabels, VehicleCategory, MissionStatus, Mission } from '@/types/supabase';
import { Address } from '@/types/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { TimeSelect } from '@/components/ui/time-select';
import { format } from 'date-fns';
import { useProfiles, ProfileOption } from '@/hooks/useProfiles';
import ContactSelector from './ContactSelector';
import { Contact } from '@/types/contact';

// Étape 1: Type de mission
const missionTypeSchema = z.object({
  mission_type: z.enum(['LIV', 'RES'], {
    required_error: 'Veuillez sélectionner un type de mission'
  })
});

// Étape 2: Véhicule, adresses et prix
const vehicleAndAddressSchema = z.object({
  vehicle_category: z.enum(['citadine', 'berline', '4x4_suv', 'utilitaire_3_5m3', 'utilitaire_6_12m3', 'utilitaire_12_15m3', 'utilitaire_15_20m3', 'utilitaire_plus_20m3'], {
    required_error: 'Veuillez sélectionner un type de véhicule'
  }),
  pickup_address: z.string().min(1, 'L\'adresse de départ est requise'),
  pickup_address_data: z.any().optional(),
  delivery_address: z.string().min(1, 'L\'adresse de livraison est requise'),
  delivery_address_data: z.any().optional(),
  distance_km: z.number().optional(),
  price_ht: z.number().optional(),
  price_ttc: z.number().optional(),
  vehicle_id: z.number().nullable().optional()
});

// Étape 3: Information du véhicule - VIN devient optionnel
const vehicleInfoSchema = z.object({
  vehicle_make: z.string().min(1, 'La marque du véhicule est requise'),
  vehicle_model: z.string().min(1, 'Le modèle du véhicule est requis'),
  vehicle_fuel: z.string().min(1, 'Le type de carburant est requis'),
  vehicle_year: z.number().int().positive().optional(),
  vehicle_registration: z.string().min(1, 'L\'immatriculation est requise'),
  vehicle_vin: z.string().optional() // VIN est maintenant optionnel
});

// Fonction pour comparer deux horaires (pour validation)
const parseTime = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Créer le schéma de base pour l'étape 4
const baseContactsAndNotesSchema = z.object({
  contact_pickup_name: z.string().min(1, 'Le nom du contact de départ est requis'),
  contact_pickup_phone: z.string().min(1, 'Le téléphone du contact de départ est requis'),
  contact_pickup_email: z.string().min(1, 'L\'email du contact de départ est requis').email('Email invalide'),
  // Nouveaux champs pour créneaux de ramassage
  D1_PEC: z.date({
    required_error: 'La date de ramassage est requise'
  }),
  H1_PEC: z.string().min(1, 'L\'heure de début de ramassage est requise'),
  H2_PEC: z.string().min(1, 'L\'heure de fin de ramassage est requise'),
  contact_delivery_name: z.string().min(1, 'Le nom du contact de livraison est requis'),
  contact_delivery_phone: z.string().min(1, 'Le téléphone du contact de livraison est requis'),
  contact_delivery_email: z.string().min(1, 'L\'email du contact de livraison est requis').email('Email invalide'),
  // Nouveaux champs pour créneaux de livraison
  D2_LIV: z.date({
    required_error: 'La date de livraison est requise'
  }),
  H1_LIV: z.string().min(1, 'L\'heure de début de livraison est requise'),
  H2_LIV: z.string().min(1, 'L\'heure de fin de livraison est requise'),
  notes: z.string().optional()
});

// Fonctions de validation personnalisées
const contactsAndNotesSchema = baseContactsAndNotesSchema.superRefine((data, ctx) => {
  // Valider que l'heure de fin de ramassage est après l'heure de début
  if (data.H1_PEC && data.H2_PEC) {
    const h1PecTime = parseTime(data.H1_PEC);
    const h2PecTime = parseTime(data.H2_PEC);
    if (h2PecTime <= h1PecTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure de fin de ramassage doit être ultérieure à l'heure de début (au moins 15 minutes d'écart)",
        path: ["H2_PEC"]
      });
    }
  }

  // Valider que l'heure de fin de livraison est après l'heure de début
  if (data.H1_LIV && data.H2_LIV) {
    const h1LivTime = parseTime(data.H1_LIV);
    const h2LivTime = parseTime(data.H2_LIV);
    if (h2LivTime <= h1LivTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'heure de fin de livraison doit être ultérieure à l'heure de début (au moins 15 minutes d'écart)",
        path: ["H2_LIV"]
      });
    }
  }

  // Vérifier que la date de livraison est égale ou postérieure à la date de ramassage
  if (data.D1_PEC && data.D2_LIV) {
    const pickupDate = new Date(data.D1_PEC);
    const deliveryDate = new Date(data.D2_LIV);
    if (deliveryDate < pickupDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de livraison doit être égale ou ultérieure à la date de ramassage",
        path: ["D2_LIV"]
      });
    }
  }
});

// Étape 5: Attribution (Admin seulement)
const attributionSchema = z.object({
  client_id: z.string().uuid().optional(),
  status: z.enum(['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident']).default('en_acceptation'),
  chauffeur_id: z.string().nullable().optional(),
  chauffeur_price_ht: z.number().optional()
});

// Schéma complet - On utilise spread pour ajouter correctement les propriétés
const createMissionSchema = z.object({
  mission_type: missionTypeSchema.shape.mission_type,
  // Étape 2
  vehicle_category: vehicleAndAddressSchema.shape.vehicle_category,
  pickup_address: vehicleAndAddressSchema.shape.pickup_address,
  pickup_address_data: vehicleAndAddressSchema.shape.pickup_address_data,
  delivery_address: vehicleAndAddressSchema.shape.delivery_address,
  delivery_address_data: vehicleAndAddressSchema.shape.delivery_address_data,
  distance_km: vehicleAndAddressSchema.shape.distance_km,
  price_ht: vehicleAndAddressSchema.shape.price_ht,
  price_ttc: vehicleAndAddressSchema.shape.price_ttc,
  vehicle_id: vehicleAndAddressSchema.shape.vehicle_id,
  // Étape 3
  vehicle_make: vehicleInfoSchema.shape.vehicle_make,
  vehicle_model: vehicleInfoSchema.shape.vehicle_model,
  vehicle_fuel: vehicleInfoSchema.shape.vehicle_fuel,
  vehicle_year: vehicleInfoSchema.shape.vehicle_year,
  vehicle_registration: vehicleInfoSchema.shape.vehicle_registration,
  vehicle_vin: vehicleInfoSchema.shape.vehicle_vin,
  // Étape 4 - Nous utilisons directement le schéma de base, puis appliquons la validation raffinée
  ...baseContactsAndNotesSchema.shape,
  // Étape 5
  client_id: attributionSchema.shape.client_id,
  status: attributionSchema.shape.status,
  chauffeur_id: attributionSchema.shape.chauffeur_id,
  chauffeur_price_ht: attributionSchema.shape.chauffeur_price_ht
});
type CreateMissionFormValues = z.infer<typeof createMissionSchema>;
export default function CreateMissionForm({
  onSuccess,
  onDirtyChange,
  livMission
}: {
  onSuccess?: (missionId: string) => void;
  onDirtyChange?: (isDirty: boolean) => void;
  livMission?: Mission | null;
}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    user,
    profile
  } = useAuth();
  const {
    computePrice,
    prices
  } = usePricing();
  const {
    calculateDistance
  } = useGooglePlaces();
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [pickupAddressData, setPickupAddressData] = useState<any>(null);
  const [deliveryAddressData, setDeliveryAddressData] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const totalSteps = profile?.role === 'admin' ? 5 : 4; // Pour les clients, pas d'étape d'attribution

  const {
    profiles: clientProfiles,
    loading: loadingClients
  } = useProfiles('client');
  const {
    profiles: driverProfiles,
    loading: loadingDrivers
  } = useProfiles('chauffeur');
  const form = useForm<CreateMissionFormValues>({
    resolver: zodResolver(createMissionSchema),
    mode: 'onSubmit',
    // Changement important: n'affiche les erreurs qu'après soumission
    defaultValues: {
      mission_type: livMission ? 'RES' : undefined,
      vehicle_category: undefined,
      pickup_address: '',
      delivery_address: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_fuel: '',
      vehicle_registration: '',
      vehicle_vin: '',
      contact_pickup_name: '',
      contact_pickup_phone: '',
      contact_pickup_email: '',
      contact_delivery_name: '',
      contact_delivery_phone: '',
      contact_delivery_email: '',
      notes: '',
      status: 'en_acceptation',
      chauffeur_id: null,
      chauffeur_price_ht: 0,
      vehicle_id: null,
      D1_PEC: undefined,
      H1_PEC: '',
      H2_PEC: '',
      D2_LIV: undefined,
      H1_LIV: '',
      H2_LIV: ''
    }
  });

  // Observer l'état "dirty" du formulaire et le communiquer au parent
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(form.formState.isDirty);
    }
  }, [form.formState.isDirty, onDirtyChange]);

  // Si le rôle est admin, initialiser le client_id avec undefined
  useEffect(() => {
    if (profile?.role === 'admin') {
      form.setValue('client_id', undefined);
    }
  }, [profile, form]);

  // Pre-fill form when creating RES from LIV
  useEffect(() => {
    if (livMission) {
      console.log('Pre-filling form with LIV mission data:', livMission);

      // Set mission type to RES
      form.setValue('mission_type', 'RES');

      // Invert addresses and lock them
      if (livMission.delivery_address?.formatted_address) {
        form.setValue('pickup_address', livMission.delivery_address.formatted_address);
        setPickupAddressData(livMission.delivery_address);
      }
      if (livMission.pickup_address?.formatted_address) {
        form.setValue('delivery_address', livMission.pickup_address.formatted_address);
        setDeliveryAddressData(livMission.pickup_address);
      }

      // Set vehicle category but don't copy other vehicle info (user will fill new vehicle)
      if (livMission.vehicle_category) {
        form.setValue('vehicle_category', livMission.vehicle_category);
      }

      // Invert contacts
      if (livMission.contact_delivery_name) {
        form.setValue('contact_pickup_name', livMission.contact_delivery_name);
      }
      if (livMission.contact_delivery_phone) {
        form.setValue('contact_pickup_phone', livMission.contact_delivery_phone);
      }
      if (livMission.contact_delivery_email) {
        form.setValue('contact_pickup_email', livMission.contact_delivery_email);
      }
      if (livMission.contact_pickup_name) {
        form.setValue('contact_delivery_name', livMission.contact_pickup_name);
      }
      if (livMission.contact_pickup_phone) {
        form.setValue('contact_delivery_phone', livMission.contact_pickup_phone);
      }
      if (livMission.contact_pickup_email) {
        form.setValue('contact_delivery_email', livMission.contact_pickup_email);
      }

      // Lock pickup date/time to LIV delivery date/time
      if (livMission.D2_LIV) {
        form.setValue('D1_PEC', new Date(livMission.D2_LIV));
      }
      if (livMission.H1_LIV) {
        form.setValue('H1_PEC', livMission.H1_LIV);
      }
      if (livMission.H2_LIV) {
        form.setValue('H2_PEC', livMission.H2_LIV);
      }

      // Pre-select client and driver for admin
      if (profile?.role === 'admin') {
        if (livMission.client_id) {
          form.setValue('client_id', livMission.client_id);
          setSelectedClientId(livMission.client_id);
        }
        if (livMission.chauffeur_id) {
          form.setValue('chauffeur_id', livMission.chauffeur_id);
        }
      }
    }
  }, [livMission, form, profile]);

  // Déterminer le schéma à utiliser en fonction de l'étape actuelle et obtenir les noms des champs
  const getCurrentSchemaFields = (step: number): string[] => {
    switch (step) {
      case 1:
        return Object.keys(missionTypeSchema.shape);
      case 2:
        return Object.keys(vehicleAndAddressSchema.shape);
      case 3:
        return Object.keys(vehicleInfoSchema.shape);
      case 4:
        // Pour le schéma avec superRefine, on utilise le schéma de base pour obtenir les noms des champs
        return Object.keys(baseContactsAndNotesSchema.shape);
      case 5:
        return Object.keys(attributionSchema.shape);
      default:
        return Object.keys(missionTypeSchema.shape);
    }
  };

  // Lorsqu'un client est sélectionné dans le dropdown
  const handleClientChange = (clientId: string) => {
    console.log('Client sélectionné:', clientId);
    setSelectedClientId(clientId);
    form.setValue('client_id', clientId);
  };
  async function calculatePrice() {
    try {
      setCalculatingPrice(true);

      // Vérifier si nous avons les données d'adresse nécessaires
      if (!pickupAddressData || !deliveryAddressData) {
        toast.error('Veuillez sélectionner des adresses valides avant de calculer le prix');
        setCalculatingPrice(false);
        return;
      }
      const vehicleCategory = form.getValues('vehicle_category') as VehicleCategory;
      if (!vehicleCategory) {
        toast.error('Veuillez sélectionner un type de véhicule avant de calculer le prix');
        setCalculatingPrice(false);
        return;
      }

      // Extraire les coordonnées des adresses de manière sécurisée
      const getCoordinates = (addressData: any) => {
        if (addressData.lat && addressData.lng) {
          return {
            lat: addressData.lat,
            lng: addressData.lng
          };
        }
        if (addressData.geometry?.location) {
          const location = addressData.geometry.location;
          return {
            lat: typeof location.lat === 'function' ? location.lat() : location.lat,
            lng: typeof location.lng === 'function' ? location.lng() : location.lng
          };
        }
        return null;
      };
      const pickupCoords = getCoordinates(pickupAddressData);
      const deliveryCoords = getCoordinates(deliveryAddressData);
      if (!pickupCoords?.lat || !pickupCoords?.lng || !deliveryCoords?.lat || !deliveryCoords?.lng) {
        toast.error('Les coordonnées des adresses sont invalides');
        setCalculatingPrice(false);
        return;
      }
      console.log("Coordonnées de départ:", pickupCoords);
      console.log("Coordonnées d'arrivée:", deliveryCoords);

      // Utiliser directement l'instance de calculateDistance du hook
      const result = await calculateDistance(pickupCoords, deliveryCoords);
      if (!result) {
        toast.error('Impossible de calculer la distance entre les adresses');
        setCalculatingPrice(false);
        return;
      }

      // Utiliser la valeur numérique précise de la distance au lieu de parser le texte
      const distanceKm = result.distanceValue / 1000;
      console.log("Distance calculée:", distanceKm, "km");

      // Calculer le prix basé sur la distance et le type de véhicule
      let priceResult = await computePrice(distanceKm, vehicleCategory);
      if (!priceResult) {
        toast.error('Impossible de calculer le prix pour cette distance');
        setCalculatingPrice(false);
        return;
      }

      // Appliquer remise de 30% pour les missions RES
      if (livMission) {
        priceResult = {
          ...priceResult,
          priceHT: Math.round(priceResult.priceHT * 0.7 * 100) / 100,
          priceTTC: Math.round(priceResult.priceTTC * 0.7 * 100) / 100
        };
      }
      form.setValue('distance_km', Math.round(distanceKm * 100) / 100);
      form.setValue('price_ht', priceResult.priceHT);
      form.setValue('price_ttc', priceResult.priceTTC);

      // Ajouter le vehicle_id si disponible
      if (priceResult.vehicleId) {
        form.setValue('vehicle_id', priceResult.vehicleId);
        console.log('Vehicle ID set to:', priceResult.vehicleId);
      }
      console.log("Prix calculé:", priceResult);
      toast.success(`Prix calculé avec succès: ${priceResult.priceTTC.toFixed(2)} € TTC${livMission ? ' (remise 30%)' : ''}`);
    } catch (error) {
      console.error('Erreur lors du calcul de la distance:', error);
      toast.error('Une erreur est survenue lors du calcul du prix');
    } finally {
      setCalculatingPrice(false);
    }
  }
  const nextStep = async () => {
    setFormTouched(true);

    // Obtenir les noms des champs à valider pour l'étape actuelle
    const fieldNames = getCurrentSchemaFields(currentStep);
    const isValid = await form.trigger(fieldNames as any);
    if (!isValid) return;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    setFormTouched(false); // Réinitialiser formTouched pour la nouvelle étape
  };
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setFormTouched(false); // Réinitialiser formTouched pour la nouvelle étape
  };
  const onSelectPickupAddress = (address: string, placeId: string, addressData?: any) => {
    form.setValue('pickup_address', address);
    setPickupAddressData(addressData);
    form.setValue('pickup_address_data', addressData);
  };
  const onSelectDeliveryAddress = (address: string, placeId: string, addressData?: any) => {
    form.setValue('delivery_address', address);
    setDeliveryAddressData(addressData);
    form.setValue('delivery_address_data', addressData);
  };
  const onSubmit = async (values: CreateMissionFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Début de la soumission du formulaire avec les valeurs:", values);

      // S'assurer que toutes les données requises sont présentes
      if (!values.distance_km || !values.price_ht || !values.price_ttc) {
        toast.error('Veuillez calculer le prix avant de créer la mission');
        setIsSubmitting(false);
        return;
      }

      // Déterminer le client_id à utiliser
      let clientId = null;
      if (profile?.role === 'admin') {
        if (values.client_id && values.client_id !== 'no_client_selected') {
          clientId = values.client_id;
          console.log("Admin: client_id from values =", clientId);
        } else {
          toast.error('Aucun client n\'a été sélectionné');
          setIsSubmitting(false);
          return;
        }
      } else if (profile?.role === 'client' && user?.id) {
        clientId = user.id;
        console.log("Client: client_id (user.id) =", clientId);
      } else {
        toast.error('Impossible de déterminer le client pour cette mission');
        setIsSubmitting(false);
        return;
      }
      if (!clientId) {
        toast.error('Aucun client valide n\'a été trouvé ou sélectionné');
        setIsSubmitting(false);
        return;
      }
      let chauffeurId = values.chauffeur_id;
      if (!chauffeurId || chauffeurId === "no_driver_assigned") {
        chauffeurId = null;
      }

      // Préparer les données d'adresse pour la base de données
      const pickupAddressData = values.pickup_address_data || {
        formatted_address: values.pickup_address
      };
      const deliveryAddressData = values.delivery_address_data || {
        formatted_address: values.delivery_address
      };
      const pickupAddressJson = pickupAddressData ? JSON.parse(JSON.stringify(pickupAddressData)) : {
        formatted_address: values.pickup_address
      };
      const deliveryAddressJson = deliveryAddressData ? JSON.parse(JSON.stringify(deliveryAddressData)) : {
        formatted_address: values.delivery_address
      };

      // Préparer les données pour les nouveaux champs date/heure
      let formattedD1PEC = null;
      let formattedD2LIV = null;
      if (values.D1_PEC) {
        formattedD1PEC = format(values.D1_PEC, 'yyyy-MM-dd');
      }
      if (values.D2_LIV) {
        formattedD2LIV = format(values.D2_LIV, 'yyyy-MM-dd');
      }
      const missionData = {
        client_id: clientId,
        status: values.status || 'en_acceptation',
        pickup_address: pickupAddressJson,
        delivery_address: deliveryAddressJson,
        distance_km: values.distance_km,
        price_ht: values.price_ht,
        price_ttc: values.price_ttc,
        vehicle_category: values.vehicle_category,
        vehicle_id: values.vehicle_id || null,
        vehicle_make: values.vehicle_make,
        vehicle_model: values.vehicle_model,
        vehicle_fuel: values.vehicle_fuel,
        vehicle_year: values.vehicle_year ? parseInt(String(values.vehicle_year)) : null,
        vehicle_registration: values.vehicle_registration,
        vehicle_vin: values.vehicle_vin || null,
        contact_pickup_name: values.contact_pickup_name,
        contact_pickup_phone: values.contact_pickup_phone,
        contact_pickup_email: values.contact_pickup_email,
        D1_PEC: formattedD1PEC,
        H1_PEC: values.H1_PEC,
        H2_PEC: values.H2_PEC,
        contact_delivery_name: values.contact_delivery_name,
        contact_delivery_phone: values.contact_delivery_phone,
        contact_delivery_email: values.contact_delivery_email,
        D2_LIV: formattedD2LIV,
        H1_LIV: values.H1_LIV,
        H2_LIV: values.H2_LIV,
        notes: values.notes,
        chauffeur_id: chauffeurId,
        chauffeur_price_ht: values.chauffeur_price_ht || 0,
        created_by: user?.id || '',
        scheduled_date: new Date().toISOString(),
        vat_rate: 20,
        mission_type: values.mission_type || 'LIV',
        linked_mission_id: livMission ? livMission.id : null,
        is_linked: livMission ? true : false
      };
      console.log("Mission data to save:", JSON.stringify(missionData, null, 2));
      const {
        data,
        error
      } = await typedSupabase.from('missions').insert(missionData).select('id').single();
      if (error) {
        console.error('Erreur Supabase lors de la création de la mission:', error);
        toast.error(`Erreur lors de la création de la mission: ${error.message}`);
        return;
      }
      console.log("Mission créée avec succès, données retournées:", data);
      toast.success('Mission créée avec succès');
      if (onSuccess && data?.id) {
        onSuccess(data.id);
      } else {
        if (profile?.role === 'admin') {
          navigate('/admin/missions');
        } else {
          navigate('/client/missions');
        }
      }
    } catch (error: any) {
      console.error('Erreur globale lors de la création de la mission:', error);
      toast.error(`Une erreur est survenue lors de la création de la mission: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fonctions pour gérer les contacts sélectionnés
  const handlePickupContactSelect = (contact: Contact) => {
    form.setValue('contact_pickup_name', contact.name_s || '');
    if (contact.email) form.setValue('contact_pickup_email', contact.email);
    if (contact.phone) form.setValue('contact_pickup_phone', contact.phone);
    toast.success(`Contact de départ sélectionné: ${contact.name_s || 'Sans nom'}`);
  };
  const handleDeliveryContactSelect = (contact: Contact) => {
    form.setValue('contact_delivery_name', contact.name_s || '');
    if (contact.email) form.setValue('contact_delivery_email', contact.email);
    if (contact.phone) form.setValue('contact_delivery_phone', contact.phone);
    toast.success(`Contact de livraison sélectionné: ${contact.name_s || 'Sans nom'}`);
  };

  // Type guard pour vérifier si error est un FieldError
  const getErrorMessageAsString = (error: any): string | undefined => {
    if (error && typeof error === 'object' && 'message' in error) {
      return error.message as string;
    }
    if (typeof error === 'string') {
      return error;
    }
    return undefined;
  };

  // Fonction pour échanger les adresses
  const swapAddresses = () => {
    if (livMission) {
      toast.error('Impossible d\'échanger les adresses pour une mission RES liée');
      return;
    }
    const currentPickupAddress = form.getValues('pickup_address');
    const currentDeliveryAddress = form.getValues('delivery_address');

    // Échanger les valeurs des champs
    form.setValue('pickup_address', currentDeliveryAddress);
    form.setValue('delivery_address', currentPickupAddress);

    // Échanger les données d'adresse
    const tempPickupData = pickupAddressData;
    setPickupAddressData(deliveryAddressData);
    setDeliveryAddressData(tempPickupData);

    // Mettre à jour les données dans le formulaire
    form.setValue('pickup_address_data', deliveryAddressData);
    form.setValue('delivery_address_data', tempPickupData);
    toast.success('Adresses échangées avec succès');
  };
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {livMission ? 'Créer une mission de restitution (RES)' : 'Créer une nouvelle mission'}
        </CardTitle>
        <CardDescription>
          Étape {currentStep} sur {totalSteps}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Étape 1: Type de mission */}
            {currentStep === 1 && <div className="space-y-4">
                <FormField control={form.control} name="mission_type" render={({
              field
            }) => <FormItem className="space-y-3">
                      <FormLabel>Type de mission</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4" disabled={!!livMission}>
                          <FormItem>
                            <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary ${livMission ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <FormControl>
                                <RadioGroupItem value="LIV" className="sr-only" disabled={!!livMission} />
                              </FormControl>
                              <div className="text-center space-y-2">
                                <div className="text-4xl mb-2">🚚</div>
                                <div className="font-semibold">Livraison</div>
                                <div className="text-xs text-muted-foreground">
                                  Livraison d'un véhicule d'un point A vers un point B
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem>
                            <FormLabel className={`flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary ${livMission ? 'border-primary' : ''}`}>
                              <FormControl>
                                <RadioGroupItem value="RES" className="sr-only" />
                              </FormControl>
                              <div className="text-center space-y-2">
                                <div className="text-4xl mb-2">🔄</div>
                                <div className="font-semibold">Restitution</div>
                                <div className="text-xs text-muted-foreground">
                                  Restitution d'un véhicule au client ou à un autre point
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>}

            {/* Étape 2: Sélection du véhicule, adresses et prix */}
            {currentStep === 2 && <div className="space-y-6">
                {/* Sélecteur du véhicule inchangé */}
                <FormField control={form.control} name="vehicle_category" render={({
              field
            }) => <FormItem>
                      <FormLabel>Type de véhicule</FormLabel>
                      <Select onValueChange={value => field.onChange(value as VehicleCategory)} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type de véhicule" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(vehicleCategoryLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ce choix déterminera le tarif applicable à cette mission.
                        {livMission && <span className="text-blue-600 block">Catégorie modifiable • Prix avec remise 30%</span>}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                {/* Nouveau bloc adresses et swap */}
                <div className="flex w-full max-w-2xl mx-auto">
                  {/* Colonne icônes */}
                  <div className="flex flex-col items-center justify-center py-2 mr-3 select-none" style={{width:32}}>
                    {/* Cercle noir (départ) */}
                    <div className="w-4 h-4 rounded-full border-2 border-black bg-white mb-1" />
                    {/* Pointillés verticaux */}
                    <div className="flex flex-col items-center flex-1 my-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="w-1 h-1 rounded-full bg-gray-300 mb-1" />
                      ))}
                    </div>
                    {/* Pin rouge (Lucide ou SVG) */}
                    <svg width={20} height={20} viewBox="0 0 22 22" className="mt-1" fill="none">
                      <circle cx="11" cy="11" r="10" stroke="#F87171" strokeWidth="1.5" fill="none"/>
                      <path d="M11 5.5C8.24 5.5 6 7.72 6 10.46c0 2.67 2.18 5.29 4.07 7.12a1 1 0 0 0 1.42 0C15.82 15.75 18 13.13 18 10.46 18 7.72 15.76 5.5 13 5.5Zm0 5.13a2.13 2.13 0 1 1 0-4.26 2.13 2.13 0 0 1 0 4.26Z" stroke="#F87171" strokeWidth="1" fill="none"/>
                      <circle cx="11" cy="9.5" r="1.2" fill="#F87171" />
                    </svg>
                  </div>
                  {/* Colonne champs */}
                  <div className="flex flex-col justify-center flex-grow gap-2 min-w-0">
                    <FormField control={form.control} name="pickup_address" render={({ field }) => 
                      <FormItem>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={value => field.onChange(value)}
                            onSelect={(address, placeId) => {
                              onSelectPickupAddress(address, placeId, window.selectedAddressData);
                            }}
                            placeholder="Saisissez l'adresse de départ"
                            error={formTouched ? getErrorMessageAsString(form.formState.errors.pickup_address) : undefined}
                            disabled={!!livMission}
                            className="w-full max-w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    } />
                    <FormField control={form.control} name="delivery_address" render={({ field }) => 
                      <FormItem>
                        <FormControl>
                          <AddressAutocomplete
                            value={field.value}
                            onChange={value => field.onChange(value)}
                            onSelect={(address, placeId) => {
                              onSelectDeliveryAddress(address, placeId, window.selectedAddressData);
                            }}
                            placeholder="Saisissez l'adresse de livraison"
                            error={formTouched ? getErrorMessageAsString(form.formState.errors.delivery_address) : undefined}
                            disabled={!!livMission}
                            className="w-full max-w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    } />
                  </div>
                  {/* Colonne bouton swap */}
                  <div className="flex flex-col items-center justify-center ml-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={swapAddresses}
                      disabled={!!livMission}
                      className="rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 shadow-none w-10 h-10 flex items-center justify-center"
                      aria-label="Échanger les adresses"
                      tabIndex={0}
                    >
                      <ArrowUpDown className="h-5 w-5 text-gray-600" />
                    </Button>
                  </div>
                </div>
                {/* Calcul et résultats prix/distance identique */}
                <div className="flex justify-center my-4">
                  <Button type="button" variant="outline" onClick={calculatePrice} disabled={calculatingPrice} className="flex items-center gap-2">
                    {calculatingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                    Calculer le prix{livMission ? ' (remise 30%)' : ''}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="distance_km" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Distance (km)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value ? field.value.toFixed(2) : ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  <FormField control={form.control} name="price_ht" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Prix HT (€)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value ? field.value.toFixed(2) : ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  <FormField control={form.control} name="price_ttc" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Prix TTC (€)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value ? field.value.toFixed(2) : ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                </div>
              </div>}

            {/* Étape 3: Informations du véhicule - Tous les champs déverrouillés */}
            {currentStep === 3 && <div className="space-y-6">
                {livMission && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Nouveau véhicule :</strong> Saisissez les informations du véhicule à restituer (peut être différent de la mission LIV)
                    </p>
                  </div>}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehicle_make" render={({
                field
              }) => <FormItem>
                        <FormLabel>Marque du véhicule *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Renault, Peugeot" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="vehicle_model" render={({
                field
              }) => <FormItem>
                        <FormLabel>Modèle *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Clio, 308" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehicle_fuel" render={({
                field
              }) => <FormItem>
                        <FormLabel>Carburant *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner le type de carburant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Diesel">Diesel</SelectItem>
                            <SelectItem value="Essence">Essence</SelectItem>
                            <SelectItem value="Hybride">Hybride</SelectItem>
                            <SelectItem value="Électrique">Électrique</SelectItem>
                            <SelectItem value="GPL">GPL</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="vehicle_year" render={({
                field
              }) => <FormItem>
                        <FormLabel>Année</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="1900" max="2100" placeholder="Ex: 2020" value={field.value || ''} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="vehicle_registration" render={({
                field
              }) => <FormItem>
                        <FormLabel>Immatriculation *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: AB-123-CD" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                  <FormField control={form.control} name="vehicle_vin" render={({
                field
              }) => <FormItem>
                        <FormLabel>Numéro VIN (Numéro de châssis)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: WVWZZZ1JZXW000001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />
                </div>
              </div>}

            {/* Étape 4: Contacts inversés et créneaux */}
            {currentStep === 4 && <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Contact au lieu de départ
                        {livMission && <span className="text-blue-600 text-sm block">(Contact de livraison de la mission LIV)</span>}
                      </h3>
                      <ContactSelector onSelectContact={handlePickupContactSelect} clientId={selectedClientId || undefined} />
                    </div>
                    
                    <FormField control={form.control} name="contact_pickup_name" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Nom / Société *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom complet ou société" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="contact_pickup_phone" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Téléphone *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Numéro de téléphone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="contact_pickup_email" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Adresse email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <div className="space-y-4">
                      <h4 className="text-md font-medium">
                        Créneau de ramassage
                        {livMission && <span className="text-blue-600 text-sm block">(Verrouillé - Créneau de livraison de la mission LIV)</span>}
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="D1_PEC" render={({
                      field
                    }) => <FormItem className="flex flex-col">
                              <FormLabel className="mb-2">Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button variant={"outline"} className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"} ${livMission ? 'opacity-70 cursor-not-allowed' : ''}`} disabled={!!livMission}>
                                      {field.value ? format(field.value, "dd/MM/yyyy") : <span>Date</span>}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                {!livMission && <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                  </PopoverContent>}
                              </Popover>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H1_PEC" render={({
                      field
                    }) => <FormItem>
                              <FormLabel className="mb-2">Heure début</FormLabel>
                              <FormControl>
                                <TimeSelect value={field.value} onChange={field.onChange} disabled={!!livMission} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H2_PEC" render={({
                      field
                    }) => <FormItem>
                              <FormLabel className="mb-2">Heure fin</FormLabel>
                              <FormControl>
                                <TimeSelect value={field.value} onChange={field.onChange} disabled={!!livMission} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">
                        Contact au lieu de livraison
                        {livMission && <span className="text-blue-600 text-sm block">(Contact de départ de la mission LIV)</span>}
                      </h3>
                      <ContactSelector onSelectContact={handleDeliveryContactSelect} clientId={selectedClientId || undefined} />
                    </div>
                    
                    <FormField control={form.control} name="contact_delivery_name" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Nom / Société *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Nom complet ou société" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="contact_delivery_phone" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Téléphone *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Numéro de téléphone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="contact_delivery_email" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="Adresse email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />

                    <div className="space-y-4">
                      <h4 className="text-md font-medium">Créneau de livraison</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField control={form.control} name="D2_LIV" render={({
                      field
                    }) => <FormItem className="flex flex-col">
                              <FormLabel className="mb-2">Date</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button variant={"outline"} className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                                      {field.value ? format(field.value, "dd/MM/yyyy") : <span>Date</span>}
                                      <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H1_LIV" render={({
                      field
                    }) => <FormItem>
                              <FormLabel className="mb-2">Heure début</FormLabel>
                              <FormControl>
                                <TimeSelect value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H2_LIV" render={({
                      field
                    }) => <FormItem>
                              <FormLabel className="mb-2">Heure fin</FormLabel>
                              <FormControl>
                                <TimeSelect value={field.value} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>} />
                      </div>
                    </div>
                  </div>
                </div>

                <FormField control={form.control} name="notes" render={({
              field
            }) => <FormItem>
                      <FormLabel>Notes / Instructions spéciales</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Informations supplémentaires, codes d'accès, instructions particulières..." className="h-32" />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm font-bold mt-2">Les fichiers pourront être téléchargées dans la page de la mission crée</p>
                    </FormItem>} />
              </div>}

            {/* Étape 5: Attribution (Admin seulement) */}
            {currentStep === 5 && profile?.role === 'admin' && <div className="space-y-6">
                <FormField control={form.control} name="client_id" render={({
              field
            }) => <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={handleClientChange} defaultValue={field.value} disabled={!!livMission}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_client_selected" disabled>Sélectionner un client</SelectItem>
                          {loadingClients ? <SelectItem value="loading" disabled>Chargement...</SelectItem> : clientProfiles.map((client: ProfileOption) => <SelectItem key={client.id} value={client.id}>
                                {client.label || client.email || client.id}
                              </SelectItem>)}
                        </SelectContent>
                      </Select>
                      {livMission && <FormDescription className="text-blue-600">Pré-sélectionné depuis la mission LIV</FormDescription>}
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="chauffeur_id" render={({
              field
            }) => <FormItem>
                      <FormLabel>Chauffeur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un chauffeur (optionnel)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_driver_assigned">Aucun chauffeur assigné</SelectItem>
                          {loadingDrivers ? <SelectItem value="loading" disabled>Chargement...</SelectItem> : driverProfiles.map((driver: ProfileOption) => <SelectItem key={driver.id} value={driver.id}>
                                {driver.label || driver.email || driver.id}
                              </SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Vous pouvez assigner un chauffeur maintenant ou plus tard
                        {livMission && <span className="text-blue-600 block">Pré-sélectionné depuis la mission LIV (modifiable)</span>}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="chauffeur_price_ht" render={({
              field
            }) => <FormItem>
                      <FormLabel>Prix chauffeur HT (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormDescription>
                        Prix payé au chauffeur pour cette mission (hors taxes)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="status" render={({
              field
            }) => <FormItem>
                      <FormLabel>Statut initial</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en_acceptation">En acceptation</SelectItem>
                          <SelectItem value="accepte">Accepté</SelectItem>
                          <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
              </div>}

            {/* Boutons de navigation */}
            <div className="flex flex-col space-y-4">
              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>

                {currentStep < totalSteps ? <Button type="button" onClick={nextStep}>
                    Suivant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button> : <div className="flex gap-2 items-center">
                    <p className="text-sm text-right">
                      Le client accepte sans réserves les <a href="https://dkautomotive.fr/cgv" target="_blank" className="font-medium text-[#193366] hover:underline">
                        CGV
                      </a> en créant la mission
                    </p>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                      Créer la mission
                    </Button>
                  </div>}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}
