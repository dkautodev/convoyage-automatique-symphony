
import { supabase } from '@/integrations/supabase/client';
import { Address, UserRole } from '@/types/supabase';
import { Json } from '@/integrations/supabase/types';
import { convertJsonToType } from '@/types/database';

export interface Client {
  id: string;
  company_name: string;
  siret: string;
  vat_number?: string | null;
  billing_address?: Address | null;
  phone1?: string;
  phone2?: string | null;
  created_at?: string;
  full_name?: string | null;
  email?: string;
  profile_completed?: boolean;
}

export const fetchClients = async (): Promise<Client[]> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'client')
      .order('company_name', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // Conversion des données des profils au format Client
    return data ? data.map(profile => ({
      id: profile.id,
      company_name: profile.company_name,
      siret: profile.siret,
      vat_number: profile.tva_number,
      billing_address: convertJsonToType(profile.billing_address),
      phone1: profile.phone_1,
      phone2: profile.phone_2,
      created_at: profile.created_at,
      full_name: profile.full_name,
      email: profile.email,
      profile_completed: profile.profile_completed || false
    })) : [];
  } catch (error) {
    console.error('Erreur lors du chargement des clients:', error);
    return [];
  }
};

export const fetchClientById = async (id: string): Promise<Client | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'client')
      .single();
    
    if (error) {
      throw error;
    }
    
    return data ? {
      id: data.id,
      company_name: data.company_name,
      siret: data.siret,
      vat_number: data.tva_number,
      billing_address: convertJsonToType(data.billing_address),
      phone1: data.phone_1,
      phone2: data.phone_2,
      created_at: data.created_at,
      full_name: data.full_name,
      email: data.email,
      profile_completed: data.profile_completed || false
    } : null;
  } catch (error) {
    console.error(`Erreur lors du chargement du client ${id}:`, error);
    return null;
  }
};

export const createClient = async (client: Omit<Client, 'id' | 'created_at'>): Promise<string | null> => {
  try {
    // Generate a UUID for the client
    const id = crypto.randomUUID();
    
    // Préparer les données pour l'insertion dans profiles
    const profileData = {
      id,
      email: client.email,
      role: 'client' as UserRole,
      full_name: client.full_name,
      company_name: client.company_name,
      siret: client.siret,
      tva_number: client.vat_number,
      billing_address: client.billing_address as unknown as Json,
      phone_1: client.phone1,
      phone_2: client.phone2,
      profile_completed: true
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
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
    // Convertir les champs client vers les noms de champs profiles
    const profileUpdates = {
      full_name: updates.full_name,
      company_name: updates.company_name,
      siret: updates.siret,
      tva_number: updates.vat_number,
      billing_address: updates.billing_address ? updates.billing_address as unknown as Json : undefined,
      phone_1: updates.phone1,
      phone_2: updates.phone2
    };
    
    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
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
    // Note: Nous ne supprimons pas réellement le profil, nous changeons simplement son rôle
    const { error } = await supabase
      .from('profiles')
      .update({ active: false })
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
