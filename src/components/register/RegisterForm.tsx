
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
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Define a local schema for the register form that doesn't require the 'role' field
const registerSchema = z.object({
  email: z.string().email({ message: 'Veuillez saisir une adresse email valide' }),
  password: z.string().min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' }),
  confirmPassword: z.string(),
  fullName: z.string().min(2, { message: 'Le nom complet est requis' }),
  terms: z.boolean().refine((value) => value === true, {
    message: 'Vous devez accepter les termes et conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"], // path of error
});

// Define our form data type based on the schema
type FormValues = z.infer<typeof registerSchema>;

const RegisterForm = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      terms: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setAuthError(null);
    try {
      // Add 'client' as the default role when registering
      await register({
        ...data,
        role: 'client', // Add the required role field
      });
      // Redirection après l'inscription réussie est gérée dans AuthProvider
    } catch (err: any) {
      console.error("Erreur lors de l'inscription:", err);
      setAuthError(err.message || "Erreur lors de l'inscription. Veuillez réessayer.");
      toast.error("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {authError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{authError}</AlertDescription>
          </Alert>
        )}
        
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="votre@email.com" {...field} />
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
              <FormLabel>Mot de passe</FormLabel>
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
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-0.5">
                <FormLabel className="text-base font-semibold">
                  J'accepte les termes et conditions
                </FormLabel>
                <FormDescription>
                  Veuillez lire attentivement nos termes et conditions avant de vous inscrire.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting || loading}
        >
          {form.formState.isSubmitting || loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
              <span>Création du compte...</span>
            </div>
          ) : (
            'Créer un compte'
          )}
        </Button>
      </form>
      
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">
          Vous avez déjà un compte ?{' '}
          <Link to="/home" className="text-blue-500 hover:underline">
            Connectez-vous ici
          </Link>
        </p>
      </div>
    </Form>
  );
};

export default RegisterForm;
