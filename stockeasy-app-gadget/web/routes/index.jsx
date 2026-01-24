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
  AlertCircleIcon,
  LocationIcon
} from '@shopify/polaris-icons';
import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTranslations } from "../hooks/useTranslations";
import { LanguageSelector } from "../components/LanguageSelector";
import { LocationSelector } from "../components/LocationSelector";

// Extracted component to avoid IIFE in render (prevents React #310 error)
const UnsyncedSummaryCard = ({ unsyncedItems, unsyncedCount, t, navigate }) => {
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
                {t('productsToVerify', { count: unsyncedCount })}
              </Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {t('cannotSync')}
              </Text>
            </BlockStack>
          </InlineStack>
          <Button
            onClick={() => navigate('/unsynced')}
            variant="secondary"
          >
            {t('viewDetails')}
          </Button>
        </InlineStack>
        
        {/* Quick summary badges */}
        <InlineStack gap="200" wrap>
          {noSkuCount > 0 && (
            <Box background="bg-fill-critical-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
              <Text as="span" variant="bodySm">❌ {noSkuCount} {t('noSku')}</Text>
            </Box>
          )}
          {notTrackedCount > 0 && (
            <Box background="bg-fill-warning-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
              <Text as="span" variant="bodySm">📦 {notTrackedCount} {t('notTracked')}</Text>
            </Box>
          )}
          {notSyncedOnlyCount > 0 && (
            <Box background="bg-fill-info-secondary" paddingInline="200" paddingBlock="100" borderRadius="full">
              <Text as="span" variant="bodySm">⏳ {notSyncedOnlyCount} {t('toSync')}</Text>
            </Box>
          )}
        </InlineStack>
      </BlockStack>
    </Card>
  );
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { t, formatTimeAgo, language, changeLanguage } = useTranslations();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [supabaseStats, setSupabaseStats] = useState({ 
    syncedSkus: 0, 
    totalProducts: 0, 
    totalShopifySkus: 0,
    unsyncedItems: [],
    unsyncedCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Location selection state
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState(null);

  // Load shop data - Gelly filter on server side handles tenancy
  const [{ data: shop, fetching: shopFetching, error: shopError }, refetchShop] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      name: true,
      myshopifyDomain: true,
      email: true,
      stockEasyCompanyId: true,
      defaultLocationId: true
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
  const [, getShopLocations] = useAction(api.getShopLocations);
  const [, generateMagicLink] = useAction(api.generateMagicLink);

  // Memoize filter to prevent unnecessary re-renders (React #310 fix)
  const locationFilter = useMemo(() => {
    if (!shop?.defaultLocationId) return undefined;
    return { id: { equals: shop.defaultLocationId } };
  }, [shop?.defaultLocationId]);

  // Load selected location name - always call hook, use pause for conditional behavior
  const [{ data: selectedLocation }] = useFindFirst(api.shopifyLocation, {
    filter: locationFilter,
    select: { id: true, name: true },
    pause: !shop?.defaultLocationId
  });

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
          unsyncedItems: result.data.unsyncedItems || [],
          unsyncedCount: result.data.unsyncedCount || 0
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
  const unsyncedCount = supabaseStats.unsyncedCount || unsyncedItems.length; // Use server count if available
  const lastSync = lastLogs?.[0]?.createdAt;

  // Load locations for selection
  const loadLocations = useCallback(async () => {
    if (!shop?.id) return;
    
    setLocationsLoading(true);
    try {
      const response = await getShopLocations({ shopId: shop.id });
      const result = response?.data || response;
      
      if (result?.success && result?.locations) {
        setLocations(result.locations);
        
        // If only 1 active location, auto-select and connect directly
        const activeLocations = result.locations.filter(loc => loc.active);
        if (activeLocations.length === 1) {
          // Still show the selector for confirmation
          setShowLocationSelector(true);
        } else if (activeLocations.length > 1) {
          // Multiple locations - show selector
          setShowLocationSelector(true);
        } else {
          // No locations
          shopify.toast.show(t('noLocationsFound'), { isError: true });
        }
      } else {
        shopify.toast.show(result?.message || t('error'), { isError: true });
      }
    } catch (error) {
      console.error('Failed to load locations:', error);
      shopify.toast.show(t('error'), { isError: true });
    } finally {
      setLocationsLoading(false);
    }
  }, [shop?.id, getShopLocations, t]);

  // Handle connect button click - load locations first
  const handleConnectClick = useCallback(async () => {
    await loadLocations();
  }, [loadLocations]);

  // Handle location selection confirmation
  const handleLocationConfirm = useCallback(async (locationId) => {
    if (!shop?.id || !locationId) {
      shopify.toast.show(t('error'), { isError: true });
      return;
    }
    
    setConnecting(true);
    try {
      const response = await connectShopToCompany({ 
        shopId: shop.id, 
        locationId: locationId 
      });
      const result = response?.data || response;
      
      if (result?.success || result?.companyId) {
        shopify.toast.show(t('connectionSuccess'));
        setShowLocationSelector(false);
        refetchShop();
      } else {
        const errorMsg = result?.message || t('connectionError');
        shopify.toast.show(errorMsg, { isError: true });
      }
    } catch (error) {
      console.error('Connection error:', error);
      shopify.toast.show(t('connectionError'), { isError: true });
    } finally {
      setConnecting(false);
    }
  }, [shop?.id, connectShopToCompany, refetchShop, t]);

  // Handle connect (legacy - now redirects to location selection)
  const handleConnect = useCallback(async () => {
    await handleConnectClick();
  }, [handleConnectClick]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    if (!confirm(t('disconnectConfirm'))) {
      return;
    }
    
    setDisconnecting(true);
    try {
      await updateShop({
        id: shop?.id,
        stockEasyCompanyId: null
      });
      shopify.toast.show(t('disconnectSuccess'));
      refetchShop();
    } catch (error) {
      shopify.toast.show(t('disconnectError'), { isError: true });
    } finally {
      setDisconnecting(false);
    }
  }, [shop?.id, updateShop, refetchShop, t]);

  // Handle manual sync (enqueue to run in background)
  const handleSync = useCallback(async () => {
    if (!shop?.id) {
      shopify.toast.show(t('shopNotFound'), { isError: true });
      return;
    }
    
    setSyncing(true);
    
    try {
      await api.enqueue(api.syncShopifyProducts, { shopId: shop.id });
      shopify.toast.show(t('syncStarted'));
      
      // Refetch data after sync completes
      setTimeout(() => {
        loadSupabaseStats(); // Reload stats from Supabase
        setSyncing(false);
      }, 5000);
    } catch (error) {
      shopify.toast.show(t('syncError'), { isError: true });
      setSyncing(false);
    }
  }, [shop?.id, loadSupabaseStats, t]);

  // Handle opening Stockeasy with Magic Link or Invitation
  const handleOpenStockeasy = useCallback(async () => {
    if (!shop?.email) {
      shopify.toast.show(t('emailNotFound'), { isError: true });
      return;
    }

    setGeneratingLink(true);
    try {
      const result = await generateMagicLink({ 
        email: shop.email,
        shopName: shop.name,
        shopifyShopId: shop.myshopifyDomain
      });
      
      if (result?.data?.success) {
        // Check if we got a magic link or an invitation was sent
        if (result?.data?.action === 'magic_link' && result?.data?.magicLinkUrl) {
          // User has password configured → Redirect to Magic Link
          window.location.href = result.data.magicLinkUrl;
        } else if (result?.data?.action === 'invitation_sent') {
          // User needs to configure password → Show message
          shopify.toast.show(t('invitationSent'), { duration: 5000 });
          setGeneratingLink(false);
        } else {
          // Fallback for legacy magic link behavior
          if (result?.data?.magicLinkUrl) {
            window.location.href = result.data.magicLinkUrl;
          } else {
            shopify.toast.show(result?.data?.message || t('checkEmail'), { duration: 5000 });
            setGeneratingLink(false);
          }
        }
      } else {
        shopify.toast.show(result?.data?.message || t('magicLinkError'), { isError: true });
        setGeneratingLink(false);
      }
    } catch (error) {
      console.error('Error generating Magic Link:', error);
      shopify.toast.show(t('magicLinkError'), { isError: true });
      setGeneratingLink(false);
    }
  }, [shop?.email, shop?.name, shop?.myshopifyDomain, generateMagicLink, t]);

  // Loading state
  if (shopFetching || statsLoading) {
    return (
      <Page>
        <Card>
          <BlockStack gap="400" inlineAlign="center">
            <Spinner size="large" />
            <Text as="p">{t('loading')}</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  // Show location selector when needed (before connection or changing location)
  if (showLocationSelector) {
    return (
      <Page>
        <BlockStack gap="500">
          {/* Header Card with Logo */}
          <Card>
            <InlineStack align="space-between" blockAlign="center">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: 32, height: 32, transform: 'scaleY(-1)' }}
                >
                  <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" fill="rgba(0, 0, 0, 0.8)" stroke="#191919" strokeWidth="1.5"/>
                  <path d="M50 15 L15 35 L15 65 L50 45 Z" fill="rgba(0, 0, 0, 0.6)" stroke="#191919" strokeWidth="1.5"/>
                  <path d="M50 15 L85 35 L85 65 L50 45 Z" fill="rgba(0, 0, 0, 0.9)" stroke="#191919" strokeWidth="1.5"/>
                  <line x1="50" y1="15" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                  <line x1="15" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                  <line x1="85" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                </svg>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#191919', opacity: 0.2 }} />
                <span className="stockeasy-logo-text">stockeasy</span>
              </div>
              <Button
                variant="plain"
                onClick={() => setShowLocationSelector(false)}
              >
                {t('back')}
              </Button>
            </InlineStack>
          </Card>
          
          {/* Location Selector */}
          <LocationSelector
            locations={locations}
            selectedLocationId={shop?.defaultLocationId}
            onSelectLocation={() => {}}
            loading={connecting || locationsLoading}
            onConfirm={handleLocationConfirm}
          />
        </BlockStack>
      </Page>
    );
  }

  return (
    <Page>
      <BlockStack gap="500">
        {/* Main Status Card */}
        <Card>
          <BlockStack gap="500">
            {/* Header: Logo + Sync Button */}
            <InlineStack align="space-between" blockAlign="center">
              {/* Logo Stockeasy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: 32, height: 32, transform: 'scaleY(-1)' }}
                >
                  <path d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z" fill="rgba(0, 0, 0, 0.8)" stroke="#191919" strokeWidth="1.5"/>
                  <path d="M50 15 L15 35 L15 65 L50 45 Z" fill="rgba(0, 0, 0, 0.6)" stroke="#191919" strokeWidth="1.5"/>
                  <path d="M50 15 L85 35 L85 65 L50 45 Z" fill="rgba(0, 0, 0, 0.9)" stroke="#191919" strokeWidth="1.5"/>
                  <line x1="50" y1="15" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                  <line x1="15" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                  <line x1="85" y1="35" x2="50" y2="45" stroke="#191919" strokeWidth="1" opacity="0.5"/>
                </svg>
                <div style={{ width: '1px', height: '24px', backgroundColor: '#191919', opacity: 0.2 }} />
                <span className="stockeasy-logo-text">stockeasy</span>
              </div>
              
              {/* Sync button */}
              {isConnected && (
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: syncing ? 0.7 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {syncing ? (
                    <span style={{ width: 14, height: 14 }}>
                      <Spinner size="small" />
                    </span>
                  ) : (
                    <Icon source={RefreshIcon} tone="inherit" />
                  )}
                  {t('sync')}
                </button>
              )}
            </InlineStack>

            {/* Shop name + Connection status */}
            <InlineStack gap="200" blockAlign="center">
              <Text as="p" variant="bodyMd">
                {shop?.name || 'Boutique'}
              </Text>
              {isConnected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    display: 'inline-block'
                  }} />
                  <Text as="span" variant="bodySm" tone="subdued">{t('connected')}</Text>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#f59e0b',
                    display: 'inline-block'
                  }} />
                  <Text as="span" variant="bodySm" tone="subdued">{t('notConnected')}</Text>
                </div>
              )}
            </InlineStack>

            {/* Current location badge - show when connected */}
            {isConnected && selectedLocation && (
              <Box 
                background="bg-surface-secondary" 
                borderRadius="200" 
                padding="300"
              >
                <InlineStack align="space-between" blockAlign="center">
                  <InlineStack gap="200" blockAlign="center">
                    <Icon source={LocationIcon} tone="subdued" />
                    <BlockStack gap="050">
                      <Text as="span" variant="bodySm" tone="subdued">
                        {t('currentLocation')}
                      </Text>
                      <Text as="p" variant="bodyMd" fontWeight="semibold">
                        {selectedLocation.name}
                      </Text>
                    </BlockStack>
                  </InlineStack>
                  <Button
                    variant="plain"
                    size="slim"
                    onClick={loadLocations}
                    loading={locationsLoading}
                  >
                    {t('changeLocation')}
                  </Button>
                </InlineStack>
              </Box>
            )}

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
                      {t('syncedSkus')}
                    </Text>
                  </BlockStack>
                  
                  <Box background="border" minWidth="1px" minHeight="50px" />
                  
                  <BlockStack gap="100" inlineAlign="center">
                    <Text as="p" variant="headingLg">
                      {formatTimeAgo(lastSync)}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      {t('lastSkuSync')}
                    </Text>
                  </BlockStack>
                </InlineStack>
              </Box>
            )}


            {/* SKUs not synced - Summary card with link to details */}
            {isConnected && unsyncedCount > 0 && (
              <UnsyncedSummaryCard 
                unsyncedItems={unsyncedItems}
                unsyncedCount={unsyncedCount}
                t={t}
                navigate={navigate}
              />
            )}

            {/* All synced success */}
            {isConnected && unsyncedCount <= 0 && syncedCount > 0 && (
              <Banner tone="success">
                <Text as="p">
                  {t('allSynced')}
                </Text>
              </Banner>
            )}

            {/* Info about real-time sync */}
            {isConnected && (
              <Text as="p" variant="bodySm" tone="subdued" alignment="center">
                {t('autoSyncInfo')}
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
                    onClick={handleOpenStockeasy}
                    loading={generatingLink}
                    fullWidth
                  >
                    {t('openStockeasy')}
                  </Button>
                  <Button
                    variant="plain"
                    tone="critical"
                    onClick={handleDisconnect}
                    loading={disconnecting}
                  >
                    {t('disconnectStockeasy')}
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
                  {t('connectToStockeasy')}
                </Button>
              )}
            </BlockStack>
          </BlockStack>
        </Card>

        {/* Help Card */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="050">
                <Text as="h2" variant="headingMd">{t('needHelp')}</Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  {t('docsAndSupport')}
                </Text>
              </BlockStack>
              <InlineStack gap="200">
                <Button url="https://stock-easy-app.vercel.app/docs" external variant="plain">
                  {t('docs')}
                </Button>
                <Button url="https://stock-easy-app.vercel.app/support" external variant="plain">
                  {t('support')}
                </Button>
              </InlineStack>
            </InlineStack>
            
            {/* Language selector */}
            <Box borderBlockStartWidth="025" borderColor="border" paddingBlockStart="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="p" variant="bodySm" tone="subdued">
                  {t('language')}
                </Text>
                <LanguageSelector 
                  currentLanguage={language} 
                  onChangeLanguage={changeLanguage} 
                />
              </InlineStack>
            </Box>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
};
