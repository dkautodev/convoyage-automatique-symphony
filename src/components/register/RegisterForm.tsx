import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Car } from 'lucide-react';

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
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { RegisterFormData } from '@/types/auth';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter';

// Define a local schema for the register form that has all required fields
const registerSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string(),
  fullName: z.string().min(2, { message: 'Le nom complet est requis' }),
  role: z.enum(['client', 'chauffeur'], { 
    required_error: "Veuillez sélectionner un type de compte" 
  }),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Vous devez accepter les termes et conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Define our form data type based on the schema
type FormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'chauffeur'>('client');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      role: 'client',
      terms: false,
    },
  });

  // Update the role when the tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as 'client' | 'chauffeur');
    form.setValue('role', value as 'client' | 'chauffeur');
  };

  const onSubmit = async (data: FormValues) => {
    setAuthError(null);
    try {
      // Ensure all required fields are included with proper types
      const registerData: RegisterFormData = {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
      };
      
      console.log("Starting registration process with data:", registerData);
      await register(registerData);
      toast.success(`Compte ${data.role === 'client' ? 'client' : 'chauffeur'} créé avec succès ! Veuillez vous connecter pour accéder à votre compte.`);
      navigate('/login');
    } catch (err: any) {
      console.error("Erreur lors de l'inscription:", err);
      let errorMessage = err.message || "Erreur lors de l'inscription. Veuillez réessayer.";
      
      // Vérification de messages d'erreur spécifiques pour des messages plus adaptés
      if (errorMessage.includes("Database error")) {
        errorMessage = "Erreur lors de la création du compte. Veuillez réessayer dans quelques instants.";
      } else if (errorMessage.includes("User already registered")) {
        errorMessage = "Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.";
      }
      
      setAuthError(errorMessage);
      toast.error(errorMessage);
    }
  };
  
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-14 rounded-lg">
          <TabsTrigger 
            value="client" 
            className={`flex items-center justify-center gap-2 py-3 text-base transition-all duration-200 ${activeTab === 'client' ? 'bg-white font-semibold shadow-md text-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <User className={`h-5 w-5 ${activeTab === 'client' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span>Client</span>
          </TabsTrigger>
          <TabsTrigger 
            value="chauffeur" 
            className={`flex items-center justify-center gap-2 py-3 text-base transition-all duration-200 ${activeTab === 'chauffeur' ? 'bg-white font-semibold shadow-md text-blue-600' : 'bg-gray-50 hover:bg-gray-100'}`}
          >
            <Car className={`h-5 w-5 ${activeTab === 'chauffeur' ? 'text-blue-600' : 'text-gray-500'}`} />
            <span>Chauffeur</span>
          </TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {authError && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">Nom complet</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="John Doe" 
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm py-2.5"
                    />
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
                  <FormLabel className="text-base font-medium">Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="votre@email.com" 
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm py-2.5"
                    />
                  </FormControl>
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
                        className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm pr-10 py-2.5"
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        onClick={togglePasswordVisibility}
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
                        className="border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 rounded-md shadow-sm pr-10 py-2.5"
                      />
                      <button 
                        type="button"
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
                        onClick={toggleConfirmPasswordVisibility}
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

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="bg-gray-50 rounded-md border p-4">
                  <div className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                    </FormControl>
                    <div className="space-y-1">
                      <FormLabel className="text-base font-semibold">
                        J'accepte les termes et conditions
                      </FormLabel>
                      <FormDescription>
                        Veuillez lire attentivement nos termes et conditions avant de vous inscrire.
                      </FormDescription>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className={`w-full font-medium py-3 rounded-md transition-colors ${
                activeTab === 'client' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              disabled={form.formState.isSubmitting || loading}
            >
              {form.formState.isSubmitting || loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                  <span>Création du compte...</span>
                </div>
              ) : (
                `Créer un compte ${activeTab === 'client' ? 'client' : 'chauffeur'}`
              )}
            </Button>
          </form>
        </Form>
      </Tabs>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link to="/home" className="text-blue-600 hover:text-blue-800 font-medium hover:underline">
            Connectez-vous ici
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
