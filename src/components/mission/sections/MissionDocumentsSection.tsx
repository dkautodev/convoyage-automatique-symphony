
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, FileCheck, Receipt } from 'lucide-react';
import { Mission } from '@/types/supabase';

interface MissionDocumentsSectionProps {
  mission: Mission;
}

export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({ mission }) => {
  // Placeholder functions for document generation
  const handleGenerateQuote = () => {
    alert('Génération de devis non implémentée');
  };
  
  const handleGenerateMissionSheet = () => {
    alert('Génération de fiche de mission non implémentée');
  };
  
  const handleGenerateInvoice = () => {
    alert('Génération de facture non implémentée');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileText className="h-10 w-10 text-blue-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Devis</h3>
            <p className="text-sm text-gray-500 mb-4">Générer un devis pour cette mission</p>
            <Button onClick={handleGenerateQuote} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <FileCheck className="h-10 w-10 text-green-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Fiche de mission</h3>
            <p className="text-sm text-gray-500 mb-4">Générer la fiche de mission</p>
            <Button onClick={handleGenerateMissionSheet} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
          
          <div className="p-4 border rounded-lg flex flex-col items-center text-center">
            <Receipt className="h-10 w-10 text-amber-600 mb-2" />
            <h3 className="text-lg font-medium mb-1">Facture</h3>
            <p className="text-sm text-gray-500 mb-4">Générer une facture</p>
            <Button onClick={handleGenerateInvoice} variant="outline" className="w-full">
              Générer
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 text-center mt-4">
          Cette fonctionnalité sera disponible prochainement.
        </p>
      </CardContent>
    </Card>
  );
};
