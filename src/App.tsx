
import React from 'react';
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Outlet
} from 'react-router-dom';
import './App.css';
import RootLayout from '@/layouts/RootLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

// Public pages
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Pricing from '@/pages/Pricing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ErrorPage from '@/pages/ErrorPage';
import CompleteDriverProfile from '@/pages/CompleteDriverProfile';
import CompleteClientProfile from '@/pages/CompleteClientProfile';

// Dashboard pages
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/dashboard/admin/AdminDashboard';
import Clients from '@/pages/dashboard/admin/Clients';
import Drivers from '@/pages/dashboard/admin/Drivers';
import ClientDashboard from '@/pages/dashboard/client/ClientDashboard';
import ClientMissions from '@/pages/dashboard/client/ClientMissions';
import AdminInvite from '@/pages/AdminInvite';
import PricingGridPage from '@/pages/dashboard/admin/PricingGrid';

// Mission pages
import CreateMissionPage from '@/pages/mission/CreateMission';
import MissionDetailsPage from '@/pages/mission/MissionDetails';
import AdminMissionsPage from '@/pages/mission/AdminMissionsPage';
import ClientMissionsPage from '@/pages/mission/ClientMissionsPage';
import Missions from '@/pages/dashboard/admin/Missions';

// Contacts pages
import AdminContactsPage from '@/pages/contacts/AdminContactsPage';
import ClientContactsPage from '@/pages/contacts/ClientContactsPage';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />}>
      {/* Public routes */}
      <Route index element={<Home />} />
      <Route path="about" element={<About />} />
      <Route path="contact" element={<Contact />} />
      <Route path="pricing" element={<Pricing />} />
      <Route path="*" element={<ErrorPage />} />

      {/* Auth routes */}
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="complete-driver-profile" element={<CompleteDriverProfile />} />
      <Route path="complete-client-profile" element={<CompleteClientProfile />} />
      <Route path="admin-invite" element={<AdminInvite />} />

      {/* Admin dashboard routes */}
      <Route element={<DashboardLayout children={<Outlet />} />}>
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/clients"
          element={<ProtectedRoute roles={["admin"]}><Clients /></ProtectedRoute>}
        />
        <Route
          path="/admin/drivers"
          element={<ProtectedRoute roles={["admin"]}><Drivers /></ProtectedRoute>}
        />
        <Route
          path="/admin/contacts"
          element={<ProtectedRoute roles={["admin"]}><AdminContactsPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/missions"
          element={<ProtectedRoute roles={["admin"]}><Missions /></ProtectedRoute>}
        />
        <Route
          path="/admin/pricing-grid"
          element={<ProtectedRoute roles={["admin"]}><PricingGridPage /></ProtectedRoute>}
        />
        <Route
          path="/admin/invite"
          element={<ProtectedRoute roles={["admin"]}><AdminInvite /></ProtectedRoute>}
        />
      </Route>

      {/* Client dashboard routes */}
      <Route element={<DashboardLayout children={<Outlet />} />}>
        <Route
          path="/client/dashboard"
          element={<ProtectedRoute roles={["client"]}><ClientDashboard /></ProtectedRoute>}
        />
        <Route
          path="/client/missions"
          element={<ProtectedRoute roles={["client"]}><ClientMissionsPage /></ProtectedRoute>}
        />
        <Route
          path="/client/contacts"
          element={<ProtectedRoute roles={["client"]}><ClientContactsPage /></ProtectedRoute>}
        />
      </Route>

      {/* Driver dashboard routes */}
      <Route element={<DashboardLayout children={<Outlet />} />}>
        <Route
          path="/driver/dashboard"
          element={<ProtectedRoute roles={["chauffeur"]}><Dashboard /></ProtectedRoute>}
        />
      </Route>

      {/* Shared routes */}
      <Route path="/mission/create" element={<ProtectedRoute><CreateMissionPage /></ProtectedRoute>} />

      {/* 404 route */}
      <Route path="*" element={<ErrorPage />} />
    </Route>
  )
);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
