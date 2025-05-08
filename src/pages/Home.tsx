
import React, { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

const loginSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
  password: z.string().min(1, { message: 'Le mot de passe est requis' }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Home() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { login, user, profile, loading, error } = useAuth();
  
  console.log("Home - État de l'authentification:", { user, profile, loading, error });
  
  // Si l'utilisateur est déjà connecté et a un profil, rediriger vers son tableau de bord
  useEffect(() => {
    if (!loading && user) {
      if (profile && profile.profile_completed) {
        console.log("Redirection depuis Home vers le tableau de bord:", profile.role);
        switch (profile.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'client':
            navigate('/client/dashboard');
            break;
          case 'chauffeur':
            navigate('/driver/dashboard');
            break;
          default:
            navigate('/home');
        }
      } else if (profile) {
        // Si l'utilisateur a un profil mais qu'il n'est pas complété
        console.log("Profil non complété, redirection vers la page de complétion");
        switch (profile.role) {
          case 'client':
            navigate('/complete-client-profile');
            break;
          case 'chauffeur':
            navigate('/complete-driver-profile');
            break;
          default:
            navigate('/home');
        }
      }
      // Si user existe mais pas profile, on reste sur la page Home pour attendre le chargement du profil
    }
  }, [user, profile, navigate, loading]);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });
  
  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      await login(data.email, data.password);
      // La redirection se fera dans l'effet useEffect ci-dessus
    } catch (err: any) {
      console.error("Erreur lors de la connexion:", err);
      setAuthError(err.message || "Erreur lors de la connexion. Veuillez vérifier vos identifiants.");
      toast.error("Erreur lors de la connexion. Veuillez vérifier vos identifiants.");
    }
  };

  // Montrer un spinner de chargement pendant que l'authentification est en cours
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-t-4 border-b-4 border-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">
            {user ? "Chargement de votre profil..." : "Initialisation..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Connexion à votre compte</CardTitle>
              <CardDescription>
                Entrez vos identifiants pour accéder à votre tableau de bord
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {authError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Email field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="votre@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Password field */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="••••••••" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center justify-between">
                    {/* Remember me */}
                    <FormField
                      control={form.control}
                      name="rememberMe"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer">
                            Se souvenir de moi
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    
                    {/* Forgot password */}
                    <Link 
                      to="/forgot-password" 
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                        <span>Connexion en cours...</span>
                      </div>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Vous n'avez pas encore de compte ?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Inscrivez-vous ici
                </Link>
              </p>
              
              <div className="mt-4 text-xs text-muted-foreground">
                <Link to="/register-admin" className="hover:underline">
                  Vous êtes administrateur ?
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
