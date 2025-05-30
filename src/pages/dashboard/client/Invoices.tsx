
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import { Search } from 'lucide-react';
import InvoicesTable from '@/components/invoice/InvoicesTable';
import { useIsMobile } from '@/hooks/use-mobile';

const ClientInvoicesPage = () => {
  const { user, profile } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  // Fetch missions with status 'livre' or 'termine' for the current client
  useEffect(() => {
    const fetchMissions = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('missions')
          .select('*')
          .eq('client_id', user.id)
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

    fetchMissions();
  }, [user?.id]);

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

      // Search by mission date
      const missionDate = new Date(mission.created_at).toLocaleDateString('fr-FR');
      if (missionDate.includes(lowerSearchQuery)) return true;

      return false;
    });

    setFilteredMissions(filtered);
  }, [searchQuery, missions]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 text-center">Mes factures</h1>
      
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
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-center md:text-left">Missions facturées</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <InvoicesTable 
              missions={filteredMissions} 
              isLoading={loading}
              userRole="client"
              clientData={profile}
              layout={isMobile ? "stacked" : "table"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientInvoicesPage;
