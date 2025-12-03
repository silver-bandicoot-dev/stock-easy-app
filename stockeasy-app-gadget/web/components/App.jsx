import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
import { useFindFirst } from "@gadgetinc/react";
import { Box, Card, Page, Spinner, Text } from "@shopify/polaris";
import { useEffect } from "react";
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

function App() {
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

  return <RouterProvider router={router} />;
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

/**
 * SubscriptionGuard - Redirects to billing page if no active subscription
 * Allows access if subscription is active or in trial period
 * 
 * DEV MODE: Bypasses billing check in development environment
 * This allows testing without configuring Shopify distribution
 */
function SubscriptionGuard({ children }) {
  const navigate = useNavigate();
  const { t } = useTranslations();
  
  // Check if we're in development mode - bypass billing entirely
  const isDevelopment = window.location.hostname.includes("--development") ||
                        window.location.hostname.includes("localhost") ||
                        process.env.NODE_ENV === "development";
  
  // Get current shop's subscription status
  const [{ data: shop, fetching }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      subscriptionStatus: true,
      trialEndsAt: true,
    },
  });

  useEffect(() => {
    // In development mode, skip billing check entirely
    if (isDevelopment) {
      console.log("🔧 DEV MODE: Billing check bypassed");
      return;
    }
    
    if (fetching) return;
    
    // Check if subscription is valid
    const hasActiveSubscription = shop?.subscriptionStatus === "active" || shop?.subscriptionStatus === "trial";
    
    // Also check if in trial period (even if status hasn't updated yet)
    const now = new Date();
    const trialEnds = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
    const isInValidTrial = trialEnds && now < trialEnds;
    
    if (!hasActiveSubscription && !isInValidTrial) {
      // Redirect to billing page
      navigate("/billing", { replace: true });
    }
  }, [shop, fetching, navigate, isDevelopment]);

  // In development mode, allow access immediately
  if (isDevelopment) {
    return children;
  }

  // Show loading while checking subscription
  if (fetching) {
    return (
      <Box padding="800">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Spinner accessibilityLabel={t('loading')} size="large" />
        </div>
      </Box>
    );
  }

  // Check subscription status
  const hasActiveSubscription = shop?.subscriptionStatus === "active" || shop?.subscriptionStatus === "trial";
  const now = new Date();
  const trialEnds = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
  const isInValidTrial = trialEnds && now < trialEnds;

  if (!hasActiveSubscription && !isInValidTrial) {
    return null; // Will redirect in useEffect
  }

  return children;
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

export default App;
