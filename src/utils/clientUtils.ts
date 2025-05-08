
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/supabase';
import { Json } from '@/integrations/supabase/types';
import { convertJsonToType } from '@/types/database';

export const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('company_name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Convert from Supabase Json to our Address type
    return data ? data.map(client => ({
      ...client,
      billing_address: convertJsonToType(client.billing_address)
    })) : [];
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
    
    // Convert from Supabase Json to our Address type
    return data ? {
      ...data,
      billing_address: convertJsonToType(data.billing_address)
    } : null;
  } catch (error) {
    console.error(`Erreur lors du chargement du client ${id}:`, error);
    return null;
  }
};

export const createClient = async (client: Omit<Client, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    // Convert Address type to Json for Supabase
    const supabaseClient = {
      ...client,
      billing_address: client.billing_address as unknown as Json
    };
    
    const { data, error } = await supabase
      .from('clients')
      .insert([supabaseClient])
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
    // Convert Address type to Json for Supabase if it exists in the updates
    const supabaseUpdates = {
      ...updates,
      billing_address: updates.billing_address ? updates.billing_address as unknown as Json : undefined
    };
    
    const { error } = await supabase
      .from('clients')
      .update(supabaseUpdates)
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
