
import React, { useState, useEffect } from "react";
import { typedSupabase } from "@/types/database";
import { useAuth } from "@/hooks/auth";
import ContactCard from "@/components/contacts/ContactCard";
import ContactForm from "@/components/contacts/ContactForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  client_id: string;
  client_name?: string;
}

export default function ContactsPage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addContactOpen, setAddContactOpen] = useState(false);

  const isAdmin = profile?.role === "admin";
  const dashboardLink = isAdmin ? "/admin/dashboard" : "/client/dashboard";

  const fetchContacts = async () => {
    try {
      setLoading(true);
      
      let query = typedSupabase
        .from("contacts")
        .select(`
          id, 
          first_name, 
          last_name, 
          email, 
          phone, 
          company_name, 
          client_id
        `)
        .order("last_name", { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching contacts:", error);
        toast.error("Erreur lors de la récupération des contacts");
        return;
      }

      // If admin, fetch client names for each contact
      if (isAdmin && data) {
        const contactsWithClientNames = await Promise.all(
          data.map(async (contact) => {
            const { data: clientData } = await typedSupabase
              .from("profiles")
              .select("company_name, full_name")
              .eq("id", contact.client_id)
              .single();

            return {
              ...contact,
              client_name: clientData?.company_name || clientData?.full_name || "Client inconnu",
            };
          })
        );

        setContacts(contactsWithClientNames as Contact[]);
      } else {
        setContacts(data as Contact[]);
      }
    } catch (error) {
      console.error("Exception fetching contacts:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [isAdmin, user?.id]);

  const handleDeleteContact = async (id: number) => {
    try {
      const { error } = await typedSupabase.from("contacts").delete().eq("id", id);

      if (error) {
        console.error("Error deleting contact:", error);
        toast.error("Erreur lors de la suppression du contact");
        return;
      }

      toast.success("Contact supprimé avec succès");
      fetchContacts();
    } catch (error) {
      console.error("Exception during contact deletion:", error);
      toast.error("Une erreur est survenue");
    }
  };

  const handleAddContactSuccess = () => {
    setAddContactOpen(false);
    fetchContacts();
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchTermLower) ||
      contact.last_name.toLowerCase().includes(searchTermLower) ||
      (contact.company_name &&
        contact.company_name.toLowerCase().includes(searchTermLower)) ||
      (contact.email && contact.email.toLowerCase().includes(searchTermLower)) ||
      (contact.phone && contact.phone.includes(searchTerm)) ||
      (contact.client_name &&
        contact.client_name.toLowerCase().includes(searchTermLower))
    );
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => navigate(dashboardLink)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Contacts</h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full sm:w-auto flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contact..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Sheet open={addContactOpen} onOpenChange={setAddContactOpen}>
          <SheetTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" /> Nouveau contact
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Ajouter un contact</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ContactForm onSuccess={handleAddContactSuccess} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredContacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onDelete={handleDeleteContact}
              onEdit={fetchContacts}
              showClientInfo={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchTerm
              ? "Aucun contact ne correspond à votre recherche"
              : "Aucun contact trouvé. Créez votre premier contact en cliquant sur \"Nouveau contact\"."}
          </p>
        </div>
      )}
    </div>
  );
}
