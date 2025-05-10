
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Contact, ContactFormData } from '@/types/contact';
import { toast } from 'sonner';

export const useContacts = (clientId?: string) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useAuth();
  
  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase.from('contacts').select('*');
      
      // If client ID is provided or user is a client, filter by client_id
      if (clientId) {
        query = query.eq('client_id', clientId);
      } else if (profile?.role === 'client') {
        query = query.eq('client_id', profile.id);
      }
      
      // Add ordering
      query = query.order('last_name', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setContacts(data as Contact[]);
    } catch (err: any) {
      console.error('Error fetching contacts:', err);
      setError(err.message);
      toast.error('Erreur lors du chargement des contacts');
    } finally {
      setLoading(false);
    }
  };
  
  const createContact = async (contactData: ContactFormData): Promise<Contact | null> => {
    try {
      // If client_id is not provided, use the current user's ID for client users
      const client_id = clientId || profile?.id;
      
      if (!client_id) {
        throw new Error("ID client non disponible");
      }
      
      const newContact = {
        ...contactData,
        client_id
      };
      
      const { data, error } = await supabase
        .from('contacts')
        .insert(newContact)
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('Contact ajouté avec succès');
      
      // Refresh contacts list
      fetchContacts();
      
      return data as Contact;
    } catch (err: any) {
      console.error('Error creating contact:', err);
      toast.error(`Erreur lors de la création du contact: ${err.message}`);
      return null;
    }
  };
  
  const deleteContact = async (contactId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);
        
      if (error) throw error;
      
      toast.success('Contact supprimé avec succès');
      
      // Update local state
      setContacts(contacts.filter(contact => contact.id !== contactId));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting contact:', err);
      toast.error(`Erreur lors de la suppression du contact: ${err.message}`);
      return false;
    }
  };
  
  useEffect(() => {
    if (profile) {
      fetchContacts();
    }
  }, [profile, clientId]);
  
  return {
    contacts,
    loading,
    error,
    fetchContacts,
    createContact,
    deleteContact
  };
};
