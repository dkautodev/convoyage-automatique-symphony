
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Car as CarIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import RegisterForm from '@/components/register/RegisterForm';

interface RegisterProps {}

const Register: React.FC<RegisterProps> = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="container mx-auto p-4 bg-neutral-50">
        <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline text-gray-600 mt-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à l'accueil
        </Link>
        
        <div className="max-w-md mx-auto mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Créer votre compte</h1>
            <p className="text-muted-foreground">
              Choisissez votre type de compte et renseignez vos informations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="font-semibold text-blue-700 mb-2 flex items-center">
                <UserIcon className="mr-2 h-4 w-4" />
                Client
              </div>
              <p className="text-sm text-gray-600">
                Créez un compte client pour réserver des transports et gérer vos missions.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <div className="font-semibold text-green-700 mb-2 flex items-center">
                <CarIcon className="mr-2 h-4 w-4" />
                Chauffeur
              </div>
              <p className="text-sm text-gray-600">
                Créez un compte chauffeur pour proposer vos services et répondre aux demandes de transport.
              </p>
            </div>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
