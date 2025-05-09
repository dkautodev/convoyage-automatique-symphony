
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto p-4">
        <div className="max-w-md mx-auto my-8">
          <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour à l'accueil
          </Link>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Inscription</CardTitle>
              <CardDescription>
                Créez votre compte pour accéder à notre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Le contenu du formulaire sera ajouté dans une future mise à jour */}
              <p className="text-center text-muted-foreground">
                Le formulaire d'inscription sera disponible prochainement.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
