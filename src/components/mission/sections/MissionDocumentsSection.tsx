
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { Paperclip } from 'lucide-react';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';

interface MissionDocumentsSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  hideFinancials?: boolean;
}

export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({
  mission,
  client,
  adminProfile,
  hideFinancials = false
}) => {
  // Determine if user is a driver based on hideFinancials prop
  const isDriverView = hideFinancials;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          Documents
        </CardTitle>
        <CardDescription>
          Vous pouvez consulter et télécharger les documents associés à cette mission depuis cette section.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col space-y-4">
        {/* Show Generate Quote button only for non-driver users */}
        {!isDriverView && (
          <GenerateQuoteButton 
            mission={mission} 
            client={client}
            adminProfile={adminProfile}
          />
        )}
      </CardContent>
    </Card>
  );
};
