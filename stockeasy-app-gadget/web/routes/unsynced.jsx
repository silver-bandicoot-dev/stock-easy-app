import { useAction } from "@gadgetinc/react";
import { api } from "../api";
import {
  Page,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Spinner,
  Banner,
  Tabs,
  Badge,
  Divider
} from "@shopify/polaris";
import {
  ArrowLeftIcon,
  RefreshIcon
} from '@shopify/polaris-icons';
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { useTranslations } from "../hooks/useTranslations";

export const UnsyncedPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslations();
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [data, setData] = useState({
    unsyncedItems: [],
    unsyncedCount: 0,
    syncedSkus: 0,
    totalShopifySkus: 0
  });

  const [, getSupabaseStats] = useAction(api.getSupabaseStats);

  // Get shopId from URL or session
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Get shop from Gadget
      const shops = await api.shopifyShop.findMany({ first: 1 });
      const shop = shops[0];
      
      if (shop?.id) {
        const result = await getSupabaseStats({ shopId: shop.id });
        if (result?.data?.success) {
          setData({
            shopId: shop.id,
            unsyncedItems: result.data.unsyncedItems || [],
            unsyncedCount: result.data.unsyncedCount || 0,
            syncedSkus: result.data.syncedSkus || 0,
            totalShopifySkus: result.data.totalShopifySkus || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, [getSupabaseStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle sync
  const handleSync = useCallback(async () => {
    if (!data.shopId) return;
    
    setSyncing(true);
    try {
      await api.enqueue(api.syncShopifyProducts, { shopId: data.shopId });
      shopify.toast.show(t('syncStarted'));
      
      setTimeout(() => {
        loadData();
        setSyncing(false);
      }, 5000);
    } catch (error) {
      shopify.toast.show(t('syncError'), { isError: true });
      setSyncing(false);
    }
  }, [data.shopId, loadData, t]);

  // Group items by reason
  const noSkuItems = data.unsyncedItems.filter(i => i.reason === 'no_sku');
  const notTrackedItems = data.unsyncedItems.filter(i => i.reason === 'not_tracked');
  const notSyncedItems = data.unsyncedItems.filter(i => i.reason === 'not_synced');

  // Build tabs
  const tabs = [];
  if (noSkuItems.length > 0) {
    tabs.push({
      id: 'no-sku',
      content: `${t('withoutSku')} (${noSkuItems.length})`,
      items: noSkuItems,
      icon: '❌',
      solution: t('solutionNoSku'),
      tone: 'critical'
    });
  }
  if (notTrackedItems.length > 0) {
    tabs.push({
      id: 'not-tracked',
      content: `${t('notTrackedTab')} (${notTrackedItems.length})`,
      items: notTrackedItems,
      icon: '📦',
      solution: t('solutionNotTracked'),
      tone: 'warning'
    });
  }
  if (notSyncedItems.length > 0) {
    tabs.push({
      id: 'not-synced',
      content: `${t('toSyncTab')} (${notSyncedItems.length})`,
      items: notSyncedItems,
      icon: '⏳',
      solution: t('solutionToSync'),
      tone: 'info'
    });
  }

  const currentTab = tabs[selectedTab] || tabs[0];
  const unsyncedCount = data.unsyncedCount || data.unsyncedItems.length;

  if (loading) {
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

  return (
    <Page
      backAction={{ content: t('back'), onAction: () => navigate('/') }}
      title={t('unsyncedProducts')}
      subtitle={t('productsToVerify', { count: unsyncedCount })}
      primaryAction={{
        content: t('syncNow'),
        icon: RefreshIcon,
        loading: syncing,
        onAction: handleSync
      }}
    >
      <BlockStack gap="500">
        {/* Stats summary */}
        <Card>
          <InlineStack gap="800" align="space-around">
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="heading2xl" fontWeight="bold" tone="success">
                {data.syncedSkus}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                {t('syncedSkus')}
              </Text>
            </BlockStack>
            
            <Box background="border" minWidth="1px" minHeight="50px" />
            
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="heading2xl" fontWeight="bold" tone="critical">
                {unsyncedCount}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                {t('toVerify')}
              </Text>
            </BlockStack>
            
            <Box background="border" minWidth="1px" minHeight="50px" />
            
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="heading2xl" fontWeight="bold">
                {data.totalShopifySkus}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                {t('totalShopify')}
              </Text>
            </BlockStack>
          </InlineStack>
        </Card>

        {/* Issue breakdown */}
        {unsyncedCount > 0 ? (
          <Card padding="0">
            <BlockStack gap="0">
              {/* Tabs */}
              <Box padding="400" paddingBlockEnd="0">
                <Tabs
                  tabs={tabs.map((tab) => ({
                    id: tab.id,
                    content: tab.content,
                    accessibilityLabel: tab.content,
                    panelID: `${tab.id}-panel`
                  }))}
                  selected={selectedTab}
                  onSelect={setSelectedTab}
                />
              </Box>
              
              <Divider />
              
              {/* Tab Content */}
              {currentTab && (
                <Box padding="400">
                  <BlockStack gap="400">
                    {/* Solution banner */}
                    <Banner 
                      tone={currentTab.tone === 'critical' ? 'critical' : currentTab.tone === 'warning' ? 'warning' : 'info'}
                    >
                      <BlockStack gap="200">
                        <Text as="p" variant="bodyMd" fontWeight="semibold">
                          {t('howToSolve')}
                        </Text>
                        <Text as="p" variant="bodySm">
                          {currentTab.solution}
                        </Text>
                      </BlockStack>
                    </Banner>
                    
                    {/* Product list */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">
                        {currentTab.items.length} {t('products')}
                      </Text>
                      
                      {currentTab.items.map((item, idx) => (
                        <Box 
                          key={idx}
                          padding="400" 
                          background="bg-surface-secondary" 
                          borderRadius="200"
                        >
                          <InlineStack align="space-between" blockAlign="start" wrap={false}>
                            <BlockStack gap="100">
                              <Text as="p" variant="bodyMd" fontWeight="semibold">
                                {item.productTitle}
                              </Text>
                              {item.variantTitle && (
                                <InlineStack gap="200">
                                  <Text as="span" variant="bodySm" tone="subdued">{t('variant')} :</Text>
                                  <Text as="span" variant="bodySm">{item.variantTitle}</Text>
                                </InlineStack>
                              )}
                              {item.sku ? (
                                <InlineStack gap="200">
                                  <Text as="span" variant="bodySm" tone="subdued">{t('sku')} :</Text>
                                  <Badge>{item.sku}</Badge>
                                </InlineStack>
                              ) : (
                                <Badge tone="critical">{t('noSkuBadge')}</Badge>
                              )}
                              <InlineStack gap="200">
                                <Text as="span" variant="bodySm" tone="subdued">{t('status')} :</Text>
                                <Badge tone={item.status === 'active' ? 'success' : 'info'}>
                                  {item.status === 'active' ? t('active') : item.status === 'draft' ? t('draft') : item.status}
                                </Badge>
                              </InlineStack>
                            </BlockStack>
                            <Button
                              url={`shopify://admin/products`}
                              external
                            >
                              {t('editInShopify')}
                            </Button>
                          </InlineStack>
                        </Box>
                      ))}
                    </BlockStack>
                  </BlockStack>
                </Box>
              )}
            </BlockStack>
          </Card>
        ) : (
          <Card>
            <Banner tone="success">
              <Text as="p">
                {t('allProductsSynced')}
              </Text>
            </Banner>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
};


