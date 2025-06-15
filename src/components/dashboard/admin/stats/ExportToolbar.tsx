
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
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
  return <Card className="bg-white">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-medium flex items-center gap-2 text-lg sm:text-base">
            <Download className="h-4 w-4" />
            Exporter
          </h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none" onClick={onExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>;
};
