
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Mail, AlertCircle, Copy, Check } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth';

// Schéma de validation pour le formulaire de création de token
const inviteFormSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse email valide" }),
  expirationDays: z.coerce.number().int().min(1, { message: "Minimum 1 jour" }).max(30, { message: "Maximum 30 jours" }),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

type Token = {
  id: number;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  used: boolean;
  used_at: string | null;
};

const generateRandomToken = () => {
  // Generate a shorter UUID-based token (first 10 chars of UUID)
  return uuidv4().substring(0, 10);
};

export default function AdminInvite() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  console.log("Chargement de la page d'invitation admin", { user, profile });

  // Vérifier si l'utilisateur est connecté et est un administrateur
  useEffect(() => {
    if (!user) {
      console.log("Pas d'utilisateur connecté, redirection vers login");
      toast.error("Vous devez être connecté pour accéder à cette page");
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'admin') {
      console.log("L'utilisateur n'est pas admin, redirection vers accueil");
      toast.error("Seuls les administrateurs peuvent accéder à cette page");
      navigate('/');
      return;
    }
    
    // Charger les tokens existants
    fetchTokens();
  }, [user, profile, navigate]);

  const fetchTokens = async () => {
    try {
      setLoadingTokens(true);
      const { data, error } = await supabase
        .from('admin_invitation_tokens')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Tokens récupérés:", data);
      setTokens(data || []);
    } catch (err: any) {
      console.error("Erreur lors du chargement des tokens:", err);
      toast.error("Erreur lors du chargement des tokens d'invitation");
    } finally {
      setLoadingTokens(false);
    }
  };

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
      expirationDays: 7,
    },
  });

  const onSubmit = async (data: InviteFormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour créer un token");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Générer un token aléatoire court et lisible
      const token = generateRandomToken();
      
      // Calculer la date d'expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + data.expirationDays);
      
      // S'assurer que l'email est en minuscule et sans espaces
      const normalizedEmail = data.email.toLowerCase().trim();
      
      console.log("Création d'un nouveau token:", {
        email: normalizedEmail,
        token,
        expirationDays: data.expirationDays,
        expires_at: expiresAt.toISOString(),
        created_by: user.id
      });
      
      // Vérifier si un token actif existe déjà pour cet email
      const { data: existingToken } = await supabase
        .from('admin_invitation_tokens')
        .select('*')
        .eq('email', normalizedEmail)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      
      if (existingToken) {
        console.warn("Un token actif existe déjà pour cet email:", existingToken);
        
        const confirmOverwrite = window.confirm(
          `Un token actif existe déjà pour ${normalizedEmail}. Voulez-vous créer un nouveau token qui remplacera l'ancien ?`
        );
        
        if (!confirmOverwrite) {
          toast.info("Création du nouveau token annulée");
          setLoading(false);
          return;
        }
        
        // Marquer l'ancien token comme utilisé (obsolète)
        const { error: updateError } = await supabase
          .from('admin_invitation_tokens')
          .update({ 
            used: true,
            used_at: new Date().toISOString()
          })
          .eq('id', existingToken.id);
        
        if (updateError) {
          console.error("Erreur lors de l'invalidation de l'ancien token:", updateError);
          toast.warning("L'ancien token n'a pas pu être marqué comme obsolète");
        }
      }
      
      // Insérer le nouveau token dans la base de données
      const { error: insertError } = await supabase
        .from('admin_invitation_tokens')
        .insert({
          email: normalizedEmail,
          token: token,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        });
      
      if (insertError) throw insertError;
      
      toast.success(`Token d'invitation créé pour ${normalizedEmail}`);
      form.reset();
      
      // Recharger la liste des tokens
      fetchTokens();
    } catch (err: any) {
      console.error("Erreur lors de la création du token:", err);
      setError(err.message || "Une erreur est survenue lors de la création du token");
      toast.error("Échec de la création du token");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = async (token: string, id: number) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(id);
      toast.success("Token copié dans le presse-papiers");
      
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    } catch (err) {
      toast.error("Impossible de copier le token");
    }
  };

  const handleCreateInvitationLink = async (token: string, email: string, id: number) => {
    try {
      const baseURL = window.location.origin;
      const invitationLink = `${baseURL}/register-admin?token=${token}&email=${encodeURIComponent(email)}`;
      
      await navigator.clipboard.writeText(invitationLink);
      setCopied(id);
      toast.success("Lien d'invitation complet copié dans le presse-papiers");
      
      setTimeout(() => {
        setCopied(null);
      }, 2000);
    } catch (err) {
      toast.error("Impossible de copier le lien d'invitation");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gestion des invitations administrateur</h1>
      
      <div className="grid gap-6 md:grid-cols-12">
        {/* Formulaire de création de token */}
        <div className="md:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Créer un nouveau token d'invitation</CardTitle>
              <CardDescription>
                Permettez à un nouvel administrateur de s'inscrire avec un token d'invitation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email de l'administrateur</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                              {...field} 
                              placeholder="admin@example.com" 
                              className="pl-10"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          L'email doit correspondre exactement à celui utilisé lors de l'inscription
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="expirationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Durée de validité (jours)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez une durée" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 jour</SelectItem>
                            <SelectItem value="3">3 jours</SelectItem>
                            <SelectItem value="7">7 jours</SelectItem>
                            <SelectItem value="14">14 jours</SelectItem>
                            <SelectItem value="30">30 jours</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Après cette période, le token ne sera plus valide
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full mt-2" 
                    disabled={loading}
                  >
                    {loading ? "Création en cours..." : "Créer le token d'invitation"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        {/* Liste des tokens */}
        <div className="md:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Historique des tokens d'invitation</CardTitle>
              <CardDescription>
                Liste des tokens d'invitation avec leur statut (email, token, utilisé ou non, date de validité)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTokens ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : tokens.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun token d'invitation trouvé dans l'historique
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Email</TableHead>
                        <TableHead className="font-bold">Token</TableHead>
                        <TableHead className="font-bold">Expire le</TableHead>
                        <TableHead className="font-bold">Statut</TableHead>
                        <TableHead className="font-bold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tokens.map((token) => {
                        const isExpired = new Date(token.expires_at) < new Date();
                        const tokenStatus = 
                          token.used ? "Utilisé" :
                          isExpired ? "Expiré" : 
                          "Actif";
                        
                        return (
                          <TableRow key={token.id}>
                            <TableCell className="font-medium">{token.email}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <code className="bg-muted px-1 py-0.5 rounded text-sm">{token.token}</code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyToken(token.token, token.id)}
                                  disabled={token.used || isExpired}
                                  title="Copier le token"
                                >
                                  {copied === token.id ? (
                                    <Check className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(token.expires_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                token.used 
                                  ? "bg-blue-100 text-blue-800" 
                                  : isExpired 
                                  ? "bg-red-100 text-red-800" 
                                  : "bg-green-100 text-green-800"
                              }`}>
                                {tokenStatus}
                              </span>
                            </TableCell>
                            <TableCell>
                              {!token.used && !isExpired && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateInvitationLink(token.token, token.email, token.id)}
                                  title="Copier le lien d'invitation complet"
                                >
                                  Copier le lien
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
