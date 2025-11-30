import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import * as Sentry from '@sentry/react';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { ModalProvider } from './contexts/ModalContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Toaster } from 'sonner';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SupabaseLogin from './components/auth/SupabaseLogin';
import SupabaseResetPassword from './components/auth/SupabaseResetPassword';
import AcceptInvitation from './components/auth/AcceptInvitation';
import EmailConfirmation from './components/auth/EmailConfirmation';
import NotificationsPage from './components/notifications/NotificationsPage';
import Stockeasy from './StockEasy.jsx';
import ProfileRedirect from './components/profile/ProfileRedirect';
import SupabaseConnectionTest from './components/debug/SupabaseConnectionTest';
import Landing from './pages/Landing';
import ComingSoon from './pages/Landing/ComingSoon';
import TermsOfService from './pages/Legal/TermsOfService';
import PrivacyPolicy from './pages/Legal/PrivacyPolicy';
import LegalNotice from './pages/Legal/LegalNotice';
import CookiePolicy from './pages/Legal/CookiePolicy';
import SentryErrorBoundary from './components/common/SentryErrorBoundary';
import './config/i18n';

// Wrapper Routes avec Sentry pour le tracing des navigations
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

const App = () => {
  return (
    <SentryErrorBoundary>
      <LanguageProvider>
        <Router>
          <Toaster
            position="top-right"
            richColors
            expand={false}
            duration={3000}
          />
          <SupabaseAuthProvider>
            <ModalProvider>
          <SentryRoutes>
            {/* Coming Soon Page - Public (temporaire avant lancement) */}
            <Route path="/" element={<ComingSoon />} />
            
            {/* Landing Page Preview - Pour révision interne */}
            <Route path="/preview" element={<Landing />} />

            {/* Pages Légales */}
            <Route path="/legal/terms" element={<TermsOfService />} />
            <Route path="/legal/privacy" element={<PrivacyPolicy />} />
            <Route path="/legal/notices" element={<LegalNotice />} />
            <Route path="/legal/cookies" element={<CookiePolicy />} />
            
            {/* Public Routes */}
            <Route path="/login" element={<SupabaseLogin />} />
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

            {/* Protected Routes - Main App */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Stockeasy />
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
          </SentryRoutes>
            </ModalProvider>
          </SupabaseAuthProvider>
        </Router>
      </LanguageProvider>
    </SentryErrorBoundary>
  );
};

export default App;
