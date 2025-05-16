
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DriverDashboard from '@/components/dashboard/driver/DriverDashboard';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DriverDashboardPage = () => {
  const { user, profile } = useAuth();

  return (
    <div className="space-y-6">
      <DriverDashboard />
    </div>
  );
};

export default DriverDashboardPage;
