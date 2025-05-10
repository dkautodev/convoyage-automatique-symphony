
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
import { Loader2, ArrowRight, ArrowLeft, Check, Save, Calculator, Calendar, Clock, FileText, File } from 'lucide-react';
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
import TempMissionAttachments from './TempMissionAttachments';
import DocumentUploadDialog from './DocumentUploadDialog';
import { updateDocumentMissionId } from '@/integrations/supabase/storage';

interface CreateMissionFormProps {
  onSuccess: () => void;
}

export function CreateMissionForm({ onSuccess }: CreateMissionFormProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { computePrice } = usePricing();
  const { getPlaceDetails } = useGooglePlaces();
  const { profiles, loading: loadingProfiles } = useProfiles('client');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientProfiles, setClientProfiles] = useState<ProfileOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceEstimate, setPriceEstimate] = useState<number | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [needsReturn, setNeedsReturn] = useState(false);
  const [contactsPickup, setContactsPickup] = useState<Contact[]>([]);
  const [contactsDelivery, setContactsDelivery] = useState<Contact[]>([]);
  const [selectedContactPickup, setSelectedContactPickup] = useState<Contact | null>(null);
  const [selectedContactDelivery, setSelectedContactDelivery] = useState<Contact | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [tempMissionId, setTempMissionId] = useState(`temp_${Date.now()}`);
  const [uploadedFiles, setUploadedFiles] = useState<{path: string, name: string}[]>([]);
  
  const formSchema = z.object({
    client_id: z.string().min(1, "Client requis"),
    mission_type: z.enum(["LIV", "RES"]),
    vehicle_category: z.enum(["VP", "VUL", "PL", "SPL", "MOTO"]),
    scheduled_date: z.date(),
    pickup_address: z.object({
      street: z.string().min(1, "Adresse requise"),
      city: z.string().min(1, "Ville requise"),
      postal_code: z.string().min(5, "Code postal requis").max(5, "Code postal invalide"),
      country: z.string().default("France"),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      full_address: z.string().optional(),
    }),
    delivery_address: z.object({
      street: z.string().min(1, "Adresse requise"),
      city: z.string().min(1, "Ville requise"),
      postal_code: z.string().min(5, "Code postal requis").max(5, "Code postal invalide"),
      country: z.string().default("France"),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      full_address: z.string().optional(),
    }),
    contact_pickup_name: z.string().optional(),
    contact_pickup_phone: z.string().optional(),
    contact_pickup_email: z.string().email().optional().or(z.literal('')),
    contact_delivery_name: z.string().optional(),
    contact_delivery_phone: z.string().optional(),
    contact_delivery_email: z.string().email().optional().or(z.literal('')),
    vehicle_registration: z.string().optional(),
    vehicle_make: z.string().optional(),
    vehicle_model: z.string().optional(),
    vehicle_year: z.string().optional(),
    vehicle_vin: z.string().optional(),
    vehicle_fuel: z.string().optional(),
    notes: z.string().optional(),
    return_trip: z.boolean().default(false),
    status: z.string().default("en_acceptation"),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_type: "LIV",
      vehicle_category: "VP",
      scheduled_date: new Date(),
      pickup_address: {
        street: "",
        city: "",
        postal_code: "",
        country: "France",
      },
      delivery_address: {
        street: "",
        city: "",
        postal_code: "",
        country: "France",
      },
      notes: "",
      return_trip: false,
      status: "en_acceptation",
    },
  });

  const pickupAddress = form.watch('pickup_address');
  const deliveryAddress = form.watch('delivery_address');
  const selectedVehicleCategory = form.watch('vehicle_category');
  const selectedClientId = form.watch('client_id');

  // Filtrer et classer les profils clients
  useEffect(() => {
    if (profiles) {
      const filteredProfiles = profiles
        .filter(p => p.role === 'client' && p.active)
        .map(p => ({
          id: p.id,
          label: p.company_name || p.full_name || p.email,
          email: p.email
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
      
      setClientProfiles(filteredProfiles);
    }
  }, [profiles]);

  // Calculer le prix lorsque les adresses changent
  useEffect(() => {
    const calculatePrice = async () => {
      if (!pickupAddress.street || !deliveryAddress.street || !selectedVehicleCategory) return;
      
      try {
        setIsPriceLoading(true);
        
        // Geocoder les adresses si nécessaire
        let pickupCoords = { lat: pickupAddress.latitude, lng: pickupAddress.longitude };
        let deliveryCoords = { lat: deliveryAddress.latitude, lng: deliveryAddress.longitude };
        
        if (!pickupCoords.lat || !pickupCoords.lng) {
          const fullPickupAddress = `${pickupAddress.street}, ${pickupAddress.postal_code} ${pickupAddress.city}, ${pickupAddress.country}`;
          try {
            const geocodedPickup = await getPlaceDetails(fullPickupAddress);
            if (geocodedPickup) {
              pickupCoords = { lat: geocodedPickup.lat, lng: geocodedPickup.lng };
              form.setValue('pickup_address.latitude', geocodedPickup.lat);
              form.setValue('pickup_address.longitude', geocodedPickup.lng);
            }
          } catch (error) {
            console.error('Error geocoding pickup address:', error);
          }
        }
        
        if (!deliveryCoords.lat || !deliveryCoords.lng) {
          const fullDeliveryAddress = `${deliveryAddress.street}, ${deliveryAddress.postal_code} ${deliveryAddress.city}, ${deliveryAddress.country}`;
          try {
            const geocodedDelivery = await getPlaceDetails(fullDeliveryAddress);
            if (geocodedDelivery) {
              deliveryCoords = { lat: geocodedDelivery.lat, lng: geocodedDelivery.lng };
              form.setValue('delivery_address.latitude', geocodedDelivery.lat);
              form.setValue('delivery_address.longitude', geocodedDelivery.lng);
            }
          } catch (error) {
            console.error('Error geocoding delivery address:', error);
          }
        }
        
        // Calculer la distance et le prix
        if (pickupCoords.lat && pickupCoords.lng && deliveryCoords.lat && deliveryCoords.lng) {
          const result = await computePrice(
            Math.sqrt(
              Math.pow((deliveryCoords.lat - pickupCoords.lat) * 111, 2) + 
              Math.pow((deliveryCoords.lng - pickupCoords.lng) * 111 * Math.cos(pickupCoords.lat * Math.PI / 180), 2)
            ),
            selectedVehicleCategory as VehicleCategory
          );
          
          if (result) {
            setPriceEstimate(result.priceHT);
            setDistanceKm(result.distance || 10); // Fallback to a default value
          }
        }
      } catch (error) {
        console.error('Erreur lors du calcul du prix:', error);
        toast.error('Erreur lors du calcul du prix');
      } finally {
        setIsPriceLoading(false);
      }
    };
    
    // Débounce pour éviter trop d'appels API
    const timer = setTimeout(() => {
      calculatePrice();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [pickupAddress, deliveryAddress, selectedVehicleCategory, needsReturn, getPlaceDetails, computePrice, form]);

  // Mettre à jour les contacts en fonction du client sélectionné
  useEffect(() => {
    const fetchContacts = async () => {
      if (!selectedClientId) {
        setContactsPickup([]);
        setContactsDelivery([]);
        return;
      }
      
      try {
        const { data: contacts, error } = await typedSupabase
          .from('contacts')
          .select('*')
          .eq('client_id', selectedClientId);
        
        if (error) throw error;
        
        if (contacts) {
          setContactsPickup(contacts);
          setContactsDelivery(contacts);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des contacts:', error);
        toast.error('Erreur lors du chargement des contacts');
      }
    };
    
    fetchContacts();
  }, [selectedClientId]);

  // Mettre à jour les champs de contact lorsqu'un contact est sélectionné
  useEffect(() => {
    if (selectedContactPickup) {
      form.setValue('contact_pickup_name', selectedContactPickup.name_s || '');
      form.setValue('contact_pickup_phone', selectedContactPickup.phone || '');
      form.setValue('contact_pickup_email', selectedContactPickup.email || '');
    }
  }, [selectedContactPickup, form]);
  
  useEffect(() => {
    if (selectedContactDelivery) {
      form.setValue('contact_delivery_name', selectedContactDelivery.name_s || '');
      form.setValue('contact_delivery_phone', selectedContactDelivery.phone || '');
      form.setValue('contact_delivery_email', selectedContactDelivery.email || '');
    }
  }, [selectedContactDelivery, form]);

  // Gérer le changement d'étape du formulaire
  const nextStep = () => {
    if (currentStep === 1) {
      form.trigger(['client_id', 'mission_type', 'vehicle_category', 'scheduled_date']);
      const hasErrors = !!form.formState.errors.client_id || 
                      !!form.formState.errors.mission_type || 
                      !!form.formState.errors.vehicle_category || 
                      !!form.formState.errors.scheduled_date;
                      
      if (!hasErrors) {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === 2) {
      form.trigger(['pickup_address']);
      const hasErrors = !!form.formState.errors.pickup_address;
      
      if (!hasErrors) {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === 3) {
      form.trigger(['delivery_address']);
      const hasErrors = !!form.formState.errors.delivery_address;
      
      if (!hasErrors) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumettre le formulaire
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Préparer les données pour la création de la mission
      const missionData = {
        ...data,
        pickup_address: {
          ...data.pickup_address,
          full_address: `${data.pickup_address.street}, ${data.pickup_address.postal_code} ${data.pickup_address.city}, ${data.pickup_address.country}`
        },
        delivery_address: {
          ...data.delivery_address,
          full_address: `${data.delivery_address.street}, ${data.delivery_address.postal_code} ${data.delivery_address.city}, ${data.delivery_address.country}`
        },
        created_by: profile?.id,
        price_ht: priceEstimate || null,
        price_ttc: priceEstimate ? priceEstimate * 1.2 : null,
        distance_km: distanceKm || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Créer la nouvelle mission
      const { data: newMission, error } = await typedSupabase
        .from('missions')
        .insert([missionData])
        .select()
        .single();
      
      if (error) throw error;
      
      if (newMission) {
        // Mettre à jour les ID des documents temporaires avec l'ID réel de la mission
        if (uploadedFiles.length > 0) {
          await updateDocumentMissionId(tempMissionId, newMission.id);
        }
        
        toast.success('Mission créée avec succès');
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la mission:', error);
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gérer l'ajout d'un document
  const handleAddDocument = () => {
    setShowUploadDialog(true);
  };

  // Gérer la mise à jour de la liste des documents après un téléchargement
  const handleDocumentUploaded = (path: string, fileName: string) => {
    setUploadedFiles(prev => [...prev, { path, name: fileName }]);
  };

  return (
    <div className="space-y-8">
      {/* Indicateur d'étapes */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === step
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {currentStep > step ? <Check className="h-5 w-5" /> : step}
            </div>
          ))}
        </div>
        <div className="text-sm text-muted-foreground">
          Étape {currentStep} sur 5
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Étape 1: Informations générales */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informations générales
                </CardTitle>
                <CardDescription>
                  Sélectionnez le client et le type de mission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clientProfiles.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mission_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de mission</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LIV">Livraison</SelectItem>
                          <SelectItem value="RES">Récupération</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vehicle_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie de véhicule</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(vehicleCategoryLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <FormDescription>
                        VP: Voiture particulière, VUL: Utilitaire léger, PL: Poids lourd, SPL: Super poids lourd, MOTO: Moto/Scooter
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date planifiée</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={`pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Sélectionner une date</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="return_trip"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => {
                            field.onChange(e.target.checked);
                            setNeedsReturn(e.target.checked);
                          }}
                          className="h-4 w-4 rounded border border-primary text-primary"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Aller-retour</FormLabel>
                        <FormDescription>
                          Cochez cette case si le véhicule doit revenir à l'adresse de départ après la livraison
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Annuler
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Étape 2: Adresse de ramassage */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Adresse de ramassage
                </CardTitle>
                <CardDescription>
                  Saisissez l'adresse où le véhicule sera récupéré
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-4">
                  Entrez manuellement les détails de l'adresse:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="pickup_address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rue</FormLabel>
                        <FormControl>
                          <Input placeholder="123 rue de Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickup_address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickup_address.postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickup_address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium">Contact sur place</div>
                  
                  {contactsPickup.length > 0 && (
                    <ContactSelector
                      onSelectContact={(contact) => setSelectedContactPickup(contact)}
                      clientId={selectedClientId}
                      className="mb-4"
                    />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="contact_pickup_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_pickup_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="01 23 45 67 89" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_pickup_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Étape 3: Adresse de livraison */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Adresse de livraison
                </CardTitle>
                <CardDescription>
                  Saisissez l'adresse où le véhicule sera livré
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="mb-4">
                  Entrez manuellement les détails de l'adresse:
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="delivery_address.street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rue</FormLabel>
                        <FormControl>
                          <Input placeholder="123 rue de Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville</FormLabel>
                        <FormControl>
                          <Input placeholder="Paris" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_address.postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal</FormLabel>
                        <FormControl>
                          <Input placeholder="75000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="delivery_address.country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <FormControl>
                          <Input placeholder="France" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium">Contact sur place</div>
                  
                  {contactsDelivery.length > 0 && (
                    <ContactSelector
                      onSelectContact={(contact) => setSelectedContactDelivery(contact)}
                      clientId={selectedClientId}
                      className="mb-4"
                    />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="contact_delivery_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Nom du contact" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_delivery_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="01 23 45 67 89" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contact_delivery_email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="contact@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Affichage du prix estimé */}
                {(priceEstimate !== null || isPriceLoading) && (
                  <div className="bg-muted p-4 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        <span className="font-medium">Prix estimé</span>
                      </div>
                      {isPriceLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Calcul en cours...</span>
                        </div>
                      ) : (
                        <div className="text-xl font-bold">
                          {priceEstimate !== null ? `${priceEstimate.toFixed(2)} €` : 'N/A'}
                        </div>
                      )}
                    </div>
                    {distanceKm !== null && !isPriceLoading && (
                      <div className="text-sm text-muted-foreground mt-2">
                        Distance: {distanceKm.toFixed(2)} km
                        {needsReturn && ` (aller-retour inclus)`}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Étape 4: Documents */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Documents
                </CardTitle>
                <CardDescription>
                  Ajoutez des documents liés à la mission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Vous pouvez ajouter des documents à la mission (factures, bons de livraison, etc.)
                  </p>
                  <Button onClick={handleAddDocument}>
                    Ajouter un document
                  </Button>
                </div>

                <div className="border rounded-md p-4 min-h-[200px]">
                  {uploadedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[150px] text-muted-foreground">
                      <File className="h-12 w-12 mb-2 opacity-30" />
                      <p>Aucun document ajouté</p>
                      <p className="text-sm">Cliquez sur "Ajouter un document" pour commencer</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="font-medium mb-2">Documents ajoutés</h3>
                      <div className="space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center p-2 bg-muted/50 rounded">
                            <File className="h-4 w-4 mr-2" />
                            <span className="text-sm truncate flex-1">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Étape 5: Informations du véhicule */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <File className="h-5 w-5" />
                  Informations du véhicule
                </CardTitle>
                <CardDescription>
                  Complétez les informations du véhicule (facultatif)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="vehicle_registration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Immatriculation</FormLabel>
                        <FormControl>
                          <Input placeholder="AB-123-CD" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marque</FormLabel>
                        <FormControl>
                          <Input placeholder="Renault, Peugeot..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modèle</FormLabel>
                        <FormControl>
                          <Input placeholder="Clio, 308..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Année</FormLabel>
                        <FormControl>
                          <Input placeholder="2020" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_vin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro VIN</FormLabel>
                        <FormControl>
                          <Input placeholder="VF1RFA00066789012" {...field} />
                        </FormControl>
                        <FormMessage />
                        <FormDescription>
                          Numéro d'identification du véhicule (17 caractères)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicle_fuel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Carburant</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="diesel">Diesel</SelectItem>
                            <SelectItem value="essence">Essence</SelectItem>
                            <SelectItem value="electrique">Électrique</SelectItem>
                            <SelectItem value="hybride">Hybride</SelectItem>
                            <SelectItem value="gpl">GPL</SelectItem>
                            <SelectItem value="gnv">GNV</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informations complémentaires..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer la mission
                  <Save className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </Form>

      {/* Dialogue d'upload de documents */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        missionId={tempMissionId}
        onUploadComplete={handleDocumentUploaded}
      />
    </div>
  );
}

