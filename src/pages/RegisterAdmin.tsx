
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';
import { verifyAdminToken, markAdminTokenAsUsed } from '@/hooks/auth/utils';

// Schéma de validation pour l'inscription admin
const adminSchema = z.object({
  email: z.string().email({ message: "Veuillez saisir une adresse email valide" }),
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères" }),
  confirmPassword: z.string(),
  adminToken: z.string().min(6, { message: "Un token d'invitation valide est requis" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type AdminFormValues = z.infer<typeof adminSchema>;

export default function RegisterAdmin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminFormValues>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      adminToken: '',
    },
  });

  const onSubmit = async (data: AdminFormValues) => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier si le token d'invitation est valide et correspond à l'email
      console.log("Vérification du token:", data.adminToken, "pour l'email:", data.email);
      
      const isTokenValid = await verifyAdminToken(data.adminToken, data.email);
      
      if (!isTokenValid) {
        throw new Error("Token d'invitation invalide, expiré ou ne correspond pas à l'email fourni");
      }
      
      console.log("Token validé avec succès");
      
      // Créer l'utilisateur avec le rôle admin
      const { data: userData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: 'admin',
            fullName: 'Administrateur', // Valeur par défaut
          },
        },
      });
      
      if (signupError) {
        throw signupError;
      }
      
      if (!userData.user) {
        throw new Error("Erreur lors de la création du compte");
      }
      
      // Marquer le token comme utilisé
      const tokenUpdated = await markAdminTokenAsUsed(data.adminToken, data.email);
      
      if (!tokenUpdated) {
        console.warn("Le token n'a pas pu être marqué comme utilisé, mais le compte a été créé");
      }
      
      toast.success("Compte administrateur créé avec succès ! Veuillez vous connecter.");
      navigate('/home');
    } catch (err: any) {
      console.error("Erreur lors de l'inscription admin:", err);
      setError(err.message || "Une erreur est survenue");
      toast.error("Échec de la création du compte: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="container mx-auto p-4 bg-neutral-50">
        <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline text-gray-600 mt-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à l'accueil
        </Link>
        
        <div className="max-w-md mx-auto mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Créer un compte administrateur</h1>
            <p className="text-muted-foreground">
              Utilisez votre token d'invitation pour créer un compte administrateur
            </p>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="admin@example.com" 
                            {...field}
                            className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Doit correspondre à l'email utilisé pour l'invitation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="adminToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Token d'invitation</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Entrez votre token d'invitation" 
                            {...field}
                            className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm"
                          />
                        </FormControl>
                        <FormDescription>
                          Un token est requis pour créer un compte administrateur
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field}
                              className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm pr-10"
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>
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
                        <FormLabel className="text-base font-medium">Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field}
                              className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm pr-10"
                            />
                            <button 
                              type="button"
                              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4" aria-hidden="true" />
                              ) : (
                                <Eye className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md transition-colors"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        <span>Création du compte...</span>
                      </div>
                    ) : (
                      'Créer le compte administrateur'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="text-center py-4 border-t">
              <p className="text-sm text-muted-foreground">
                <Link to="/home" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
                  Revenir à la connexion
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
