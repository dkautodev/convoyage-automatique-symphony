import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { Paperclip } from 'lucide-react';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
interface MissionDocumentsSectionProps {
  mission: Mission;
  client?: any;
  adminProfile?: any;
  hideFinancials?: boolean;
}
export const MissionDocumentsSection: React.FC<MissionDocumentsSectionProps> = ({
  mission,
  client,
  adminProfile,
  hideFinancials = false
}) => {
  // Determine if user is a driver based on hideFinancials prop
  const isDriverView = hideFinancials;
  return;
};