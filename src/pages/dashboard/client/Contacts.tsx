
import React from 'react';
import { useContacts } from '@/hooks/useContacts';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactFormData } from '@/types/contact';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ClientContactsPage: React.FC = () => {
  const { contacts, loading, createContact, deleteContact } = useContacts();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  
  const handleAddContact = async (data: ContactFormData) => {
    await createContact(data);
  };
  
  const handleDeleteContact = async (id: number) => {
    await deleteContact(id);
  };

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (contact.name_s && contact.name_s.toLowerCase().includes(searchLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.phone && contact.phone.toLowerCase().includes(searchLower))
    );
  });
  
  return (
    <div className="space-y-6">
      {/* Titre principal centré */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Mes contacts</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-bold text-2xl">Liste des contacts</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">Gérez vos contacts personnels</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
              <Input 
                type="search" 
                placeholder="Rechercher un contact..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <AddContactDialog onAddContact={handleAddContact} />
          </div>
        </div>
        
        <div className="p-6">
          <ContactsTable
            contacts={filteredContacts}
            loading={loading}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientContactsPage;
