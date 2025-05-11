
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { Paperclip, FileText } from 'lucide-react';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth';

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
  const { profile } = useAuth();
  
  // Determine if user is a driver based on role
  const isDriverView = profile?.role === 'chauffeur' || hideFinancials;
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents de la mission
        </CardTitle>
        <CardDescription>
          Générez et téléchargez les documents associés à cette mission
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Only show GenerateQuoteButton for admins and clients (not drivers) */}
          {!isDriverView && (
            <GenerateQuoteButton 
              mission={mission} 
              client={client}
              adminProfile={adminProfile}
            />
          )}
          
          {/* Add other document buttons here if needed */}
        </div>
      </CardContent>
    </Card>
  );
};
