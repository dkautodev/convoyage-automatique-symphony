
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Search } from 'lucide-react';
import InvoicesTable from '@/components/invoice/InvoicesTable';
import { fetchClientById } from '@/utils/clientUtils';

const AdminInvoicesPage = () => {
  const { profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [clientsData, setClientsData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch missions with status 'livre' or 'termine'
  const fetchMissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .in('status', ['livre', 'termine'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      const convertedMissions = data.map(mission => 
        convertMissionFromDB(mission as unknown as MissionFromDB)
      );
      
      setMissions(convertedMissions);
      setFilteredMissions(convertedMissions);
    } catch (err) {
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  // Fetch client data with more details including billing_address
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'client');

        if (error) throw error;

        // Create a map of client ID to complete client data
        const clientMap: Record<string, any> = {};
        data?.forEach(client => {
          clientMap[client.id] = {
            id: client.id,
            name: client.company_name || client.full_name || 'Client inconnu',
            company_name: client.company_name,
            full_name: client.full_name,
            email: client.email,
            siret: client.siret,
            tva_number: client.tva_number,
            billing_address: client.billing_address,
            phone_1: client.phone_1,
            phone_2: client.phone_2
          };
        });

        setClientsData(clientMap);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };

    fetchClients();
  }, []);

  // Filter missions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMissions(missions);
      return;
    }

    const lowerSearchQuery = searchQuery.toLowerCase();
    const filtered = missions.filter(mission => {
      // Search by mission number
      const missionNumber = mission.mission_number || mission.id.substring(0, 8);
      if (missionNumber.toLowerCase().includes(lowerSearchQuery)) return true;

      // Search by client name if available
      const clientName = clientsData[mission.client_id]?.name || '';
      if (clientName.toLowerCase().includes(lowerSearchQuery)) return true;

      // Search by mission date
      const missionDate = new Date(mission.created_at).toLocaleDateString('fr-FR');
      if (missionDate.includes(lowerSearchQuery)) return true;

      return false;
    });

    setFilteredMissions(filtered);
  }, [searchQuery, missions, clientsData]);

  // Handle mission status update
  const handleMissionStatusUpdate = () => {
    fetchMissions();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-admin">Facturation</h1>
      
      <div className="flex gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input 
            type="search" 
            placeholder="Rechercher une facture..." 
            className="pl-8" 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Missions à facturer</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoicesTable 
            missions={filteredMissions} 
            clientsData={clientsData}
            isLoading={loading}
            userRole="admin"
            onMissionStatusUpdate={handleMissionStatusUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoicesPage;
