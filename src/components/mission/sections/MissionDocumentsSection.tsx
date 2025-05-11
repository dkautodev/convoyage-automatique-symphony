import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Mission } from '@/types/supabase';
import { Paperclip, FileText } from 'lucide-react';
import GenerateQuoteButton from '@/components/mission/GenerateQuoteButton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth';
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
  const {
    profile
  } = useAuth();

  // Determine if user is a driver based on role
  const isDriverView = profile?.role === 'chauffeur';
  return;
};