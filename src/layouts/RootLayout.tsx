
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/auth';
import { AlertProvider } from '@/components/providers/AlertProvider';

const RootLayout = () => {
  return (
    <AuthProvider>
      <AlertProvider>
        <Outlet />
        <Toaster position="top-center" richColors closeButton duration={5000} />
      </AlertProvider>
    </AuthProvider>
  );
};

export default RootLayout;
