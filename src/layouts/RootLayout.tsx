
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const RootLayout = () => {
  const location = useLocation();
  const isAuthPath = location.pathname.includes('/login') || 
                     location.pathname.includes('/register') ||
                     location.pathname.includes('/admin') ||
                     location.pathname.includes('/client') ||
                     location.pathname.includes('/driver');

  return (
    <div className="min-h-screen">
      {/* Header would go here for non-auth pages */}
      <main className="min-h-screen">
        <Outlet />
      </main>
    </div>
  );
};

export default RootLayout;
