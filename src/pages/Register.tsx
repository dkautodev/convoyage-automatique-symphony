
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RegisterForm from '@/components/register/RegisterForm';

interface RegisterProps {}

const Register: React.FC<RegisterProps> = () => {
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
              <CardTitle className="text-2xl">Créer votre compte</CardTitle>
              <CardDescription>
                Renseignez vos informations pour créer un nouveau compte
              </CardDescription>
            </CardHeader>
            <RegisterForm />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
