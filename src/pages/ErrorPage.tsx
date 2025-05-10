
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-4">Page non trouvée</h2>
        <p className="text-lg text-gray-600 mb-6">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition"
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default ErrorPage;
