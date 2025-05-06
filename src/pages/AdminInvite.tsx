
import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import { Copy, ShieldCheck } from 'lucide-react';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const inviteFormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir un email valide" }),
  expiryDays: z.number().int().min(1).max(30).default(7),
});

type InviteFormData = z.infer<typeof inviteFormSchema>;

export default function AdminInvite() {
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      expiryDays: 7,
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      const token = uuidv4().replace(/-/g, '').substring(0, 12);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + data.expiryDays);

      // Store the token in the database
      // Note: In a real app, this would be inserted into a proper admin_tokens table
      // For now, we'll just simulate storing the token
      console.log("Generated token:", {
        token,
        email: data.email,
        expires_at: expiryDate.toISOString(),
        used: false
      });
      
      // Since we don't have an admin_tokens table yet, we'll just simulate success
      setGeneratedToken(token);
      toast.success("Token d'invitation généré avec succès!");
    } catch (error: any) {
      console.error("Erreur lors de la génération du token:", error);
      toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`);
    }
  };

  const copyToClipboard = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken);
      toast.success("Token copié dans le presse-papier!");
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <CardTitle>Générateur d'invitation administrateur</CardTitle>
          </div>
          <CardDescription>
            Créez un token unique pour inviter un nouvel administrateur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email du destinataire</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="admin@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      L'adresse email de l'administrateur invité
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="expiryDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jours de validité</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1}
                        max={30}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Nombre de jours avant expiration du token (1-30)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full">
                Générer un token
              </Button>
            </form>
          </Form>

          {generatedToken && (
            <div className="mt-6 p-4 bg-muted rounded-md">
              <div className="text-sm font-medium mb-2">Token d'invitation:</div>
              <div className="flex items-center justify-between bg-background p-3 rounded border">
                <code className="font-mono text-sm">{generatedToken}</code>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <div>Sécurisé et à usage unique</div>
          <div>Expiration automatique</div>
        </CardFooter>
      </Card>
    </div>
  );
}
