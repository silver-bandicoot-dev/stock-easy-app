import React, { useEffect, useMemo } from "react";
import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
import { useFindFirst } from "@gadgetinc/react";
import { Box, Card, Page, Spinner, Text } from "@shopify/polaris";
import {
  Outlet,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  useLocation,
  useNavigate,
} from "react-router";
import { api } from "../api";
import { DashboardPage } from "../routes/index";
import { UnsyncedPage } from "../routes/unsynced";
import { BillingPage } from "../routes/billing";
import { PlansPage } from "../routes/plans";
import { useTranslations } from "../hooks/useTranslations";
import "./App.css";

// ============================================
// Define ALL components BEFORE the router
// ============================================

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslations();

  useEffect(() => {
    const appURL = process.env.GADGET_PUBLIC_SHOPIFY_APP_URL;
    if (appURL && location.pathname === new URL(appURL).pathname) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Page>
      <Card>
        <Text as="p">{t('pageNotFound')}</Text>
      </Card>
    </Page>
  );
}

function UnauthenticatedApp() {
  const { t } = useTranslations();
  
  return (
    <Page>
      <Card>
        <Box padding="400">
          <Text as="h1" variant="headingLg">
            Stockeasy
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" tone="subdued">
              {t('openFromShopify')}
            </Text>
          </Box>
        </Box>
      </Card>
    </Page>
  );
}

function EmbeddedApp() {
  const { t } = useTranslations();
  
  return (
    <>
      <ui-nav-menu>
        <a href="/" rel="home">{t('home')}</a>
        <a href="/unsynced">{t('productsToCheck')}</a>
        <a href="/plans">{t('plans')}</a>
      </ui-nav-menu>
      <Outlet />
    </>
  );
}

/**
 * SubscriptionGuard - Redirects to billing page if no active subscription
 * Allows access if subscription is active or in trial period
 * 
 * DEV MODE: Bypasses billing check in development environment
 * This allows testing without configuring Shopify distribution
 * 
 * IMPORTANT: To avoid React #310 error, we must:
 * 1. Always call the same hooks in the same order
 * 2. Never return early before all hooks are called
 * 3. Use conditional rendering at the END, not early returns
 */
function SubscriptionGuard({ children }) {
  const navigate = useNavigate();
  const { t } = useTranslations();
  
  // Check if we're in development mode - computed once, stable reference
  // Using useMemo to ensure stability across renders
  const isDevelopment = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hostname.includes("--development") ||
      window.location.hostname.includes("localhost") ||
      process.env.NODE_ENV === "development"
    );
  }, []);
  
  // Get current shop's subscription status - ALWAYS call this hook regardless of isDevelopment
  const [{ data: shop, fetching }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  });

  // Compute subscription status - stable calculation
  const subscriptionCheck = useMemo(() => {
    const hasActiveSubscription = shop?.subscriptionStatus === "active" || shop?.subscriptionStatus === "trial";
    const now = new Date();
    const trialEnds = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
    const isInValidTrial = trialEnds && now < trialEnds;
    const isAllowed = hasActiveSubscription || isInValidTrial;
    
    return { hasActiveSubscription, isInValidTrial, isAllowed };
  }, [shop?.subscriptionStatus, shop?.trialEndsAt]);

  // Handle redirect in useEffect - always called
  useEffect(() => {
    // In development mode, skip billing check entirely
    if (isDevelopment) {
      console.log("🔧 DEV MODE: Billing check bypassed");
      return;
    }
    
    if (fetching) return;
    
    if (!subscriptionCheck.isAllowed) {
      // Redirect to billing page
      navigate("/billing", { replace: true });
    }
  }, [fetching, navigate, isDevelopment, subscriptionCheck.isAllowed]);

  // ALL HOOKS CALLED ABOVE THIS LINE
  // Now we can do conditional rendering safely

  // Determine what to render based on state
  const shouldShowLoading = !isDevelopment && fetching;
  const shouldShowContent = isDevelopment || (!fetching && subscriptionCheck.isAllowed);
  const shouldShowNothing = !isDevelopment && !fetching && !subscriptionCheck.isAllowed;

  if (shouldShowLoading) {
    return (
      <Box padding="800">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Spinner accessibilityLabel={t('loading')} size="large" />
        </div>
      </Box>
    );
  }

  if (shouldShowNothing) {
    return null; // Will redirect in useEffect
  }

  // shouldShowContent is true - render children
  return children;
}

function AuthenticatedApp() {
  const { isAuthenticated, loading } = useGadget();
  const { t } = useTranslations();

  if (loading) {
    return (
      <Box padding="800">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Spinner accessibilityLabel={t('loading')} size="large" />
        </div>
      </Box>
    );
  }

  return isAuthenticated ? <EmbeddedApp /> : <UnauthenticatedApp />;
}

function Layout() {
  return (
    <GadgetProvider
      type={AppType.Embedded}
      shopifyApiKey={window.gadgetConfig.apiKeys.shopify}
      api={api}
    >
      <AuthenticatedApp />
    </GadgetProvider>
  );
}

// ============================================
// Create router OUTSIDE of App component
// This prevents recreation on every render (React #310 fix)
// ============================================
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<SubscriptionGuard><DashboardPage /></SubscriptionGuard>} />
      <Route path="unsynced" element={<SubscriptionGuard><UnsyncedPage /></SubscriptionGuard>} />
      <Route path="plans" element={<SubscriptionGuard><PlansPage /></SubscriptionGuard>} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="*" element={<Error404 />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
