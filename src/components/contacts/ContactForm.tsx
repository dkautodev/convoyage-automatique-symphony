
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { typedSupabase } from "@/types/database";
import { useAuth } from "@/hooks/auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const contactSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide").optional().nullable(),
  phone: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

interface ContactFormProps {
  onSuccess: () => void;
  clientId?: string;
  initialData?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    company_name: string | null;
  };
}

export default function ContactForm({ onSuccess, clientId, initialData }: ContactFormProps) {
  const { user } = useAuth();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: initialData || {
      first_name: "",
      last_name: "",
      email: null,
      phone: null,
      company_name: null,
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const targetClientId = clientId || user?.id;
      
      if (!targetClientId) {
        toast.error("Erreur d'identification");
        return;
      }

      if (initialData) {
        // Update existing contact
        const { error } = await typedSupabase
          .from('contacts')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            company_name: values.company_name,
          })
          .eq('id', initialData.id);

        if (error) {
          console.error("Error updating contact:", error);
          toast.error("Erreur lors de la mise à jour du contact");
          return;
        }

        toast.success("Contact mis à jour avec succès");
      } else {
        // Insert new contact
        const { error } = await typedSupabase
          .from('contacts')
          .insert({
            client_id: targetClientId,
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: values.phone,
            company_name: values.company_name,
          });

        if (error) {
          console.error("Error creating contact:", error);
          toast.error("Erreur lors de la création du contact");
          return;
        }

        toast.success("Contact ajouté avec succès");
        form.reset({
          first_name: "",
          last_name: "",
          email: null,
          phone: null,
          company_name: null,
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Exception during contact save:", error);
      toast.error("Une erreur est survenue");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="first_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Prénom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="last_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="company_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Entreprise (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Nom de l'entreprise" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Email" type="email" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone (optionnel)</FormLabel>
              <FormControl>
                <Input placeholder="Téléphone" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit">{initialData ? "Mettre à jour" : "Ajouter"}</Button>
        </div>
      </form>
    </Form>
  );
}
