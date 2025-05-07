
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
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
              <CardTitle className="text-2xl">Connexion</CardTitle>
              <CardDescription>
                Connectez-vous à votre compte pour accéder à votre tableau de bord
              </CardDescription>
            </CardHeader>
            {/* Le contenu du formulaire est déjà dans la page Home.tsx */}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
