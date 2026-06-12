import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import LeadsList from '../pages/LeadsList';
import CreateLead from '../pages/CreateLead';
import EditLead from '../pages/EditLead';
import LeadDetails from '../pages/LeadDetails';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected — wrapped in MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsList />} />
        <Route
          path="/leads/create"
          element={
            <ProtectedRoute roles={['admin', 'manager']}>
              <CreateLead />
            </ProtectedRoute>
          }
        />
        <Route path="/leads/:id" element={<LeadDetails />} />
        <Route path="/leads/:id/edit" element={<EditLead />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
