
import React from 'react';
import DriverInvoices from '@/components/dashboard/driver/DriverInvoices';
import DashboardLayout from '@/layouts/DashboardLayout';

const DriverInvoicesPage = () => {
  return (
    <DashboardLayout>
      <DriverInvoices isAdmin={true} />
    </DashboardLayout>
  );
};

export default DriverInvoicesPage;
