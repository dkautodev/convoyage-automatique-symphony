
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

// Schéma de validation pour le formulaire de réinitialisation de mot de passe
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
    .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
    .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Veuillez confirmer votre mot de passe' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenAvailable, setTokenAvailable] = useState(false);

  // Formulaire avec validation
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Vérifier que nous avons une session valide (le token est automatiquement utilisé par Supabase)
  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      console.log("Session check result:", data);
      
      if (error) {
        console.error("Erreur lors de la vérification de la session:", error);
        setError("Le lien de réinitialisation de mot de passe est invalide ou a expiré.");
        return;
      }
      
      if (data.session) {
        console.log("Session trouvée, prêt pour la réinitialisation");
        setTokenAvailable(true);
      } else {
        console.error("Aucune session trouvée");
        setError("Le lien de réinitialisation de mot de passe est invalide ou a expiré.");
      }
    };

    checkSession();
  }, []);

  // Gérer la soumission du formulaire
  const onSubmit = async (data: ResetPasswordFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Mise à jour du mot de passe via Supabase
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: data.password 
      });

      if (updateError) {
        throw updateError;
      }

      // Réinitialisation réussie
      setSuccess(true);
      toast.success('Votre mot de passe a été réinitialisé avec succès.');
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error("Erreur lors de la réinitialisation du mot de passe:", err);
      setError(err.message || "Une erreur s'est produite lors de la réinitialisation du mot de passe.");
      toast.error("Erreur de réinitialisation du mot de passe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Réinitialisation du mot de passe</CardTitle>
              <CardDescription>
                Choisissez un nouveau mot de passe pour votre compte
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success ? (
                <div className="text-center py-4">
                  <div className="mb-4 text-green-500 flex justify-center">
                    <CheckCircle className="h-12 w-12" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Mot de passe réinitialisé!</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Votre mot de passe a été changé avec succès. Vous allez être redirigé vers la page de connexion.
                  </p>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nouveau mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <PasswordStrengthMeter password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !tokenAvailable}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Réinitialisation en cours...</span>
                        </div>
                      ) : (
                        'Réinitialiser le mot de passe'
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  <span className="flex items-center">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Retour à la page de connexion
                  </span>
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
