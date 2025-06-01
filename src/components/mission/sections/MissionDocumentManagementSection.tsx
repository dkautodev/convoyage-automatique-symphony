import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FolderOpen } from 'lucide-react';
import { Mission } from '@/types/supabase';
import { GenerateMissionSheetButton } from '@/components/mission/GenerateMissionSheetButton';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
interface MissionDocumentManagementSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  driverName?: string;
  documentsCount: number;
  isAdmin: boolean;
  isClient: boolean;
  isDriver: boolean;
  onDocumentsClick: () => void;
}
export const MissionDocumentManagementSection: React.FC<MissionDocumentManagementSectionProps> = ({
  mission,
  client,
  adminProfile,
  driverName,
  documentsCount,
  isAdmin,
  isClient,
  isDriver,
  onDocumentsClick
}) => {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5" />
          Gestion des documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Bouton Fiche de mission */}
          <GenerateMissionSheetButton mission={mission} driverName={driverName} />
          
          {/* Bouton Devis - Pour Admin et Client uniquement */}
          {(isAdmin || isClient) && <GenerateQuoteButton mission={mission} client={client} adminProfile={adminProfile} />}
          
          {/* Bouton Ajouter des documents - Pour tous les rôles */}
          <Button variant="outline" className="relative" onClick={onDocumentsClick}>
            + Ajouter des documents
            {documentsCount > 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#ea384c] text-[0.625rem] font-medium text-white">
                {documentsCount}
              </span>}
            {documentsCount === 0 && <span className="absolute -top-1 -right-1 flex h-5 w-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#8E9196] text-[0.625rem] font-medium text-white">
                0
              </span>}
          </Button>
        </div>
      </CardContent>
    </Card>;
};