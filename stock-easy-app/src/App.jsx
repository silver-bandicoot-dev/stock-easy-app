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
import LegalNotices from './pages/Legal/LegalNotices';
import SentryErrorBoundary from './components/common/SentryErrorBoundary';
import SEOUpdater from './components/common/SEOUpdater';
import './config/i18n';

// Wrapper Routes avec Sentry pour le tracing des navigations (uniquement pour les routes protégées)
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

/**
 * Wrapper pour les routes protégées avec Sentry
 * Sentry n'est actif que sur l'application, pas sur les pages publiques
 */
const ProtectedAppRoute = ({ children }) => (
  <SentryErrorBoundary>
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  </SentryErrorBoundary>
);

const App = () => {
  return (
    <LanguageProvider>
      <SEOUpdater />
        <Router>
          <Toaster
            position="top-right"
            richColors
            expand={false}
            closeButton
            duration={4000}
          />
          <SupabaseAuthProvider>
            <ModalProvider>
              <Routes>
              {/* Coming Soon Page - Public (temporaire avant lancement) - Sans Sentry */}
              <Route path="/" element={<ComingSoon />} />
              
              {/* Landing Page Preview - Pour révision interne - Sans Sentry */}
              <Route path="/preview" element={<Landing />} />

              {/* Pages Légales - Sans Sentry */}
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/notices" element={<LegalNotices />} />
              
              {/* Public Routes - Sans Sentry */}
              <Route path="/login" element={<SupabaseLogin />} />
              <Route path="/forgot-password" element={<SupabaseResetPassword />} />
              <Route path="/confirm-email" element={<EmailConfirmation />} />
              
              {/* Invitation Route - Protected avec Sentry */}
              <Route
                path="/accept-invitation"
                element={
                  <ProtectedAppRoute>
                    <AcceptInvitation />
                  </ProtectedAppRoute>
                }
              />

              {/* Protected Routes - Main App avec Sentry */}
              {/* Route principale /app redirige vers /app/dashboard */}
              <Route
                path="/app"
                element={<Navigate to="/app/dashboard" replace />}
              />
              {/* Routes imbriquées pour l'application principale */}
              <Route
                path="/app/:tab"
                element={
                  <ProtectedAppRoute>
                    <Stockeasy />
                  </ProtectedAppRoute>
                }
              />
              <Route
                path="/app/:tab/:subTab"
                element={
                  <ProtectedAppRoute>
                    <Stockeasy />
                  </ProtectedAppRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedAppRoute>
                    <ProfileRedirect />
                  </ProtectedAppRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedAppRoute>
                    <NotificationsPage />
                  </ProtectedAppRoute>
                }
              />
              <Route
                path="/test-supabase"
                element={
                  <ProtectedAppRoute>
                    <SupabaseConnectionTest />
                  </ProtectedAppRoute>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ModalProvider>
        </SupabaseAuthProvider>
      </Router>
    </LanguageProvider>
  );
};

export default App;
