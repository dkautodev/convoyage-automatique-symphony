
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const CompleteClientProfile: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Complétez votre profil</CardTitle>
          <CardDescription>Veuillez remplir les informations de votre profil client</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Le formulaire de complétion de profil client sera disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteClientProfile;
