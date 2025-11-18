import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SupabaseLogin from './components/auth/SupabaseLogin';
import SupabaseSignup from './components/auth/SupabaseSignup';
import SupabaseResetPassword from './components/auth/SupabaseResetPassword';
import AcceptInvitation from './components/auth/AcceptInvitation';
import EmailConfirmation from './components/auth/EmailConfirmation';
import NotificationsPage from './components/notifications/NotificationsPage';
import StockEasy from './StockEasy';
import ProfileRedirect from './components/profile/ProfileRedirect';
import SupabaseConnectionTest from './components/debug/SupabaseConnectionTest';
import './config/i18n';

const App = () => {
  return (
    <Router>
      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={3000}
      />
      <SupabaseAuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<SupabaseLogin />} />
          <Route path="/signup" element={<SupabaseSignup />} />
          <Route path="/forgot-password" element={<SupabaseResetPassword />} />
          <Route path="/confirm-email" element={<EmailConfirmation />} />
          
          {/* Invitation Route - Protected */}
          <Route
            path="/accept-invitation"
            element={
              <ProtectedRoute>
                <AcceptInvitation />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <StockEasy />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-supabase"
            element={
              <ProtectedRoute>
                <SupabaseConnectionTest />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SupabaseAuthProvider>
    </Router>
  );
};

export default App;

