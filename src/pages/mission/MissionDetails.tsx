
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { Mission, MissionFromDB, convertMissionFromDB, missionStatusLabels, missionStatusColors, MissionStatus, vehicleCategoryLabels } from '@/types/supabase';
import { formatAddressDisplay, formatMissionNumber } from '@/utils/missionUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Package, Edit, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Import our new components
import { MissionDetailsCard } from '@/components/mission/MissionDetailsCard';
import { MissionStatusHistory } from '@/components/mission/MissionStatusHistory';
import { MissionEditForm, MissionUpdateFormValues } from '@/components/mission/MissionEditForm';

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
  vehicle_year: z.string().optional()
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
  
  const form = useForm<MissionUpdateFormValues>({
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
      
      // Mettre à jour les valeurs du formulaire avec les données de la mission
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
        vehicle_year: missionObj.vehicle_year ? String(missionObj.vehicle_year) : ''
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
  
  const onSubmit = async (data: MissionUpdateFormValues) => {
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
        
        // Convert string to number or null for vehicle_year
        updateData.vehicle_year = data.vehicle_year ? parseInt(data.vehicle_year, 10) || null : null;
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

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    fetchMission(); // Réinitialiser les valeurs
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
  const formattedDate = mission.created_at 
    ? new Date(mission.created_at).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : 'Date inconnue';

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
          <MissionDetailsCard 
            mission={mission} 
            client={client}
            isAdmin={isAdmin}
            editMode={editMode}
            onEditClick={handleEditClick}
            onCancelEdit={handleCancelEdit}
          />
          
          <MissionEditForm
            form={form}
            onSubmit={onSubmit}
            updating={updating}
            editMode={editMode}
            mission={mission}
          />
        </TabsContent>

        <TabsContent value="history">
          <MissionStatusHistory statusHistory={statusHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MissionDetailsPage;
