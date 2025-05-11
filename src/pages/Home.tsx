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
import { Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
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
  const { login, user, profile, loading } = useAuth();
  
  console.log("Home - État de l'authentification:", { user, profile, loading });
  
  // Si l'utilisateur est déjà connecté et a un profil, rediriger vers son tableau de bord
  useEffect(() => {
    if (!loading && user) {
      console.log("Utilisateur authentifié détecté dans Home:", user);
      if (profile) {
        console.log("Profil détecté dans Home:", profile);
        if (profile.profile_completed) {
          console.log("Profil complet, redirection vers le tableau de bord:", profile.role);
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
              navigate('/client/dashboard'); // Default to client dashboard
          }
        } else {
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
      console.log("Tentative de connexion avec:", data.email);
      await login(data.email, data.password);
      // La redirection se fera dans l'effet useEffect ci-dessus
      toast.success("Connexion en cours...");
    } catch (err: any) {
      console.error("Erreur lors de la connexion:", err);
      setAuthError(err.message || "Erreur lors de la connexion. Veuillez vérifier vos identifiants.");
      toast.error("Échec de la connexion. Veuillez vérifier vos identifiants.");
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
          <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Connectez-vous à votre compte pour accéder à votre tableau de bord
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
      
      <div className="mt-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Inscrivez-vous</h2>
        <div className="flex flex-col gap-2">
          <Link to="/register" className="text-blue-600 hover:underline">
            Inscription standard (client/chauffeur)
          </Link>
          <Link to="/auth/register" className="text-blue-600 hover:underline">
            Inscription complète (client/chauffeur/admin)
          </Link>
          <Link to="/register-admin" className="text-blue-600 hover:underline">
            Inscription administrateur
          </Link>
        </div>
      </div>
    </div>
  );
}
