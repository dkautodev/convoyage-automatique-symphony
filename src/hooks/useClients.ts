
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ClientData {
  id: string;
  name: string;
  email: string;
}

export const useClients = () => {
  const [clients, setClients] = useState<Record<string, ClientData>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name, email')
        .eq('role', 'client');
        
      if (error) throw error;
      
      // Create a map of client data by ID
      const clientMap: Record<string, ClientData> = {};
      
      data.forEach((client: any) => {
        clientMap[client.id] = {
          id: client.id,
          name: client.company_name || client.full_name || client.email,
          email: client.email
        };
      });
      
      setClients(clientMap);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchClients();
  }, []);
  
  return {
    clients,
    loading,
    error,
    fetchClients
  };
};
