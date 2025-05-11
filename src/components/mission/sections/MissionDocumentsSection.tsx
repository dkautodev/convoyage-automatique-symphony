
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
  const {
    profile
  } = useAuth();

  // Determine if user is admin or driver based on role
  const isAdmin = profile?.role === 'admin';
  const isDriver = profile?.role === 'chauffeur';
  const isClient = profile?.role === 'client';
  
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
        <CardDescription>
          Documents associés à cette mission
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Generate Quote Button - For clients and admins */}
        {(isClient || isAdmin) && (
          <div>
            <GenerateQuoteButton 
              mission={mission} 
              client={client}
              adminProfile={adminProfile}
            />
          </div>
        )}

        {/* Additional document functionalities can be added here */}
      </CardContent>
    </Card>
  );
};
