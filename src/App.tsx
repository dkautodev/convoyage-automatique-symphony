
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import PricingGridPage from './pages/dashboard/admin/PricingGrid';
import MissionsPage from './pages/dashboard/admin/Missions';
import ClientMissionsPage from './pages/dashboard/client/Missions';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AdminInvitePage from './pages/AdminInvitePage';
import CreateMissionPage from './pages/mission/CreateMission';
import AuthCallback from './pages/auth/AuthCallback';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute roles={['admin']}>
          <DashboardLayout>
            <AdminDashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/dashboard" element={
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
      <Route path="/client/dashboard" element={
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
      <Route path="/driver/dashboard" element={
        <ProtectedRoute roles={['chauffeur']}>
          <DashboardLayout>
            <DriverDashboard />
          </DashboardLayout>
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
      
      {/* Default route - Redirect to login if not authenticated */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Catch all other routes and redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
