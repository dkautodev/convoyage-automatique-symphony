
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/auth';

interface MissionDocumentsSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  hideFinancials?: boolean;
}

// This component has been deprecated and will be removed in a future update.
// Documents functionality has been moved to MissionAttachments component.
export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = () => {
  return null;
};
