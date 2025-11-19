import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText } from 'lucide-react';

interface MissionInspectionSectionProps {
  isAdmin: boolean;
  isDriver: boolean;
}

export const MissionInspectionSection: React.FC<MissionInspectionSectionProps> = ({ 
  isAdmin, 
  isDriver 
}) => {
  // Only show for admin and driver
  if (!isAdmin && !isDriver) {
    return null;
  }

  const handleUpload = (documentType: string) => {
    // TODO: Implement upload functionality later
    console.log(`Upload ${documentType}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          États des lieux et PV complétés
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleUpload('fiche-etat-lieux')}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm">Fiche d'état des lieux</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleUpload('pv-complete')}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm">PV complété</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-20 flex flex-col items-center justify-center gap-2"
            onClick={() => handleUpload('etat-lieux')}
          >
            <Upload className="h-5 w-5" />
            <span className="text-sm">État des lieux</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
