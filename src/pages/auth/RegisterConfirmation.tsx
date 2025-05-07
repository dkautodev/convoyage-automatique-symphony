
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';

export default function RegisterConfirmation() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center">
      <div className="w-full max-w-md p-4">
        <Card className="border-2 border-primary/10">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
            <CardDescription>
              Nous avons envoyé un email de confirmation à votre adresse email.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            <p className="mb-4">
              Veuillez cliquer sur le lien contenu dans l'email pour confirmer votre adresse et activer votre compte.
            </p>
            <p className="text-sm text-muted-foreground">
              Si vous ne recevez pas l'email dans les prochaines minutes, vérifiez votre dossier de spam ou courrier indésirable.
            </p>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/login">
                Se connecter
              </Link>
            </Button>
            
            <Link to="/" className="text-sm text-center text-muted-foreground hover:underline">
              Retour à l'accueil
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
