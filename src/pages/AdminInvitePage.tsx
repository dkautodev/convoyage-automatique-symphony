
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AdminInvitePage = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Invitations Administrateur</h1>
      <Card>
        <CardHeader>
          <CardTitle>Inviter un administrateur</CardTitle>
          <CardDescription>Remplissez le formulaire ci-dessous pour inviter un nouvel administrateur</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Le formulaire d'invitation sera disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInvitePage;
