
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Contact } from '@/types/contact';
import { Trash } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ContactsTableProps {
  contacts: Contact[];
  loading: boolean;
  showClientInfo?: boolean;
  clientData?: Record<string, { name: string }>;
  onDeleteContact: (id: number) => Promise<void>;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({
  contacts,
  loading,
  showClientInfo = false,
  clientData,
  onDeleteContact
}) => {
  if (loading) {
    return <div className="text-center py-8">Chargement des contacts...</div>;
  }
  
  if (contacts.length === 0) {
    return <div className="text-center py-8">Aucun contact trouvé</div>;
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom complet / société</TableHead>
            <TableHead>Téléphone</TableHead>
            <TableHead>Email</TableHead>
            {showClientInfo && <TableHead>Client</TableHead>}
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                {contact.name_s || '-'}
              </TableCell>
              <TableCell>{contact.phone || '-'}</TableCell>
              <TableCell>{contact.email || '-'}</TableCell>
              {showClientInfo && (
                <TableCell>
                  {clientData && clientData[contact.client_id] 
                    ? clientData[contact.client_id].name 
                    : 'Client inconnu'}
                </TableCell>
              )}
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmation de suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer ce contact ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-red-500 hover:bg-red-600" 
                        onClick={() => onDeleteContact(contact.id)}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
