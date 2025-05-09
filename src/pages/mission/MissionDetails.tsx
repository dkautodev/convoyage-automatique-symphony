
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, missionStatusLabels, missionStatusColors, MissionStatus } from '@/types/supabase';
import { formatAddressDisplay, formatMissionNumber, formatFullAddress } from '@/utils/missionUtils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Package, User, MapPin, Calendar, Clock, Truck, FileText, Edit, Save } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Schéma de validation pour la mise à jour de la mission
const missionUpdateSchema = z.object({
  status: z.string(),
  mission_type: z.string().optional(),
  notes: z.string().optional(),
  contact_pickup_name: z.string().optional(),
  contact_pickup_phone: z.string().optional(),
  contact_pickup_email: z.string().email().optional().or(z.literal('')),
  contact_delivery_name: z.string().optional(),
  contact_delivery_phone: z.string().optional(),
  contact_delivery_email: z.string().email().optional().or(z.literal('')),
  scheduled_date: z.string().optional(),
  vehicle_make: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_registration: z.string().optional(),
  vehicle_vin: z.string().optional(),
  vehicle_fuel: z.string().optional(),
  vehicle_year: z.number().optional().nullable().or(z.string().transform(val => val === '' ? null : parseInt(val, 10)))
});

const MissionDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [mission, setMission] = useState<Mission | null>(null);
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  
  const form = useForm({
    resolver: zodResolver(missionUpdateSchema),
    defaultValues: {
      status: '',
      mission_type: '',
      notes: '',
      contact_pickup_name: '',
      contact_pickup_phone: '',
      contact_pickup_email: '',
      contact_delivery_name: '',
      contact_delivery_phone: '',
      contact_delivery_email: '',
      scheduled_date: '',
      vehicle_make: '',
      vehicle_model: '',
      vehicle_registration: '',
      vehicle_vin: '',
      vehicle_fuel: '',
      vehicle_year: ''
    },
  });
  
  const isAdmin = profile?.role === 'admin';
  const userRole = profile?.role || 'client';
  
  useEffect(() => {
    fetchMission();
    fetchStatusHistory();
  }, [id]);
  
  const fetchMission = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      const { data: missionData, error: missionError } = await typedSupabase
        .from('missions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (missionError) {
        console.error('Erreur lors de la récupération de la mission:', missionError);
        toast.error('Impossible de charger les détails de la mission');
        return;
      }
      
      console.log('Mission data retrieved:', missionData);
      const missionObj = convertMissionFromDB(missionData as unknown as MissionFromDB);
      setMission(missionObj);
      
      // Récupérer les informations du client
      if (missionObj.client_id) {
        const { data: clientData, error: clientError } = await typedSupabase
          .from('profiles')
          .select('*')
          .eq('id', missionObj.client_id)
          .single();
        
        if (!clientError && clientData) {
          setClient(clientData);
        }
      }
      
      console.log('Setting form values with:', missionObj);
      // Mettre à jour les valeurs du formulaire
      form.reset({
        status: missionObj.status,
        mission_type: missionObj.mission_type || '',
        notes: missionObj.notes || '',
        contact_pickup_name: missionObj.contact_pickup_name || '',
        contact_pickup_phone: missionObj.contact_pickup_phone || '',
        contact_pickup_email: missionObj.contact_pickup_email || '',
        contact_delivery_name: missionObj.contact_delivery_name || '',
        contact_delivery_phone: missionObj.contact_delivery_phone || '',
        contact_delivery_email: missionObj.contact_delivery_email || '',
        scheduled_date: missionObj.scheduled_date ? new Date(missionObj.scheduled_date).toISOString().split('T')[0] : '',
        vehicle_make: missionObj.vehicle_make || '',
        vehicle_model: missionObj.vehicle_model || '',
        vehicle_registration: missionObj.vehicle_registration || '',
        vehicle_vin: missionObj.vehicle_vin || '',
        vehicle_fuel: missionObj.vehicle_fuel || '',
        vehicle_year: missionObj.vehicle_year ? missionObj.vehicle_year.toString() : ''
      });
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue lors du chargement de la mission');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchStatusHistory = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await typedSupabase
        .from('mission_status_history')
        .select('*')
        .eq('mission_id', id)
        .order('changed_at', { ascending: false });
      
      if (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return;
      }
      
      console.log('Status history:', data);
      setStatusHistory(data || []);
      
    } catch (error) {
      console.error('Erreur:', error);
    }
  };
  
  const onSubmit = async (data: z.infer<typeof missionUpdateSchema>) => {
    if (!mission || !id) return;
    
    try {
      setUpdating(true);
      console.log('Submitting form with data:', data);
      
      // Préparer les données à mettre à jour
      const updateData: any = {
        status: data.status as MissionStatus,
      };
      
      // Ajouter les champs modifiables seulement si on est en mode édition
      if (editMode) {
        updateData.mission_type = data.mission_type;
        updateData.notes = data.notes;
        updateData.contact_pickup_name = data.contact_pickup_name;
        updateData.contact_pickup_phone = data.contact_pickup_phone;
        updateData.contact_pickup_email = data.contact_pickup_email;
        updateData.contact_delivery_name = data.contact_delivery_name;
        updateData.contact_delivery_phone = data.contact_delivery_phone;
        updateData.contact_delivery_email = data.contact_delivery_email;
        updateData.scheduled_date = data.scheduled_date ? new Date(data.scheduled_date).toISOString() : mission.scheduled_date;
        updateData.vehicle_make = data.vehicle_make;
        updateData.vehicle_model = data.vehicle_model;
        updateData.vehicle_registration = data.vehicle_registration;
        updateData.vehicle_vin = data.vehicle_vin;
        updateData.vehicle_fuel = data.vehicle_fuel;
        updateData.vehicle_year = data.vehicle_year;
      }

      console.log('Updating mission with data:', updateData);
      
      const { error } = await typedSupabase
        .from('missions')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors de la mise à jour de la mission:', error);
        toast.error('Impossible de mettre à jour la mission');
        return;
      }
      
      toast.success(
        editMode 
          ? 'La mission a été mise à jour avec succès' 
          : 'Le statut de la mission a été mis à jour'
      );
      
      // Rafraîchir les données
      fetchMission();
      fetchStatusHistory();
      setEditMode(false);
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };
  
  const handleBack = () => {
    const basePath = userRole === 'admin' ? '/admin/missions' : '/client/missions';
    navigate(basePath);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!mission) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <h3 className="text-lg font-medium">Mission introuvable</h3>
            <p className="text-gray-500 mt-1">Cette mission n'existe pas ou a été supprimée.</p>
            <Button className="mt-4" onClick={handleBack}>
              Retour aux missions
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const missionNumber = formatMissionNumber(mission);
  const pickupAddress = formatAddressDisplay(mission.pickup_address);
  const deliveryAddress = formatAddressDisplay(mission.delivery_address);
  const clientName = client?.company_name || client?.full_name || 'Client inconnu';
  const formattedDate = mission.created_at 
    ? new Date(mission.created_at).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : 'Date inconnue';
    
  const scheduledDate = mission.scheduled_date 
    ? new Date(mission.scheduled_date).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }) 
    : 'Non planifiée';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mission #{missionNumber}
            <Badge className={missionStatusColors[mission.status]}>
              {missionStatusLabels[mission.status]}
            </Badge>
          </h2>
          <p className="text-gray-500">Créée le {formattedDate}</p>
        </div>
        <Button onClick={handleBack} variant="outline">
          Retour aux missions
        </Button>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations générales
              </CardTitle>
              {isAdmin && !editMode && (
                <Button 
                  variant="outline" 
                  onClick={() => setEditMode(true)}
                  size="sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier les détails
                </Button>
              )}
              {editMode && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditMode(false);
                    fetchMission(); // Réinitialiser les valeurs
                  }}
                  size="sm"
                >
                  Annuler
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Client</h4>
                  <p className="text-lg font-medium flex items-center gap-1">
                    <User className="h-4 w-4 text-gray-500" />
                    {clientName}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Distance</h4>
                  <p className="text-lg font-medium">{mission.distance_km.toFixed(2)} km</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Prix HT</h4>
                  <p className="text-lg font-medium">{mission.price_ht.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Prix TTC</h4>
                  <p className="text-lg font-medium">{mission.price_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Date prévue</h4>
                  <p className="text-lg font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {scheduledDate}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Type de mission</h4>
                  <p className="text-lg font-medium">{mission.mission_type || 'Non spécifié'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Adresse de départ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p>{formatFullAddress(mission.pickup_address)}</p>
                        
                        {mission.contact_pickup_name && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium">{mission.contact_pickup_name}</p>
                            {mission.contact_pickup_phone && <p>{mission.contact_pickup_phone}</p>}
                            {mission.contact_pickup_email && <p>{mission.contact_pickup_email}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Adresse de livraison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p>{formatFullAddress(mission.delivery_address)}</p>
                        
                        {mission.contact_delivery_name && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="font-medium">{mission.contact_delivery_name}</p>
                            {mission.contact_delivery_phone && <p>{mission.contact_delivery_phone}</p>}
                            {mission.contact_delivery_email && <p>{mission.contact_delivery_email}</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Contacts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Contact ramassage</h4>
                        {mission.contact_pickup_name ? (
                          <div className="space-y-1">
                            <p><span className="font-medium">Nom:</span> {mission.contact_pickup_name}</p>
                            {mission.contact_pickup_phone && <p><span className="font-medium">Téléphone:</span> {mission.contact_pickup_phone}</p>}
                            {mission.contact_pickup_email && <p><span className="font-medium">Email:</span> {mission.contact_pickup_email}</p>}
                          </div>
                        ) : (
                          <p className="text-gray-500">Aucun contact spécifié</p>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Contact livraison</h4>
                        {mission.contact_delivery_name ? (
                          <div className="space-y-1">
                            <p><span className="font-medium">Nom:</span> {mission.contact_delivery_name}</p>
                            {mission.contact_delivery_phone && <p><span className="font-medium">Téléphone:</span> {mission.contact_delivery_phone}</p>}
                            {mission.contact_delivery_email && <p><span className="font-medium">Email:</span> {mission.contact_delivery_email}</p>}
                          </div>
                        ) : (
                          <p className="text-gray-500">Aucun contact spécifié</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Informations véhicule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mission.vehicle_category && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Catégorie</h4>
                        <p>{mission.vehicle_category}</p>
                      </div>
                    )}
                    {mission.vehicle_make && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Marque</h4>
                        <p>{mission.vehicle_make}</p>
                      </div>
                    )}
                    {mission.vehicle_model && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Modèle</h4>
                        <p>{mission.vehicle_model}</p>
                      </div>
                    )}
                    {mission.vehicle_registration && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Immatriculation</h4>
                        <p>{mission.vehicle_registration}</p>
                      </div>
                    )}
                    {mission.vehicle_vin && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">VIN</h4>
                        <p>{mission.vehicle_vin}</p>
                      </div>
                    )}
                    {mission.vehicle_fuel && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Carburant</h4>
                        <p>{mission.vehicle_fuel}</p>
                      </div>
                    )}
                    {mission.vehicle_year && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Année</h4>
                        <p>{mission.vehicle_year}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {mission.notes && (
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{mission.notes}</p>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                {editMode ? 'Modifier la mission' : 'Changer le statut'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut de la mission</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={updating}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un statut" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_acceptation">En cours d'acceptation</SelectItem>
                            <SelectItem value="accepte">Accepté</SelectItem>
                            <SelectItem value="prise_en_charge">En cours de prise en charge</SelectItem>
                            <SelectItem value="livraison">En cours de livraison</SelectItem>
                            <SelectItem value="livre">Livré</SelectItem>
                            <SelectItem value="termine">Terminé</SelectItem>
                            <SelectItem value="annule">Annulé</SelectItem>
                            <SelectItem value="incident">Incident</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {editMode && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="mission_type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type de mission</FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={updating}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un type de mission" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="LIV">LIV</SelectItem>
                                  <SelectItem value="RES">RES</SelectItem>
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
                                <Input type="date" {...field} disabled={updating} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t pt-6 mt-6">
                        <h3 className="font-medium mb-4">Contact pour le ramassage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="contact_pickup_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom de contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nom de contact" disabled={updating} />
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
                                  <Input {...field} placeholder="Téléphone" disabled={updating} />
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
                                  <Input {...field} placeholder="Email" disabled={updating} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-6 mt-6">
                        <h3 className="font-medium mb-4">Contact pour la livraison</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="contact_delivery_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nom de contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Nom de contact" disabled={updating} />
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
                                  <Input {...field} placeholder="Téléphone" disabled={updating} />
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
                                  <Input {...field} placeholder="Email" disabled={updating} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="border-t pt-6 mt-6">
                        <h3 className="font-medium mb-4">Informations véhicule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Catégorie de véhicule affichée mais non modifiable */}
                          <div>
                            <h4 className="text-sm font-medium">Catégorie de véhicule</h4>
                            <p className="mt-1 p-2 border rounded bg-gray-50">{mission.vehicle_category || 'Non spécifiée'}</p>
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="vehicle_registration"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Immatriculation</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="AB-123-CD" disabled={updating} />
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
                                  <Input {...field} placeholder="Marque" disabled={updating} />
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
                                  <Input {...field} placeholder="Modèle" disabled={updating} />
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
                                <FormLabel>VIN</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Numéro VIN" disabled={updating} />
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
                                <FormControl>
                                  <Input {...field} placeholder="Type de carburant" disabled={updating} />
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
                                  <Input {...field} placeholder="Année" type="number" disabled={updating} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Informations complémentaires sur la mission" 
                                rows={4}
                                disabled={updating}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <Button type="submit" disabled={updating}>
                    {updating && <span className="animate-spin mr-2">●</span>}
                    {editMode ? 'Enregistrer les modifications' : 'Mettre à jour le statut'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historique des statuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Aucun historique disponible pour cette mission</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`${missionStatusColors[entry.new_status]} w-24 justify-center`}>
                          {missionStatusLabels[entry.new_status]}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.changed_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {entry.old_status && (
                        <div className="mt-2 text-sm text-gray-500">
                          Ancien statut: <span className="font-medium">{missionStatusLabels[entry.old_status]}</span>
                        </div>
                      )}
                      {entry.changed_by && (
                        <div className="mt-1 text-sm text-gray-500">
                          Modifié par: {entry.changed_by || "Utilisateur inconnu"}
                        </div>
                      )}
                      {entry.notes && (
                        <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionDetailsPage;
