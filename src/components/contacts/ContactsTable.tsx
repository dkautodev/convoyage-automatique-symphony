
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
import { Trash, User, Mail, Phone } from 'lucide-react';
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

export const ContactsTable: React.FC<ContactsTableProps> = React.memo(({
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
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="bg-white">Nom / Contact</TableHead>
            <TableHead className="bg-white">Téléphone</TableHead>
            <TableHead className="bg-white">Email</TableHead>
            {showClientInfo && <TableHead className="bg-white min-w-[120px]">Client</TableHead>}
            <TableHead className="bg-white w-24 text-left">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="h-16">
              <TableCell className="font-medium">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-neutral-500 flex-shrink-0" />
                  <div className="flex flex-col">
                    <div className="font-semibold text-gray-900">
                      {contact.name_s || 'Sans nom'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Contact
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {contact.phone ? (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-neutral-500" />
                    <span>{contact.phone}</span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>
                {contact.email ? (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-neutral-500" />
                    <span>{contact.email}</span>
                  </div>
                ) : (
                  '-'
                )}
              </TableCell>
              {showClientInfo && (
                <TableCell className="min-w-[120px] whitespace-nowrap">
                  {clientData && clientData[contact.client_id] 
                    ? clientData[contact.client_id].name 
                    : 'Client inconnu'}
                </TableCell>
              )}
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1 bg-white border-gray-200 hover:bg-gray-50">
                      <Trash className="h-3.5 w-3.5 text-red-500" />
                      Supprimer
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
});
