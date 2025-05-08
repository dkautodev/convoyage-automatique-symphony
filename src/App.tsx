
import React, { useState, useEffect } from 'react';
import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Import layouts
import RootLayout from './layouts/RootLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Import pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Pricing from '@/pages/Pricing';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';

// Dashboard pages
import Clients from '@/pages/dashboard/admin/Clients';
import Drivers from '@/pages/dashboard/admin/Drivers';
import Missions from '@/pages/dashboard/admin/Missions';
import PricingGridPage from '@/pages/dashboard/admin/PricingGrid';

// Auth Context Provider
import { AuthProvider } from '@/hooks/useAuth';
import { AlertProvider } from '@/components/providers/AlertProvider';

const queryClient = new QueryClient();

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  // Create the router once and outside any components to avoid nesting
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<RootLayout />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="contact" element={<Contact />} />
        <Route path="about" element={<About />} />
        
        {/* Dashboard routes - Protected by DashboardLayout */}
        <Route path="admin/*" element={<DashboardLayout />}>
          <Route path="dashboard" element={null} /> {/* Handled by DashboardLayout directly */}
          <Route path="clients" element={<Clients />} />
          <Route path="drivers" element={<Drivers />} />
          <Route path="missions" element={<Missions />} />
          <Route path="pricing-grid" element={<PricingGridPage />} />
          <Route path="users" element={<div>Page des utilisateurs</div>} />
        </Route>

        <Route path="client/*" element={<DashboardLayout />}>
          <Route path="dashboard" element={null} /> {/* Handled by DashboardLayout directly */}
          <Route path="missions" element={<div>Client Missions</div>} />
        </Route>

        <Route path="driver/*" element={<DashboardLayout />}>
          <Route path="dashboard" element={null} /> {/* Handled by DashboardLayout directly */}
          <Route path="missions" element={<div>Driver Missions</div>} />
        </Route>
        
        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Route>
    )
  );

  return (
    <div className="App">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AlertProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" />
          </AlertProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
