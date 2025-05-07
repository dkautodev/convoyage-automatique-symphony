import React, { useState, useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements } from 'react-router-dom';
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
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';

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
        <Route path=":role" element={<DashboardLayout />}>
          <Route path="dashboard" element={<Dashboard />} />
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
