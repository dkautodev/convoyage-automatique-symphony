
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Building, Trash, Edit, User } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ContactForm from "./ContactForm";
import { useAuth } from "@/hooks/auth";

export interface ContactCardProps {
  contact: {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    client_id?: string;
    client_name?: string;
  };
  onDelete: (id: number) => void;
  onEdit: () => void;
  showClientInfo?: boolean;
}

export default function ContactCard({
  contact,
  onDelete,
  onEdit,
  showClientInfo = false,
}: ContactCardProps) {
  const { profile } = useAuth();
  const [editOpen, setEditOpen] = React.useState(false);

  const handleDelete = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce contact?")) {
      onDelete(contact.id);
    }
  };

  const handleEditSuccess = () => {
    setEditOpen(false);
    onEdit();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <User className="h-4 w-4 mr-2" />
            {contact.first_name} {contact.last_name}
          </CardTitle>
          <div className="flex gap-1">
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Modifier le contact</DialogTitle>
                </DialogHeader>
                <ContactForm
                  initialData={{
                    id: contact.id,
                    first_name: contact.first_name,
                    last_name: contact.last_name,
                    email: contact.email,
                    phone: contact.phone,
                    company_name: contact.company_name,
                  }}
                  onSuccess={handleEditSuccess}
                  clientId={contact.client_id}
                />
              </DialogContent>
            </Dialog>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive/80"
              onClick={handleDelete}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {contact.company_name && (
            <div className="flex items-center">
              <Building className="h-4 w-4 mr-2 text-gray-500" />
              <span>{contact.company_name}</span>
            </div>
          )}
          
          {contact.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-2 text-gray-500" />
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-sm truncate">{contact.email}</span>
            </div>
          )}

          {showClientInfo && contact.client_name && profile?.role === "admin" && (
            <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
              Client: {contact.client_name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
