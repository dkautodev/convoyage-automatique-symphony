
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
import DriverMissionsPage from './pages/dashboard/driver/Missions';
import MissionDetailsPage from './pages/mission/MissionDetails';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AdminInvitePage from './pages/AdminInvitePage';
import CreateMissionPage from './pages/mission/CreateMission';
import AuthCallback from './pages/auth/AuthCallback';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import LoginPage from './pages/LoginPage';
import AdminContactsPage from './pages/dashboard/admin/Contacts';
import ClientContactsPage from './pages/dashboard/client/Contacts';
import ClientsPage from './pages/dashboard/admin/Clients';
import AdminInvoicesPage from './pages/dashboard/admin/Invoices';
import ClientInvoicesPage from './pages/dashboard/client/Invoices';
import Register from './pages/Register'; 
import BasicRegister from './pages/auth/BasicRegister';
import RegisterAdmin from './pages/RegisterAdmin';
import CompleteClientProfile from './pages/auth/CompleteClientProfile';
import { CompleteDriverProfile, CompleteDriverConfig } from './pages/auth';

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        
        {/* Registration routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/register-page" element={<RegisterPage />} />
        <Route path="/register-admin" element={<RegisterAdmin />} />
        <Route path="/auth/register" element={<BasicRegister />} />
        <Route path="/auth/complete-client-profile" element={<CompleteClientProfile />} />
        <Route path="/auth/complete-driver-profile" element={<CompleteDriverProfile />} />
        <Route path="/auth/complete-driver-config" element={<CompleteDriverConfig />} />
        
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
        <Route path="/admin/contacts" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <AdminContactsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/clients" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <ClientsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/admin/invoices" element={
          <ProtectedRoute roles={['admin']}>
            <DashboardLayout>
              <AdminInvoicesPage />
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
        <Route path="/client/contacts" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <ClientContactsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />
        <Route path="/client/invoices" element={
          <ProtectedRoute roles={['client']}>
            <DashboardLayout>
              <ClientInvoicesPage />
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
        <Route path="/driver/missions" element={
          <ProtectedRoute roles={['chauffeur']}>
            <DashboardLayout>
              <DriverMissionsPage />
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
