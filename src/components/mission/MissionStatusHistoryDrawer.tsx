
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
import { missionStatusColors, missionStatusLabels } from '@/types/supabase';

interface MissionStatusHistoryDrawerProps {
  statusHistory: any[];
  missionCreatedAt?: string;
  adminProfile?: any;
  driverName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const MissionStatusHistoryDrawer: React.FC<MissionStatusHistoryDrawerProps> = React.memo(({ 
  statusHistory, 
  missionCreatedAt,
  adminProfile,
  driverName,
  isOpen,
  onClose 
}) => {
  // Combiner l'historique avec la date de création
  const allHistory = React.useMemo(() => {
    const history = [...statusHistory];
    
    // Ajouter un entry pour la création de la mission si on a la date
    if (missionCreatedAt) {
      history.push({
        id: 'creation',
        mission_id: null,
        old_status: null,
        new_status: 'created',
        changed_at: missionCreatedAt,
        changed_by: null,
        notes: 'Mission créée'
      });
    }
    
    // Trier par date décroissante
    return history.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }, [statusHistory, missionCreatedAt]);

  const formatUserName = (userId: string | null, notes?: string) => {
    if (!userId) {
      return 'Système';
    }
    
    // Si c'est une création de mission, afficher "Système"
    if (notes?.includes('Mission created') || notes?.includes('Mission créée')) {
      return 'Système';
    }
    
    // Si c'est l'admin
    if (userId === '480c267e-c3f8-45c7-aedc-1b5de2e3314d' || 
        (adminProfile && userId === adminProfile.id)) {
      return 'Admin DK AUTOMOTIVE';
    }
    
    // Si on a le nom du chauffeur et que c'est lui qui a fait le changement
    if (driverName && driverName !== 'Non assigné') {
      return driverName;
    }
    
    // Fallback
    return 'Utilisateur';
  };

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
            {allHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Aucun historique disponible pour cette mission</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allHistory.map((entry, index) => (
                  <div key={entry.id || index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.new_status === 'created' ? (
                        <Badge className="bg-blue-600 text-white min-w-[120px] justify-center">
                          Mission créée
                        </Badge>
                      ) : (
                        <Badge className={`${missionStatusColors[entry.new_status]} min-w-[120px] justify-center text-white`}>
                          {missionStatusLabels[entry.new_status]}
                        </Badge>
                      )}
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
                    {entry.old_status && entry.new_status !== 'created' && (
                      <div className="mt-2 text-sm text-gray-500">
                        Ancien statut: <span className="font-medium">{missionStatusLabels[entry.old_status]}</span>
                      </div>
                    )}
                    {entry.new_status !== 'created' && (
                      <div className="mt-1 text-sm text-gray-500">
                        Modifié par: {formatUserName(entry.changed_by, entry.notes)}
                      </div>
                    )}
                    {entry.notes && !entry.notes.includes('Status changed from') && !entry.notes.includes('Statut modifié de') && (
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
});
