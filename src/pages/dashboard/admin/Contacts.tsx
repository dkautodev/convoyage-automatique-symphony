
import React from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useClients } from '@/hooks/useClients';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { AddContactDialog } from '@/components/contacts/AddContactDialog';
import { ContactFormData } from '@/types/contact';

const AdminContactsPage: React.FC = () => {
  const { contacts, loading, createContact, deleteContact } = useContacts();
  const { clients, loading: loadingClients } = useClients();
  
  const handleAddContact = async (data: ContactFormData) => {
    await createContact(data);
  };
  
  const handleDeleteContact = async (id: number) => {
    await deleteContact(id);
  };
  
  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex justify-between items-center p-6 border-b">
          <h1 className="text-2xl font-bold">Répertoire des contacts</h1>
          <AddContactDialog onAddContact={handleAddContact} />
        </div>
        
        <div className="p-6">
          <ContactsTable
            contacts={contacts}
            loading={loading || loadingClients}
            showClientInfo={true}
            clientData={clients}
            onDeleteContact={handleDeleteContact}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminContactsPage;
