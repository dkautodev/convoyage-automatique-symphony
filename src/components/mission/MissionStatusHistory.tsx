
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { missionStatusColors, missionStatusLabels } from '@/types/supabase';

interface MissionStatusHistoryProps {
  statusHistory: any[];
}

export const MissionStatusHistory: React.FC<MissionStatusHistoryProps> = React.memo(({ statusHistory }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historique des statuts
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>Aucun historique disponible pour cette mission</p>
          </div>
        ) : (
          <div className="space-y-4">
            {statusHistory.map((entry, index) => (
              <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`${missionStatusColors[entry.new_status]} min-w-[120px] justify-center text-white`}>
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
      </CardContent>
    </Card>
  );
});
