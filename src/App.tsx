import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Clients from './pages/Clients';
import NeedsForms from './pages/NeedsForms';
import Calendar from './pages/Calendar';
import RentalManagement from './pages/RentalManagement';
import Maintenance from './pages/Maintenance';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { NotificationCenter } from './components/ui/NotificationCenter';
import { useTranslation } from 'react-i18next';

function App() {
  const { i18n } = useTranslation();

  return (
    <NotificationProvider>
      <AuthProvider>
        <BrowserRouter>
          <NotificationCenter />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="properties" element={<Properties />} />
              <Route path="clients" element={<Clients />} />
              <Route path="needs-forms" element={<NeedsForms />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="rental-management" element={<RentalManagement />} />
              <Route path="maintenance" element={<Maintenance />} />
              <Route path="documents" element={<Documents />} />
              <Route path="users" element={<Users />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;