
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DriverDocuments from '@/components/dashboard/driver/DriverDocuments';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DriverDashboard = () => {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord chauffeur</h1>
      </div>

      <DriverDocuments />
    </div>
  );
};

export default DriverDashboard;
