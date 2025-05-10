
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import { typedSupabase } from '@/types/database';
import { toast } from 'sonner';
import { Loader2, Save, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

// Schéma de validation pour le formulaire de changement de mot de passe
const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'Le mot de passe actuel est requis' }),
  newPassword: z
    .string()
    .min(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
    .regex(/[A-Z]/, { message: 'Le mot de passe doit contenir au moins une majuscule' })
    .regex(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre' }),
  confirmPassword: z
    .string()
    .min(1, { message: 'Veuillez confirmer votre mot de passe' }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Vérifier d'abord l'ancien mot de passe en tentant de se connecter
      const { error: signInError } = await typedSupabase.auth.signInWithPassword({
        email: user.email || '',
        password: data.currentPassword,
      });
      
      if (signInError) {
        toast.error('Le mot de passe actuel est incorrect');
        form.setError('currentPassword', {
          type: 'manual',
          message: 'Mot de passe incorrect',
        });
        setIsLoading(false);
        return;
      }
      
      // Si l'ancien mot de passe est correct, mettre à jour le mot de passe
      const { error: updateError } = await typedSupabase.auth.updateUser({
        password: data.newPassword,
      });
      
      if (updateError) {
        toast.error(`Erreur lors de la mise à jour du mot de passe: ${updateError.message}`);
      } else {
        toast.success('Mot de passe mis à jour avec succès');
        form.reset();
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      toast.error(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sécurité du compte</CardTitle>
            <CardDescription>
              Mettez à jour votre mot de passe et les paramètres de sécurité de votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Separator />
                  
                  <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" /> 
                        Mettre à jour le mot de passe
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Section pour les préférences de notification (pour une future extension) */}
        <Card>
          <CardHeader>
            <CardTitle>Préférences de notification</CardTitle>
            <CardDescription>
              Contrôlez quand et comment vous recevez des notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
            <div className="text-center">
              <p>Les préférences de notification seront disponibles prochainement</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
