import {
  AppType,
  Provider as GadgetProvider,
  useGadget,
} from "@gadgetinc/react-shopify-app-bridge";
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
import "./App.css";

function Error404() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const appURL = process.env.GADGET_PUBLIC_SHOPIFY_APP_URL;
    if (appURL && location.pathname === new URL(appURL).pathname) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <Page>
      <Card>
        <Text as="p">Page non trouvée. Redirection...</Text>
      </Card>
    </Page>
  );
}

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="unsynced" element={<UnsyncedPage />} />
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

  if (loading) {
    return (
      <Box padding="800">
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
          <Spinner accessibilityLabel="Chargement" size="large" />
        </div>
      </Box>
    );
  }

  return isAuthenticated ? <EmbeddedApp /> : <UnauthenticatedApp />;
}

function EmbeddedApp() {
  return (
    <>
      <ui-nav-menu>
        <a href="/" rel="home">Accueil</a>
        <a href="/unsynced">Produits à vérifier</a>
      </ui-nav-menu>
      <Outlet />
    </>
  );
}

function UnauthenticatedApp() {
  return (
    <Page>
      <Card>
        <Box padding="400">
          <Text as="h1" variant="headingLg">
            Stockeasy
          </Text>
          <Box paddingBlockStart="200">
            <Text as="p" tone="subdued">
              Veuillez ouvrir cette application depuis votre admin Shopify.
            </Text>
          </Box>
        </Box>
      </Card>
    </Page>
  );
}

export default App;
