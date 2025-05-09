import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import PricingGridPage from './pages/dashboard/admin/PricingGrid';
import MissionsPage from './pages/dashboard/admin/Missions';
import ClientMissionsPage from './pages/dashboard/client/Missions';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AdminInvitePage from './pages/AdminInvitePage';
import CreateMissionPage from './pages/mission/CreateMission';

function App() {
  const isAdmin = window.location.pathname.startsWith('/admin');
  const isClient = window.location.pathname.startsWith('/client');
  const isDriver = window.location.pathname.startsWith('/driver');
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <AdminDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/pricing-grid" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <PricingGridPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/missions" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <MissionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/invite" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <AdminInvitePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Client routes */}
        <Route path="/client" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <ClientDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/missions" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <ClientMissionsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Driver routes */}
        <Route path="/driver" element={
          <ProtectedRoute roles={['chauffeur']}>
            <DashboardLayout>
              <DriverDashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* General dashboard route - Redirects based on role */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Navigate to={
              isAdmin ? '/admin' :
              isClient ? '/client' :
              isDriver ? '/driver' : '/login'
            } replace />
          </ProtectedRoute>
        } />
        
        {/* Mission creation route */}
        <Route path="/mission/create" element={
          <ProtectedRoute>
            <DashboardLayout>
              <CreateMissionPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Default route - Redirect to dashboard if authenticated, otherwise to login */}
        <Route path="/" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" replace />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
