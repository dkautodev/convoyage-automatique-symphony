
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, UserPlus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Contact } from '@/types/contact';
import { useContacts } from '@/hooks/useContacts';

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
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { contacts, loading: contactsLoading } = useContacts(clientId);
  
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
          
          {contactsLoading ? (
            <p className="text-sm text-muted-foreground">Chargement des contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun contact trouvé</p>
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
                    <span>{contact.name_s || 'Sans nom'}</span>
                    <span className="text-xs text-muted-foreground">
                      {contact.phone || contact.email || ''}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
