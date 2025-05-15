import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/auth';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
const resetPasswordSchema = z.object({
  email: z.string().email({
    message: 'Veuillez saisir une adresse email valide'
  })
});
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    resetPassword
  } = useAuth();
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: ''
    }
  });
  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await resetPassword(data.email);
      setResetSent(true);
    } catch (err: any) {
      console.error('Erreur lors de la demande de réinitialisation:', err);
      setError(err.message || 'Une erreur s\'est produite lors de la demande de réinitialisation');
    } finally {
      setIsSubmitting(false);
    }
  };
  return <div className="min-h-screen bg-muted/30 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-8">
          
          
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Mot de passe oublié</CardTitle>
              <CardDescription>
                Entrez votre adresse email pour recevoir un lien de réinitialisation
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {error && <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>}
              
              {resetSent ? <div className="text-center py-4">
                  <div className="mb-4 text-green-500 flex justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Email envoyé!</h3>
                  <p className="mt-2 text-sm text-gray-500">Un lien de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception et suivre les instructions. Pensez à vérifier dans votre boîte spam.</p>
                </div> : <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="email" render={({
                  field
                }) => <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="votre@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>} />
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-t-2 border-r-2 border-white rounded-full animate-spin"></div>
                          <span>Envoi en cours...</span>
                        </div> : 'Réinitialiser le mot de passe'}
                    </Button>
                  </form>
                </Form>}
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                <Link to="/login" className="text-primary hover:underline">
                  Retour à la page de connexion
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>;
}