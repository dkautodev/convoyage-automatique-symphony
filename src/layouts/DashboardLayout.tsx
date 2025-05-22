
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar, { SidebarProvider, SidebarOverlay, SidebarTrigger } from '@/components/dashboard/Sidebar';
import { useAuth } from '@/hooks/useAuth';

const DashboardLayout: React.FC = () => {
  const { user, profile } = useAuth();
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <SidebarProvider>
        <div className="flex flex-1 w-full">
          <Sidebar />
          <SidebarOverlay />
          
          <main className="flex-1 px-4 py-6 max-w-[1400px] mx-auto w-full transition-all duration-300">
            <SidebarTrigger />
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default DashboardLayout;
