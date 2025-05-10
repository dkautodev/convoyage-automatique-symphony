
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { User, UserPlus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  client_id: string;
}

interface ContactSelectorProps {
  onSelectContact: (contact: Contact) => void;
  clientId?: string;
  variant?: "outline" | "default" | "secondary";
  size?: "sm" | "default";
}

export default function ContactSelector({ 
  onSelectContact, 
  clientId,
  variant = "outline",
  size = "sm"
}: ContactSelectorProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id && !clientId) return;
      
      try {
        setLoading(true);
        
        // Use the provided clientId or the current user's ID
        const targetClientId = clientId || user?.id;
        
        const { data, error } = await typedSupabase
          .from('contacts')
          .select('*')
          .eq('client_id', targetClientId);
          
        if (error) {
          console.error('Error fetching contacts:', error);
          return;
        }
        
        setContacts(data as Contact[]);
      } catch (error) {
        console.error('Exception fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContacts();
  }, [clientId, user]);
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={variant} size={size} className="h-8">
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Contact existant
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2">
          <h4 className="font-medium">Sélectionner un contact</h4>
          
          {loading ? (
            <p className="text-sm text-muted-foreground">Chargement des contacts...</p>
          ) : contacts.length === 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Aucun contact trouvé</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => window.open(user?.role === 'admin' ? '/admin/contacts' : '/client/contacts', '_blank')}
              >
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Gérer les contacts
              </Button>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-1">
              {contacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className="w-full justify-start text-left"
                  onClick={() => onSelectContact(contact)}
                >
                  <User className="h-4 w-4 mr-2" />
                  <div className="flex flex-col items-start">
                    <span>{contact.first_name} {contact.last_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {contact.phone || contact.email || ''}
                    </span>
                  </div>
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => window.open(user?.role === 'admin' ? '/admin/contacts' : '/client/contacts', '_blank')}
              >
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Gérer les contacts
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
