import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import Home from './pages/Home';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/dashboard/admin/AdminDashboard';
import ClientDashboard from './pages/dashboard/client/ClientDashboard';
import DriverDashboard from './pages/dashboard/DriverDashboard';
import PricingGridPage from './pages/dashboard/admin/PricingGrid';
import MissionsPage from './pages/dashboard/admin/Missions';
import ClientMissionsPage from './pages/dashboard/client/Missions';
import MissionDetailsPage from './pages/mission/MissionDetails';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AdminInvitePage from './pages/AdminInvitePage';
import CreateMissionPage from './pages/mission/CreateMission';
import AuthCallback from './pages/auth/AuthCallback';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import Contact from './pages/Contact';

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/contact" element={<Contact />} />
        
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
        <Route path="/admin/missions/:id" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <MissionDetailsPage />
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
        <Route path="/admin/contact" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <Contact />
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
        <Route path="/client/missions/:id" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <MissionDetailsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/contact" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <Contact />
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
        <Route path="/driver/missions/:id" element={
          <ProtectedRoute roles={['chauffeur']}>
            <DashboardLayout>
              <MissionDetailsPage />
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
        
        {/* Profile route - accessible by all authenticated users */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Settings route - accessible by all authenticated users */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        
        {/* Default route - Redirect to home if not authenticated */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        
        {/* Catch all other routes and redirect to home */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
