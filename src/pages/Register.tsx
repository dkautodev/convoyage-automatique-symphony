import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import RegisterForm from '@/components/register/RegisterForm';
interface RegisterProps {}
const Register: React.FC<RegisterProps> = () => {
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="container mx-auto p-4 bg-neutral-50">
        <Link to="/" className="inline-flex items-center text-sm mb-6 hover:underline text-gray-600 mt-6">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Retour à l'accueil
        </Link>
        
        <div className="max-w-md mx-auto mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Créer votre compte</h1>
            <p className="text-muted-foreground">
              Renseignez vos informations pour créer un nouveau compte
            </p>
          </div>
          
          <Card className="border-none shadow-lg">
            <CardContent className="p-0">
              <RegisterForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default Register;