
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, ArrowLeft, User, UserCog, UserCog2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/supabase';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

const basicRegisterSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  role: z.enum(['client', 'chauffeur', 'admin']),
  adminToken: z.string().optional(),
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'Vous devez accepter les conditions d\'utilisation',
  }),
});

type FormData = z.infer<typeof basicRegisterSchema>;

export default function BasicRegister() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<UserRole>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { basicRegister } = useAuth();
  
  const form = useForm<FormData>({
    resolver: zodResolver(basicRegisterSchema),
    defaultValues: {
      email: '',
      password: '',
      role: 'client',
      adminToken: '',
      gdprConsent: false,
    },
  });
  
  // Mettre à jour le rôle lorsque l'onglet change
  React.useEffect(() => {
    form.setValue('role', selectedTab);
  }, [selectedTab, form]);
  
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await basicRegister({
        email: data.email,
        password: data.password,
        role: data.role,
        adminToken: data.adminToken
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-8">
          {/* Lien retour */}
          <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'accueil
          </Link>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Créer votre compte</CardTitle>
              <CardDescription>
                Renseignez vos informations de connexion pour commencer
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs value={selectedTab} onValueChange={(value: string) => setSelectedTab(value as UserRole)}>
                <TabsList className="grid grid-cols-3 mb-8">
                  <TabsTrigger value="client" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Client</span>
                  </TabsTrigger>
                  <TabsTrigger value="chauffeur" className="flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    <span>Chauffeur</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="flex items-center gap-2">
                    <UserCog2 className="h-4 w-4" />
                    <span>Admin</span>
                  </TabsTrigger>
                </TabsList>
                
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
                          <PasswordStrengthMeter password={field.value} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Admin Token (only shown for admin registration) */}
                    {selectedTab === 'admin' && (
                      <FormField
                        control={form.control}
                        name="adminToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Token d'invitation</FormLabel>
                            <FormControl>
                              <Input placeholder="Entrez le token d'invitation admin" {...field} />
                            </FormControl>
                            <FormDescription>
                              Un token est nécessaire pour s'inscrire en tant qu'admin
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* GDPR Consent */}
                    <FormField
                      control={form.control}
                      name="gdprConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Conditions d'utilisation</FormLabel>
                            <FormDescription>
                              En cochant cette case, vous acceptez nos{' '}
                              <Link to="/terms" className="text-primary hover:underline">
                                Conditions d'utilisation
                              </Link>{' '}
                              et{' '}
                              <Link to="/privacy" className="text-primary hover:underline">
                                Politique de confidentialité
                              </Link>.
                            </FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                          <span>Création du compte...</span>
                        </div>
                      ) : (
                        'Créer mon compte'
                      )}
                    </Button>
                  </form>
                </Form>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex flex-col items-center border-t pt-6">
              <p className="text-sm text-muted-foreground mb-2">
                Vous avez déjà un compte ?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Connectez-vous ici
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
