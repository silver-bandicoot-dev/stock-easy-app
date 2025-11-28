import { useFindMany, useFindFirst, useAction } from "@gadgetinc/react";
import { api } from "../api";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Icon,
  Spinner,
  Banner
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalIcon,
  RefreshIcon,
  AlertCircleIcon
} from '@shopify/polaris-icons';
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [supabaseStats, setSupabaseStats] = useState({ 
    syncedSkus: 0, 
    totalProducts: 0, 
    totalShopifySkus: 0,
    unsyncedItems: [] 
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load shop data - Gelly filter on server side handles tenancy
  const [{ data: shop, fetching: shopFetching, error: shopError }, refetchShop] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      name: true,
      myshopifyDomain: true,
      email: true,
      stockEasyCompanyId: true
    }
  });



  // Load last sync log
  const [{ data: lastLogs }, refetchLogs] = useFindMany(api.syncLog, {
    filter: { status: { equals: 'success' } },
    sort: { createdAt: "Descending" },
    first: 1,
    select: { createdAt: true, entity: true }
  });

  // Actions
  const [, connectShopToCompany] = useAction(api.connectShopToCompany);
  const [, updateShop] = useAction(api.shopifyShop.update);
  const [, getSupabaseStats] = useAction(api.getSupabaseStats);

  // Load Supabase stats (source of truth)
  const loadSupabaseStats = useCallback(async () => {
    if (!shop?.id || !shop?.stockEasyCompanyId) {
      setStatsLoading(false);
      return;
    }
    
    try {
      const result = await getSupabaseStats({ shopId: shop.id });
      if (result?.data?.success) {
        setSupabaseStats({
          syncedSkus: result.data.syncedSkus || 0,
          totalProducts: result.data.totalProducts || 0,
          totalShopifySkus: result.data.totalShopifySkus || 0,
          unsyncedItems: result.data.unsyncedItems || []
        });
      }
    } catch (error) {
      console.error('Failed to load Supabase stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, [shop?.id, shop?.stockEasyCompanyId, getSupabaseStats]);

  useEffect(() => {
    loadSupabaseStats();
  }, [loadSupabaseStats]);

  // Calculate stats - Supabase is source of truth
  const isConnected = !!shop?.stockEasyCompanyId;
  const syncedCount = supabaseStats.syncedSkus;
  const totalSkus = supabaseStats.totalShopifySkus || 0;
  const unsyncedItems = supabaseStats.unsyncedItems || [];
  const unsyncedCount = unsyncedItems.length;
  const lastSync = lastLogs?.[0]?.createdAt;

  // Format time ago
  const formatTimeAgo = (date) => {
    if (!date) return 'Jamais';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'À l\'instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
    return `Il y a ${Math.floor(seconds / 86400)} jour(s)`;
  };

  // Handle connect
  const handleConnect = useCallback(async () => {
    if (!shop?.id) {
      shopify.toast.show('Boutique non trouvée', { isError: true });
      return;
    }
    
    setConnecting(true);
    try {
      const response = await connectShopToCompany({ shopId: shop.id });
      const result = response?.data || response;
      
      if (result?.success || result?.companyId) {
        shopify.toast.show('🎉 Connexion réussie !');
        refetchShop();
      } else {
        const errorMsg = result?.message || 'Erreur de connexion';
        shopify.toast.show(errorMsg, { isError: true });
      }
    } catch (error) {
      shopify.toast.show('Erreur de connexion', { isError: true });
    } finally {
      setConnecting(false);
    }
  }, [shop?.id, connectShopToCompany, refetchShop]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (!confirm('Êtes-vous sûr de vouloir déconnecter Stockeasy ? Vos données resteront sur Stockeasy mais ne seront plus synchronisées.')) {
      return;
    }
    
    setDisconnecting(true);
    try {
      await updateShop({
        id: shop?.id,
        stockEasyCompanyId: null
      });
      shopify.toast.show('Déconnexion réussie');
      refetchShop();
    } catch (error) {
      shopify.toast.show('Erreur lors de la déconnexion', { isError: true });
    } finally {
      setDisconnecting(false);
    }
  }, [shop?.id, updateShop, refetchShop]);

  // Handle manual sync (enqueue to run in background)
  const handleSync = useCallback(async () => {
    if (!shop?.id) {
      shopify.toast.show('Erreur: boutique non trouvée', { isError: true });
      return;
    }
    
    setSyncing(true);
    
    try {
      await api.enqueue(api.syncShopifyProducts, { shopId: shop.id });
      shopify.toast.show('🔄 Synchronisation lancée !');
      
      // Refetch data after sync completes
      setTimeout(() => {
        loadSupabaseStats(); // Reload stats from Supabase
        setSyncing(false);
      }, 5000);
    } catch (error) {
      shopify.toast.show('Erreur lors de la synchronisation', { isError: true });
      setSyncing(false);
    }
  }, [shop?.id, loadSupabaseStats]);

  // Build Stockeasy dashboard URL
  const stockeasyUrl = shop?.stockEasyCompanyId 
    ? `https://stockeasy.app/dashboard` 
    : 'https://stockeasy.app';

  // Loading state
  if (shopFetching || statsLoading) {
    return (
      <Page>
        <Card>
          <BlockStack gap="400" inlineAlign="center">
            <Spinner size="large" />
            <Text as="p">Chargement...</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return (
    <Page>
      <BlockStack gap="500">
        {/* Main Status Card */}
        <Card>
          <BlockStack gap="500">
            {/* Connection Status */}
            <InlineStack gap="400" align="start" blockAlign="center">
              <Box
                background={isConnected ? "bg-fill-success" : "bg-fill-warning"}
                borderRadius="full"
                padding="300"
              >
                <Icon 
                  source={isConnected ? CheckCircleIcon : AlertTriangleIcon} 
                  tone={isConnected ? "success" : "warning"}
                />
              </Box>
              <BlockStack gap="050">
                <Text as="h1" variant="headingLg">
                  {isConnected ? "Stockeasy connecté" : "Non connecté"}
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {isConnected 
                    ? `Boutique ${shop?.name}` 
                    : "Connectez votre boutique pour synchroniser vos produits"
                  }
                </Text>
              </BlockStack>
            </InlineStack>

            {/* Stats - Only show if connected */}
            {isConnected && (
              <Box 
                background="bg-surface-secondary" 
                borderRadius="200" 
                padding="400"
              >
                <InlineStack gap="600" align="space-around">
                  <BlockStack gap="100" inlineAlign="center">
                    <Text as="p" variant="heading2xl" fontWeight="bold">
                      {syncedCount}
                      <Text as="span" variant="headingMd" tone="subdued" fontWeight="regular">
                        {" "}/ {totalSkus}
                      </Text>
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      SKUs synchronisés
                    </Text>
                  </BlockStack>
                  
                  <Box background="border" minWidth="1px" minHeight="50px" />
                  
                  <BlockStack gap="100" inlineAlign="center">
                    <Text as="p" variant="headingLg">
                      {formatTimeAgo(lastSync)}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      dernière sync
                    </Text>
                  </BlockStack>
                </InlineStack>
              </Box>
            )}

            {/* Sync button */}
            {isConnected && (
              <Button
                icon={RefreshIcon}
                onClick={handleSync}
                loading={syncing}
                fullWidth
                variant="secondary"
              >
                Synchroniser maintenant
              </Button>
            )}

            {/* SKUs not synced - Summary card with link to details */}
            {isConnected && unsyncedCount > 0 && (() => {
              // Group items by reason for summary
              const noSkuCount = unsyncedItems.filter(i => i.reason === 'no_sku').length;
              const notTrackedCount = unsyncedItems.filter(i => i.reason === 'not_tracked').length;
              const notSyncedOnlyCount = unsyncedItems.filter(i => i.reason === 'not_synced').length;
              
              return (
                <Card>
                  <BlockStack gap="400">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        <Box
                          background="bg-fill-warning"
                          borderRadius="full"
                          padding="200"
                        >
                          <Icon source={AlertCircleIcon} tone="warning" />
                        </Box>
                        <BlockStack gap="050">
                          <Text as="h2" variant="headingMd">
                            {unsyncedCount} produit(s) à vérifier
                          </Text>
                          <Text as="p" variant="bodySm" tone="subdued">
                            Ces produits ne peuvent pas être synchronisés
                          </Text>
                        </BlockStack>
                      </InlineStack>
                      <Button
                        onClick={() => navigate('/unsynced')}
                        variant="secondary"
                      >
                        Voir les détails
                      </Button>
                    </InlineStack>
                    
                    {/* Quick summary badges */}
                    <InlineStack gap="200" wrap>
                      {noSkuCount > 0 && (
                        <Box background="bg-fill-critical-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
                          <Text as="span" variant="bodySm">❌ {noSkuCount} sans SKU</Text>
                        </Box>
                      )}
                      {notTrackedCount > 0 && (
                        <Box background="bg-fill-warning-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
                          <Text as="span" variant="bodySm">📦 {notTrackedCount} non suivi</Text>
                        </Box>
                      )}
                      {notSyncedOnlyCount > 0 && (
                        <Box background="bg-fill-info-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
                          <Text as="span" variant="bodySm">⏳ {notSyncedOnlyCount} à synchroniser</Text>
                        </Box>
                      )}
                    </InlineStack>
                  </BlockStack>
                </Card>
              );
            })()}

            {/* All synced success */}
            {isConnected && unsyncedCount <= 0 && syncedCount > 0 && (
              <Banner tone="success">
                <Text as="p">
                  ✅ Tous vos SKUs Shopify sont synchronisés avec Stockeasy !
                </Text>
              </Banner>
            )}

            {/* Info about real-time sync */}
            {isConnected && (
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                🔄 Synchronisation automatique en temps réel active
              </Text>
            )}

            {/* Main CTA */}
            <BlockStack gap="200">
              {isConnected ? (
                <>
                  <Button
                    variant="primary"
                    size="large"
                    icon={ExternalIcon}
                    url={stockeasyUrl}
                    external
                    fullWidth
                  >
                    Ouvrir Stockeasy
                  </Button>
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={handleDisconnect}
                    loading={disconnecting}
                  >
                    Déconnecter Stockeasy
                  </Button>
                </>
              ) : (
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleConnect}
                  loading={connecting}
                  fullWidth
                >
                  Connecter à Stockeasy
                </Button>
              )}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Help Card */}
        <Card>
          <InlineStack align="space-between" blockAlign="center">
            <BlockStack gap="050">
              <Text as="h2" variant="headingMd">Besoin d'aide ?</Text>
              <Text as="p" tone="subdued" variant="bodySm">
                Documentation et support
              </Text>
            </BlockStack>
            <InlineStack gap="200">
              <Button url="https://stockeasy.app/docs" external variant="plain">
                Docs
              </Button>
              <Button url="https://stockeasy.app/support" external variant="plain">
                Support
              </Button>
            </InlineStack>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
};
