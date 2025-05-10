
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="bg-red-100 p-3 rounded-full inline-flex items-center justify-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Une erreur est survenue</h1>
        <p className="text-gray-600 mb-8">
          La page que vous cherchez n'existe pas ou une erreur s'est produite.
        </p>
        <div className="space-x-4">
          <Button onClick={() => navigate(-1)} variant="outline">
            Retour
          </Button>
          <Button onClick={() => navigate('/')}>
            Accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
