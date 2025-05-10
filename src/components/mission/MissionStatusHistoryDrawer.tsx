
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Clock, X } from 'lucide-react';
import { missionStatusColors, missionStatusLabels } from '@/utils/missionUtils';

interface MissionStatusHistoryDrawerProps {
  statusHistory: any[];
  isOpen: boolean;
  onClose: () => void;
}

export const MissionStatusHistoryDrawer: React.FC<MissionStatusHistoryDrawerProps> = ({ 
  statusHistory, 
  isOpen,
  onClose 
}) => {
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="min-h-[65vh] max-h-[80vh]">
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Historique des statuts
          </DrawerTitle>
          <DrawerDescription>
            Suivi chronologique des changements de statut de la mission
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          <ScrollArea className="h-[50vh] rounded-md border p-4">
            {statusHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Aucun historique disponible pour cette mission</p>
              </div>
            ) : (
              <div className="space-y-4">
                {statusHistory.map((entry, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge className={`${missionStatusColors[entry.new_status]} w-24 justify-center`}>
                        {missionStatusLabels[entry.new_status]}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(entry.changed_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {entry.old_status && (
                      <div className="mt-2 text-sm text-gray-500">
                        Ancien statut: <span className="font-medium">{missionStatusLabels[entry.old_status]}</span>
                      </div>
                    )}
                    {entry.changed_by && (
                      <div className="mt-1 text-sm text-gray-500">
                        Modifié par: {entry.changed_by || "Utilisateur inconnu"}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                        {entry.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        <DrawerFooter>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
