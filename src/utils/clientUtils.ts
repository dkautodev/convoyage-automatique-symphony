
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/supabase';

export const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error);
    return [];
  }
};

export const fetchClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Erreur lors du chargement du client ${id}:`, error);
    return null;
  }
};

export const createClient = async (client: Omit<Client, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([client])
      .select();
    
    if (error) {
      throw error;
    }
    
    return data?.[0]?.id || null;
  } catch (error) {
    console.error('Erreur lors de la création du client:', error);
    return null;
  }
};

export const updateClient = async (id: string, updates: Partial<Client>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du client ${id}:`, error);
    return false;
  }
};

export const deleteClient = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression du client ${id}:`, error);
    return false;
  }
};
