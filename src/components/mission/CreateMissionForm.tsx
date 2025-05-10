
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { typedSupabase } from '@/types/database';
import { useAuth } from '@/hooks/auth';
import { Loader2, ArrowRight, ArrowLeft, Check, MapPin } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import FileUpload from '@/components/mission/FileUpload';
import { associatePendingDocumentsWithMission } from '@/integrations/supabase/storage';

// Create a context to store the document IDs during mission creation
const DocumentUploadContext = React.createContext<{
  pendingDocuments: string[];
  addPendingDocument: (id: string) => void;
}>({
  pendingDocuments: [],
  addPendingDocument: () => {}
});

// Form schema for mission creation
const formSchema = z.object({
  // Client information
  client_id: z.string().min(1, "Le client est requis"),
  
  // Mission details
  mission_type: z.string().min(1, "Le type de mission est requis"),
  vehicle_category: z.string().min(1, "La catégorie de véhicule est requise"),
  scheduled_date: z.string().min(1, "La date planifiée est requise"),
  
  // Vehicle information
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_registration: z.string().optional(),
  vehicle_vin: z.string().optional(),
  vehicle_year: z.string().optional(),
  vehicle_fuel: z.string().optional(),
  
  // Pickup information
  pickup_address: z.string().min(1, "L'adresse de ramassage est requise"),
  pickup_city: z.string().min(1, "La ville de ramassage est requise"),
  pickup_postal_code: z.string().min(1, "Le code postal de ramassage est requis"),
  pickup_country: z.string().default("France"),
  contact_pickup_name: z.string().optional(),
  contact_pickup_phone: z.string().optional(),
  contact_pickup_email: z.string().email("Email invalide").optional().or(z.literal('')),
  
  // Delivery information
  delivery_address: z.string().min(1, "L'adresse de livraison est requise"),
  delivery_city: z.string().min(1, "La ville de livraison est requise"),
  delivery_postal_code: z.string().min(1, "Le code postal de livraison est requis"),
  delivery_country: z.string().default("France"),
  contact_delivery_name: z.string().optional(),
  contact_delivery_phone: z.string().optional(),
  contact_delivery_email: z.string().email("Email invalide").optional().or(z.literal('')),
  
  // Additional information
  notes: z.string().optional(),
  
  // Terms acceptance
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions générales" }),
  }),
});

// CreateMissionForm component
export default function CreateMissionForm({ onSuccess }: { onSuccess?: () => void }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const { user, profile } = useAuth();
  
  // Add state for tracking pending document IDs
  const [pendingDocuments, setPendingDocuments] = useState<string[]>([]);
  
  // Function to add a pending document ID
  const addPendingDocument = (id: string) => {
    setPendingDocuments(prev => [...prev, id]);
  };
  
  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mission_type: "",
      vehicle_category: "",
      scheduled_date: "",
      pickup_country: "France",
      delivery_country: "France",
      notes: "",
    },
  });
  
  // Load clients on component mount
  React.useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await typedSupabase
          .from('clients')
          .select('*')
          .order('name');
          
        if (error) throw error;
        setClients(data || []);
        
        // If user has a client_id in their profile, pre-select it
        if (profile?.role === 'client' && profile?.client_id) {
          form.setValue('client_id', profile.client_id);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
        toast.error('Erreur lors du chargement des clients');
      }
    };
    
    fetchClients();
  }, [profile]);
  
  // Handle form submission
  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour créer une mission');
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare mission data with required fields
      const missionDataToInsert = {
        ...values,
        created_by: user.id,
        status: 'en_acceptation',
        distance_km: 0, // Default value for required field
        price_ht: 0,    // Default value for required field
        price_ttc: 0    // Default value for required field
      };
      
      // Insert mission in database
      const { data, error: missionError } = await typedSupabase
        .from('missions')
        .insert(missionDataToInsert)
        .select('id')
        .single();
        
      if (missionError || !data) {
        throw new Error(missionError?.message || 'Erreur lors de la création de la mission');
      }
      
      // Now associate any pending documents with the mission
      if (pendingDocuments.length > 0 && data.id) {
        const success = await associatePendingDocumentsWithMission(pendingDocuments, data.id);
        
        if (!success) {
          console.error("Error associating documents with mission");
          toast.error("Erreur lors de l'association des documents à la mission");
        } else {
          console.log(`${pendingDocuments.length} documents associés à la mission ${data.id}`);
        }
      }
      
      toast.success('Mission créée avec succès');
      
      // Reset form and go back to step 1
      form.reset();
      setCurrentStep(1);
      setPendingDocuments([]); // Clear pending documents
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating mission:', error);
      toast.error('Erreur lors de la création de la mission');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Navigation functions
  const nextStep = () => {
    form.trigger().then((isValid) => {
      if (isValid) {
        setCurrentStep(prev => Math.min(prev + 1, 4));
      }
    });
  };
  
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Render step indicators
  const renderStepIndicator = (step: number, label: string) => {
    const isActive = currentStep === step;
    const isCompleted = currentStep > step;
    
    return (
      <div className={cn(
        "flex items-center gap-2",
        isActive ? "text-primary font-medium" : "text-muted-foreground"
      )}>
        <div className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
          isCompleted ? "bg-primary text-primary-foreground" : 
          isActive ? "border-2 border-primary text-primary" : 
          "border border-muted-foreground"
        )}>
          {isCompleted ? <Check className="h-3 w-3" /> : step}
        </div>
        <span>{label}</span>
      </div>
    );
  };
  
  return (
    <DocumentUploadContext.Provider value={{ pendingDocuments, addPendingDocument }}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Step indicators */}
          <div className="flex justify-between mb-6">
            {renderStepIndicator(1, "Client")}
            <div className="border-t border-dashed border-gray-300 flex-1 mx-2 mt-3"></div>
            {renderStepIndicator(2, "Véhicule")}
            <div className="border-t border-dashed border-gray-300 flex-1 mx-2 mt-3"></div>
            {renderStepIndicator(3, "Adresses")}
            <div className="border-t border-dashed border-gray-300 flex-1 mx-2 mt-3"></div>
            {renderStepIndicator(4, "Finalisation")}
          </div>
          
          {/* Step 1: Client Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Sélection du client</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="client_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          disabled={user?.role === 'client'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients.map(client => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 2: Vehicle Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informations sur le véhicule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              <SelectItem value="LIV">Livraison (LIV)</SelectItem>
                              <SelectItem value="RES">Restitution (RES)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scheduled_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date planifiée</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="vehicle_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie de véhicule</FormLabel>
                        <RadioGroup 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          className="grid grid-cols-2 md:grid-cols-4 gap-4"
                        >
                          <FormItem className="flex flex-col items-center space-y-2 border rounded-md p-4">
                            <FormControl>
                              <RadioGroupItem value="VP" className="sr-only" />
                            </FormControl>
                            <div className={cn(
                              "w-full h-full flex flex-col items-center justify-center p-2 rounded-md",
                              field.value === "VP" ? "bg-primary/10 border-2 border-primary" : "border"
                            )}>
                              <span className="text-3xl mb-2">🚗</span>
                              <FormLabel className="font-normal cursor-pointer">VP</FormLabel>
                            </div>
                          </FormItem>
                          
                          <FormItem className="flex flex-col items-center space-y-2 border rounded-md p-4">
                            <FormControl>
                              <RadioGroupItem value="VU" className="sr-only" />
                            </FormControl>
                            <div className={cn(
                              "w-full h-full flex flex-col items-center justify-center p-2 rounded-md",
                              field.value === "VU" ? "bg-primary/10 border-2 border-primary" : "border"
                            )}>
                              <span className="text-3xl mb-2">🚚</span>
                              <FormLabel className="font-normal cursor-pointer">VU</FormLabel>
                            </div>
                          </FormItem>
                          
                          <FormItem className="flex flex-col items-center space-y-2 border rounded-md p-4">
                            <FormControl>
                              <RadioGroupItem value="PL" className="sr-only" />
                            </FormControl>
                            <div className={cn(
                              "w-full h-full flex flex-col items-center justify-center p-2 rounded-md",
                              field.value === "PL" ? "bg-primary/10 border-2 border-primary" : "border"
                            )}>
                              <span className="text-3xl mb-2">🚛</span>
                              <FormLabel className="font-normal cursor-pointer">PL</FormLabel>
                            </div>
                          </FormItem>
                          
                          <FormItem className="flex flex-col items-center space-y-2 border rounded-md p-4">
                            <FormControl>
                              <RadioGroupItem value="AUTRE" className="sr-only" />
                            </FormControl>
                            <div className={cn(
                              "w-full h-full flex flex-col items-center justify-center p-2 rounded-md",
                              field.value === "AUTRE" ? "bg-primary/10 border-2 border-primary" : "border"
                            )}>
                              <span className="text-3xl mb-2">🚜</span>
                              <FormLabel className="font-normal cursor-pointer">Autre</FormLabel>
                            </div>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="vehicle_make"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marque</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: Renault" />
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
                            <Input {...field} placeholder="Ex: Clio" />
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
                            <Input {...field} placeholder="Ex: 2022" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="vehicle_registration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Immatriculation</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: AB-123-CD" />
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
                          <FormLabel>Numéro de série (VIN)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Ex: WBA..." />
                          </FormControl>
                          <FormMessage />
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
                                <SelectValue placeholder="Sélectionner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Essence">Essence</SelectItem>
                              <SelectItem value="Diesel">Diesel</SelectItem>
                              <SelectItem value="Hybride">Hybride</SelectItem>
                              <SelectItem value="Électrique">Électrique</SelectItem>
                              <SelectItem value="GPL">GPL</SelectItem>
                              <SelectItem value="Autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 3: Addresses */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Tabs defaultValue="pickup">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="pickup">Adresse de ramassage</TabsTrigger>
                  <TabsTrigger value="delivery">Adresse de livraison</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pickup" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Adresse de ramassage
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="pickup_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Numéro et nom de rue" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="pickup_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Ville" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="pickup_postal_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code postal</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Code postal" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Contact sur place</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="contact_pickup_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nom et prénom" />
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
                                  <Input {...field} placeholder="Numéro de téléphone" />
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
                                  <Input {...field} placeholder="Adresse email" type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="delivery" className="space-y-6 pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Adresse de livraison
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-6">
                        <FormField
                          control={form.control}
                          name="delivery_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Adresse</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Numéro et nom de rue" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="delivery_city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ville</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Ville" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="delivery_postal_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Code postal</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Code postal" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="border-t pt-6">
                        <h3 className="text-lg font-medium mb-4">Contact sur place</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="contact_delivery_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom du contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nom et prénom" />
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
                                  <Input {...field} placeholder="Numéro de téléphone" />
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
                                  <Input {...field} placeholder="Adresse email" type="email" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="button" onClick={nextStep}>
                  Suivant
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Step 4: Documents and Review */}
          {currentStep === 4 && (
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Récapitulatif de la mission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2">Informations générales</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Type de mission:</span> {form.getValues('mission_type') === 'LIV' ? 'Livraison' : 'Restitution'}</p>
                        <p><span className="text-muted-foreground">Catégorie de véhicule:</span> {form.getValues('vehicle_category')}</p>
                        <p><span className="text-muted-foreground">Date planifiée:</span> {form.getValues('scheduled_date')}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Véhicule</h3>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-muted-foreground">Marque/Modèle:</span> {form.getValues('vehicle_make')} {form.getValues('vehicle_model')}</p>
                        <p><span className="text-muted-foreground">Immatriculation:</span> {form.getValues('vehicle_registration') || 'Non spécifiée'}</p>
                        <p><span className="text-muted-foreground">Année:</span> {form.getValues('vehicle_year') || 'Non spécifiée'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-4">
                    <div>
                      <h3 className="font-medium mb-2">Adresse de ramassage</h3>
                      <div className="space-y-1 text-sm">
                        <p>{form.getValues('pickup_address')}</p>
                        <p>{form.getValues('pickup_postal_code')} {form.getValues('pickup_city')}</p>
                        <p>{form.getValues('pickup_country')}</p>
                        {form.getValues('contact_pickup_name') && (
                          <p className="mt-2">
                            <span className="text-muted-foreground">Contact:</span> {form.getValues('contact_pickup_name')}
                            {form.getValues('contact_pickup_phone') && ` - ${form.getValues('contact_pickup_phone')}`}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Adresse de livraison</h3>
                      <div className="space-y-1 text-sm">
                        <p>{form.getValues('delivery_address')}</p>
                        <p>{form.getValues('delivery_postal_code')} {form.getValues('delivery_city')}</p>
                        <p>{form.getValues('delivery_country')}</p>
                        {form.getValues('contact_delivery_name') && (
                          <p className="mt-2">
                            <span className="text-muted-foreground">Contact:</span> {form.getValues('contact_delivery_name')}
                            {form.getValues('contact_delivery_phone') && ` - ${form.getValues('contact_delivery_phone')}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes / Instructions spéciales</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Informations complémentaires pour la mission" 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              {/* Pièces jointes - NOUVELLE SECTION */}
              <div className="space-y-4 border-t pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Pièces jointes</h3>
                  
                  <FileUpload 
                    missionId={undefined} 
                    onDocumentUploaded={(documentId) => {
                      if (documentId) {
                        addPendingDocument(documentId);
                        toast.success("Document ajouté avec succès");
                      }
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
                {pendingDocuments.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {pendingDocuments.length} document(s) en attente d'association
                  </div>
                )}
              </div>
              
              <div className="border-t pt-6 mt-6">
                <FormField
                  control={form.control}
                  name="accept_terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          J'accepte les conditions générales de service
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <Button type="button" variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer la mission
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>
    </DocumentUploadContext.Provider>
  );
}
