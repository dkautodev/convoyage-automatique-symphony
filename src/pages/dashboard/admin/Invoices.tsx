
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Mission, MissionFromDB, convertMissionFromDB } from '@/types/supabase';
import InvoicesTable from '@/components/invoice/InvoicesTable';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AdminInvoicesPage = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filteredMissions, setFilteredMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'livre' | 'termine'>('all');
  const [clientsData, setClientsData] = useState<Record<string, any>>({});
  const isMobile = useIsMobile();
  
  // Fetch clients data
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, company_name, email')
          .eq('role', 'client');
          
        if (error) throw error;
        
        // Create a map for easy lookup
        const clientsMap: Record<string, any> = {};
        data?.forEach(client => {
          clientsMap[client.id] = {
            name: client.company_name || client.full_name || client.email || 'Client inconnu'
          };
        });
        
        setClientsData(clientsMap);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    };
    
    fetchClients();
  }, []);
  
  // Fetch all invoiced missions (status: 'livre' or 'termine')
  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .in('status', ['livre', 'termine'])
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Convert the mission data
      const convertedMissions = data.map(mission => 
        convertMissionFromDB(mission as unknown as MissionFromDB)
      );
      
      setMissions(convertedMissions);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchMissions();
  }, []);
  
  // Search and filter
  useEffect(() => {
    let filtered = missions;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mission => mission.status === statusFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const lowerSearchQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(mission => {
        // Search by mission number
        const missionNumber = mission.mission_number || mission.id.substring(0, 8);
        if (missionNumber.toLowerCase().includes(lowerSearchQuery)) return true;
        
        // Search by mission date
        const missionDate = new Date(mission.created_at).toLocaleDateString('fr-FR');
        if (missionDate.includes(lowerSearchQuery)) return true;
        
        // Search by client name
        const clientInfo = clientsData[mission.client_id];
        if (clientInfo?.name.toLowerCase().includes(lowerSearchQuery)) return true;
        
        return false;
      });
    }
    
    setFilteredMissions(filtered);
  }, [searchQuery, missions, clientsData, statusFilter]);

  const getFilterLabel = () => {
    switch (statusFilter) {
      case 'livre': return 'À payer';
      case 'termine': return 'Payé';
      default: return 'Tous';
    }
  };

  const clearFilter = () => {
    setStatusFilter('all');
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900 text-center">Factures</h1>
      
      <div className="flex items-center gap-2 mb-4">
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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 whitespace-nowrap">
              <Filter size={16} />
              {getFilterLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              Tous
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('livre')}>
              À payer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('termine')}>
              Payé
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={clearFilter} className="h-9 w-9 p-0">
            <X size={16} />
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-3 md:pb-4">
          <CardTitle className="text-center md:text-left">Missions facturées</CardTitle>
        </CardHeader>
        <CardContent className="px-3 md:px-6">
          <div className="overflow-x-auto -mx-3 md:mx-0">
            <InvoicesTable 
              missions={filteredMissions} 
              clientsData={clientsData}
              isLoading={loading}
              userRole="admin"
              onMissionStatusUpdate={fetchMissions}
              layout={isMobile ? "stacked" : "table"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvoicesPage;
