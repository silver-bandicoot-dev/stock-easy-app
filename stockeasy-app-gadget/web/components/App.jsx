import React, { useEffect } from "react";
import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
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

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />}>
      <Route index element={<DashboardPage />} />
      <Route path="unsynced" element={<UnsyncedPage />} />
      <Route path="plans" element={<PlansPage />} />
      <Route path="billing" element={<BillingPage />} />
      <Route path="*" element={<Error404 />} />
    </Route>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
