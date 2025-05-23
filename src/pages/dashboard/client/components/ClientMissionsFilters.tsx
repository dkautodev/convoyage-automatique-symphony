
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { MissionStatus, missionStatusLabels } from '@/types/supabase';

type ClientMissionTab = 'all' | MissionStatus;

interface ClientMissionsFiltersProps {
  activeTab: ClientMissionTab;
  setActiveTab: (tab: ClientMissionTab) => void;
  missionCountsByStatus: Record<MissionStatus, number>;
  totalMissions: number;
}

const ClientMissionsFilters: React.FC<ClientMissionsFiltersProps> = ({
  activeTab,
  setActiveTab,
  missionCountsByStatus,
  totalMissions
}) => {
  const isMobile = useIsMobile();

  const statusTabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'en_acceptation', label: 'En cours d\'acceptation' },
    { id: 'accepte', label: 'Accepté' },
    { id: 'prise_en_charge', label: 'En cours de prise en charge' },
    { id: 'livraison', label: 'En cours de livraison' },
    { id: 'livre', label: 'Livré' },
    { id: 'termine', label: 'Terminé' },
    { id: 'annule', label: 'Annulé' },
    { id: 'incident', label: 'Incident' }
  ];

  const getCurrentFilterLabel = () => {
    const currentTab = statusTabs.find(tab => tab.id === activeTab);
    return currentTab ? currentTab.label : 'Toutes';
  };

  if (isMobile) {
    return (
      <div className="mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                {getCurrentFilterLabel()}
                <Badge variant="secondary">
                  {activeTab === 'all' ? totalMissions : (missionCountsByStatus[activeTab as MissionStatus] || 0)}
                </Badge>
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full bg-background border shadow-lg z-50">
            {statusTabs.map((tab) => (
              <DropdownMenuItem
                key={tab.id}
                onSelect={() => setActiveTab(tab.id as ClientMissionTab)}
                className="flex justify-between"
              >
                <span>{tab.label}</span>
                <Badge variant="secondary">
                  {tab.id === 'all' ? totalMissions : (missionCountsByStatus[tab.id as MissionStatus] || 0)}
                </Badge>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ClientMissionTab)}>
      <TabsList className="w-full mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap gap-1">
        {statusTabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id} 
            className="flex gap-2"
          >
            {tab.label}
            <Badge variant="secondary" className="ml-1">
              {tab.id === 'all' ? totalMissions : (missionCountsByStatus[tab.id as MissionStatus] || 0)}
            </Badge>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
};

export default ClientMissionsFilters;
