
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet, Printer } from "lucide-react";

interface ExportToolbarProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  onExportPDF,
  onExportExcel,
  onPrint
}) => {
  return (
    <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export des données
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={onExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
