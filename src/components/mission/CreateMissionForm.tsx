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
import { Loader2, ArrowRight, ArrowLeft, Check, Save, Calculator, Calendar, Clock, FileText, File, PaperclipIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import { useAuth } from '@/hooks/useAuth';
import { usePricing } from '@/hooks/usePricing';
import { useGooglePlaces } from '@/hooks/useGooglePlaces';
import { typedSupabase } from '@/types/database';
import { vehicleCategoryLabels, VehicleCategory, MissionStatus } from '@/types/supabase';
import { Address } from '@/types/supabase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useProfiles, ProfileOption } from '@/hooks/useProfiles';
import FileUpload from './FileUpload';
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

// Étape 4: Contacts et notes avec créneaux horaires
const contactsAndNotesSchema = z.object({
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

// Étape 5: Attribution (Admin seulement)
const attributionSchema = z.object({
  client_id: z.string().uuid().optional(),
  status: z.enum(['en_acceptation', 'accepte', 'prise_en_charge', 'livraison', 'livre', 'termine', 'annule', 'incident']).default('en_acceptation'),
  chauffeur_id: z.string().nullable().optional(),
  chauffeur_price_ht: z.number().optional()
});

// Schéma complet
const createMissionSchema = z.object({
  ...missionTypeSchema.shape,
  ...vehicleAndAddressSchema.shape,
  ...vehicleInfoSchema.shape,
  ...contactsAndNotesSchema.shape,
  ...attributionSchema.shape
});
type CreateMissionFormValues = z.infer<typeof createMissionSchema>;
export default function CreateMissionForm({
  onSuccess
}: {
  onSuccess?: () => void;
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
    defaultValues: {
      mission_type: undefined,
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
      // Nouveaux champs par défaut
      D1_PEC: undefined,
      H1_PEC: '',
      H2_PEC: '',
      D2_LIV: undefined,
      H1_LIV: '',
      H2_LIV: ''
    }
  });

  // Si le rôle est admin, initialiser le client_id avec undefined
  useEffect(() => {
    if (profile?.role === 'admin') {
      form.setValue('client_id', undefined);
    }
  }, [profile, form]);

  // Lorsqu'un client est sélectionné dans le dropdown
  const handleClientChange = (clientId: string) => {
    console.log('Client sélectionné:', clientId);
    setSelectedClientId(clientId);
    form.setValue('client_id', clientId);
  };
  const currentSchema = (() => {
    switch (currentStep) {
      case 1:
        return missionTypeSchema;
      case 2:
        return vehicleAndAddressSchema;
      case 3:
        return vehicleInfoSchema;
      case 4:
        return contactsAndNotesSchema;
      case 5:
        return attributionSchema;
      default:
        return missionTypeSchema;
    }
  })();
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

      // Extraire les coordonnées des adresses
      const pickupCoords = {
        lat: pickupAddressData.lat || (pickupAddressData.geometry?.location?.lat && typeof pickupAddressData.geometry.location.lat === 'function' ? pickupAddressData.geometry.location.lat() : null),
        lng: pickupAddressData.lng || (pickupAddressData.geometry?.location?.lng && typeof pickupAddressData.geometry.location.lng === 'function' ? pickupAddressData.geometry.location.lng() : null)
      };
      const deliveryCoords = {
        lat: deliveryAddressData.lat || (deliveryAddressData.geometry?.location?.lat && typeof deliveryAddressData.geometry.location.lat === 'function' ? deliveryAddressData.geometry.location.lat() : null),
        lng: deliveryAddressData.lng || (deliveryAddressData.geometry?.location?.lng && typeof deliveryAddressData.geometry.location.lng === 'function' ? deliveryAddressData.geometry.location.lng() : null)
      };
      if (!pickupCoords.lat || !pickupCoords.lng || !deliveryCoords.lat || !deliveryCoords.lng) {
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

      // Extraire la distance en km du texte renvoyé (format "XX km")
      const distanceText = result.distance;
      const distanceKm = parseFloat(distanceText.replace(' km', ''));
      console.log("Distance calculée:", distanceKm, "km");

      // Calculer le prix basé sur la distance et le type de véhicule
      const priceResult = await computePrice(distanceKm, vehicleCategory);
      if (!priceResult) {
        toast.error('Impossible de calculer le prix pour cette distance');
        setCalculatingPrice(false);
        return;
      }
      form.setValue('distance_km', distanceKm);
      form.setValue('price_ht', priceResult.priceHT);
      form.setValue('price_ttc', priceResult.priceTTC);

      // Ajouter le vehicle_id si disponible
      if (priceResult.vehicleId) {
        form.setValue('vehicle_id', priceResult.vehicleId);
        console.log('Vehicle ID set to:', priceResult.vehicleId);
      } else {
        console.log('No vehicle ID found for the selected vehicle category');
      }
      console.log("Prix calculé:", priceResult);
      toast.success(`Prix calculé avec succès: ${priceResult.priceTTC.toFixed(2)} € TTC`);
    } catch (error) {
      console.error('Erreur lors du calcul de la distance:', error);
      toast.error('Une erreur est survenue lors du calcul du prix');
    } finally {
      setCalculatingPrice(false);
    }
  }
  const nextStep = async () => {
    const isValid = await form.trigger(Object.keys(currentSchema.shape) as any);
    if (!isValid) return;
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
        // Pour les admins: utiliser le client sélectionné dans le formulaire
        if (values.client_id && values.client_id !== 'no_client_selected') {
          clientId = values.client_id;
          console.log("Admin: client_id from values =", clientId);
        } else {
          toast.error('Aucun client n\'a été sélectionné');
          setIsSubmitting(false);
          return;
        }
      } else if (profile?.role === 'client' && user?.id) {
        // Pour les clients: utiliser leur propre ID
        clientId = user.id;
        console.log("Client: client_id (user.id) =", clientId);
      } else {
        toast.error('Impossible de déterminer le client pour cette mission');
        setIsSubmitting(false);
        return;
      }

      // Vérifier que nous avons un client_id valide
      if (!clientId) {
        toast.error('Aucun client valide n\'a été trouvé ou sélectionné');
        setIsSubmitting(false);
        return;
      }

      // S'assurer que chauffeur_id n'est pas un des valeurs statiques
      let chauffeurId = values.chauffeur_id;
      if (!chauffeurId || chauffeurId === "no_driver_assigned") {
        chauffeurId = null;
      }
      console.log("Client ID final:", clientId);
      console.log("Chauffeur ID final:", chauffeurId);

      // Préparer les données d'adresse pour la base de données
      const pickupAddressData = values.pickup_address_data || {
        formatted_address: values.pickup_address
      };
      const deliveryAddressData = values.delivery_address_data || {
        formatted_address: values.delivery_address
      };

      // Convertir les objets Address en Json compatible avec Supabase
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

      // Enregistrer la mission
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
        // Nouveaux champs pour le ramassage
        D1_PEC: formattedD1PEC,
        H1_PEC: values.H1_PEC,
        H2_PEC: values.H2_PEC,
        contact_delivery_name: values.contact_delivery_name,
        contact_delivery_phone: values.contact_delivery_phone,
        contact_delivery_email: values.contact_delivery_email,
        // Nouveaux champs pour la livraison
        D2_LIV: formattedD2LIV,
        H1_LIV: values.H1_LIV,
        H2_LIV: values.H2_LIV,
        notes: values.notes,
        chauffeur_id: chauffeurId,
        chauffeur_price_ht: values.chauffeur_price_ht || 0,
        created_by: user?.id || '',
        scheduled_date: new Date().toISOString(),
        vat_rate: 20,
        // Taux de TVA par défaut
        mission_type: values.mission_type || 'LIV'
      };
      console.log("Mission data to save:", JSON.stringify(missionData, null, 2));
      try {
        console.log("Sending request to Supabase with data:", missionData);
        const {
          data,
          error
        } = await typedSupabase.from('missions').insert(missionData).select('id').single();
        if (error) {
          console.error('Erreur Supabase lors de la création de la mission:', error);
          console.error('Detail:', error.details);
          console.error('Message:', error.message);
          console.error('Hint:', error.hint);
          toast.error(`Erreur lors de la création de la mission: ${error.message}`);
          return;
        }
        console.log("Mission créée avec succès, données retournées:", data);
        toast.success('Mission créée avec succès');
        if (onSuccess) {
          onSuccess();
        } else {
          // Rediriger vers la page appropriée en fonction du rôle
          if (profile?.role === 'admin') {
            navigate('/admin/missions');
          } else {
            navigate('/client/missions');
          }
        }
      } catch (dbError: any) {
        console.error('Exception lors de l\'opération Supabase:', dbError);
        console.error('Detail:', dbError.details || 'No details');
        console.error('Message:', dbError.message || 'No message');
        toast.error(`Exception lors de la création de la mission: ${dbError.message || 'Erreur inconnue'}`);
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
  return <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Créer une nouvelle mission</CardTitle>
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
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                              <FormControl>
                                <RadioGroupItem value="LIV" className="sr-only" />
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
                            <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
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
                      </FormDescription>
                      <FormMessage />
                    </FormItem>} />

                <div className="space-y-4">
                  <FormField control={form.control} name="pickup_address" render={({
                field
              }) => <FormItem>
                        <FormLabel>Adresse de départ</FormLabel>
                        <FormControl>
                          <AddressAutocomplete value={field.value} onChange={value => field.onChange(value)} onSelect={(address, placeId) => {
                    onSelectPickupAddress(address, placeId, window.selectedAddressData);
                  }} placeholder="Saisissez l'adresse de départ" error={form.formState.errors.pickup_address?.message} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <FormField control={form.control} name="delivery_address" render={({
                field
              }) => <FormItem>
                        <FormLabel>Adresse de livraison</FormLabel>
                        <FormControl>
                          <AddressAutocomplete value={field.value} onChange={value => field.onChange(value)} onSelect={(address, placeId) => {
                    onSelectDeliveryAddress(address, placeId, window.selectedAddressData);
                  }} placeholder="Saisissez l'adresse de livraison" error={form.formState.errors.delivery_address?.message} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>} />

                  <div className="flex justify-center my-4">
                    <Button type="button" variant="outline" onClick={calculatePrice} disabled={calculatingPrice} className="flex items-center gap-2">
                      {calculatingPrice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                      Calculer le prix
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="distance_km" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Distance (km)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="price_ht" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Prix HT (€)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    <FormField control={form.control} name="price_ttc" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Prix TTC (€)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} readOnly />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                  </div>
                </div>
              </div>}

            {/* Étape 3: Informations du véhicule */}
            {currentStep === 3 && <div className="space-y-6">
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

            {/* Étape 4: Contacts, créneaux horaires et notes */}
            {currentStep === 4 && <div className="space-y-6">
                {/* Contact au lieu de départ et créneau horaire */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Contact au lieu de départ</h3>
                      <ContactSelector 
                        onSelectContact={handlePickupContactSelect} 
                        clientId={selectedClientId || undefined} 
                      />
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

                    {/* Créneau horaire de ramassage */}
                    <div className="space-y-4 border-t pt-4 mt-4">
                      <h4 className="font-medium">Créneau horaire de ramassage *</h4>
                      
                      {/* Date de ramassage */}
                      <FormField control={form.control} name="D1_PEC" render={({
                    field
                  }) => <FormItem className="flex flex-col">
                            <FormLabel>Date de ramassage *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Choisir une date</span>}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>} />
                      
                      {/* Heures de début et fin */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="H1_PEC" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Heure de début *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Heure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({
                            length: 24
                          }).map((_, i) => <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>{`${String(i).padStart(2, '0')}:00`}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H2_PEC" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Heure de fin *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Heure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({
                            length: 24
                          }).map((_, i) => <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>{`${String(i).padStart(2, '0')}:00`}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Contact au lieu de livraison</h3>
                      <ContactSelector 
                        onSelectContact={handleDeliveryContactSelect} 
                        clientId={selectedClientId || undefined} 
                      />
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

                    {/* Créneau horaire de livraison */}
                    <div className="space-y-4 border-t pt-4 mt-4">
                      <h4 className="font-medium">Créneau horaire de livraison *</h4>
                      
                      {/* Date de livraison */}
                      <FormField control={form.control} name="D2_LIV" render={({
                    field
                  }) => <FormItem className="flex flex-col">
                            <FormLabel>Date de livraison *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant={"outline"} className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}>
                                    {field.value ? format(field.value, "dd/MM/yyyy") : <span>Choisir une date</span>}
                                    <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="p-3 pointer-events-auto" />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>} />
                      
                      {/* Heures de début et fin */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="H1_LIV" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Heure de début *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Heure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({
                            length: 24
                          }).map((_, i) => <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>{`${String(i).padStart(2, '0')}:00`}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                        <FormField control={form.control} name="H2_LIV" render={({
                      field
                    }) => <FormItem>
                              <FormLabel>Heure de fin *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Heure" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Array.from({
                            length: 24
                          }).map((_, i) => <SelectItem key={i} value={`${String(i).padStart(2, '0')}:00`}>{`${String(i).padStart(2, '0')}:00`}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pièces jointes - NOUVELLE SECTION */}
                <div className="space-y-4 border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Pièces jointes</h3>
                    
                    <FileUpload 
                      missionId={undefined} 
                      onUploadComplete={(filePath, fileName) => {
                        toast.success(`Document ajouté: ${fileName}`);
                      }} 
                      className="mb-2"
                      variant="default" 
                      size="sm"
                      label="Ajouter un document"
                      multiple={true}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Les documents seront associés à la mission après sa création.
                  </p>
                </div>

                {/* Notes */}
                <FormField control={form.control} name="notes" render={({
              field
            }) => <FormItem>
                      <FormLabel>Notes additionnelles</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Instructions spécifiques, informations complémentaires..." className="min-h-[100px]" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>}

            {/* Étape 5: Attribution (Admin seulement) */}
            {currentStep === 5 && profile?.role === 'admin' && 
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Attribution de la mission</h3>
                
                <FormField control={form.control} name="client_id" render={({
              field
            }) => <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={value => {
                handleClientChange(value);
              }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {loadingClients ? <SelectItem value="loading">Chargement...</SelectItem> : clientProfiles.length === 0 ? <SelectItem value="no_clients">Aucun client disponible</SelectItem> : clientProfiles.map(client => <SelectItem key={client.id} value={client.id}>
                                {client.label} ({client.email})
                              </SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />

                <FormField control={form.control} name="status" render={({
              field
            }) => <FormItem>
                      <FormLabel>Statut de la mission</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en_acceptation">En attente d'acceptation</SelectItem>
                          <SelectItem value="accepte">Acceptée</SelectItem>
                          <SelectItem value="prise_en_charge">Prise en charge</SelectItem>
                          <SelectItem value="livraison">En livraison</SelectItem>
                          <SelectItem value="livre">Livrée</SelectItem>
                          <SelectItem value="termine">Terminée</SelectItem>
                          <SelectItem value="annule">Annulée</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="chauffeur_id" render={({
              field
            }) => <FormItem>
                      <FormLabel>Chauffeur</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || "no_driver_assigned"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un chauffeur" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_driver_assigned">Aucun chauffeur assigné</SelectItem>
                          {loadingDrivers ? <SelectItem value="loading">Chargement...</SelectItem> : driverProfiles.length === 0 ? <SelectItem value="no_drivers">Aucun chauffeur disponible</SelectItem> : driverProfiles.map(driver => <SelectItem key={driver.id} value={driver.id}>
                                {driver.label} ({driver.email})
                              </SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>} />
                
                <FormField control={form.control} name="chauffeur_price_ht" render={({
              field
            }) => <FormItem>
                      <FormLabel>Prix chauffeur HT (€)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>} />
              </div>
            }

            {/* Navigation - MISE À JOUR */}
            <div className="flex justify-between pt-4 border-t mt-8">
              <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              
              <div className="flex items-center gap-2">
                {/* Quand on est à l'étape 4, on montre le bouton de pièce jointe avec pastille */}
                {currentStep === 4 && 
                  <FileUpload 
                    missionId={undefined} 
                    onUploadComplete={(filePath, fileName) => {
                      toast.success(`Document ajouté: ${fileName}`);
                    }} 
                    className="mb-2"
                    variant="default" 
                    size="sm"
                    label="Ajouter un document"
                    multiple={true}
                  />
                }
                
                {currentStep < totalSteps ? 
                  <Button type="button" onClick={nextStep} className="flex items-center gap-2">
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </Button> 
                  : 
                  <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
                    {isSubmitting ? 
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Création en cours...
                      </> 
                      : 
                      <>
                        <Check className="h-4 w-4" />
                        Créer la mission
                      </>
                    }
                  </Button>
                }
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>;
}
