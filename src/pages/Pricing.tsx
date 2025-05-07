
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Tarifs</h1>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Forfait Standard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">À partir de 79€</p>
              <p className="text-gray-500 mt-2">Pour les courtes distances</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">✓ Convoyage de véhicules</li>
                <li className="flex items-center">✓ Chauffeur professionnel</li>
                <li className="flex items-center">✓ Assurance incluse</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-primary">Forfait Premium</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">À partir de 105€</p>
              <p className="text-gray-500 mt-2">Pour les moyennes distances</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">✓ Tous les avantages du Standard</li>
                <li className="flex items-center">✓ Service prioritaire</li>
                <li className="flex items-center">✓ Support client dédié</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Forfait Entreprise</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Sur devis</p>
              <p className="text-gray-500 mt-2">Pour les grandes flottes</p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-center">✓ Tous les avantages du Premium</li>
                <li className="flex items-center">✓ Tarifs dégressifs</li>
                <li className="flex items-center">✓ Facturation mensuelle</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
