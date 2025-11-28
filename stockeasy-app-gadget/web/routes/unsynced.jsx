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

export const UnsyncedPage = () => {
  const navigate = useNavigate();
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
      shopify.toast.show('🔄 Synchronisation lancée !');
      
      setTimeout(() => {
        loadData();
        setSyncing(false);
      }, 5000);
    } catch (error) {
      shopify.toast.show('Erreur lors de la synchronisation', { isError: true });
      setSyncing(false);
    }
  }, [data.shopId, loadData]);

  // Group items by reason
  const noSkuItems = data.unsyncedItems.filter(i => i.reason === 'no_sku');
  const notTrackedItems = data.unsyncedItems.filter(i => i.reason === 'not_tracked');
  const notSyncedItems = data.unsyncedItems.filter(i => i.reason === 'not_synced');

  // Build tabs
  const tabs = [];
  if (noSkuItems.length > 0) {
    tabs.push({
      id: 'no-sku',
      content: `Sans SKU (${noSkuItems.length})`,
      items: noSkuItems,
      icon: '❌',
      solution: 'Ajoutez un SKU unique à chaque variante dans Shopify → Produits → [Produit] → Variantes',
      tone: 'critical'
    });
  }
  if (notTrackedItems.length > 0) {
    tabs.push({
      id: 'not-tracked',
      content: `Non suivi (${notTrackedItems.length})`,
      items: notTrackedItems,
      icon: '📦',
      solution: 'Activez le suivi d\'inventaire dans Shopify → Produits → [Produit] → Inventaire → "Suivre la quantité"',
      tone: 'warning'
    });
  }
  if (notSyncedItems.length > 0) {
    tabs.push({
      id: 'not-synced',
      content: `À synchroniser (${notSyncedItems.length})`,
      items: notSyncedItems,
      icon: '⏳',
      solution: 'Ces produits ont un SKU valide. Cliquez sur "Synchroniser" pour les importer dans Stockeasy.',
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
            <Text as="p">Chargement...</Text>
          </BlockStack>
        </Card>
      </Page>
    );
  }

  return (
    <Page
      backAction={{ content: 'Retour', onAction: () => navigate('/') }}
      title="Produits non synchronisés"
      subtitle={`${unsyncedCount} produit(s) à vérifier`}
      primaryAction={{
        content: 'Synchroniser maintenant',
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
                SKUs synchronisés
              </Text>
            </BlockStack>
            
            <Box background="border" minWidth="1px" minHeight="50px" />
            
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="heading2xl" fontWeight="bold" tone="critical">
                {unsyncedCount}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                À vérifier
              </Text>
            </BlockStack>
            
            <Box background="border" minWidth="1px" minHeight="50px" />
            
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="heading2xl" fontWeight="bold">
                {data.totalShopifySkus}
              </Text>
              <Text as="p" tone="subdued" variant="bodySm">
                Total Shopify
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
                          💡 Comment résoudre
                        </Text>
                        <Text as="p" variant="bodySm">
                          {currentTab.solution}
                        </Text>
                      </BlockStack>
                    </Banner>
                    
                    {/* Product list */}
                    <BlockStack gap="300">
                      <Text as="h3" variant="headingSm">
                        {currentTab.items.length} produit(s)
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
                                  <Text as="span" variant="bodySm" tone="subdued">Variante :</Text>
                                  <Text as="span" variant="bodySm">{item.variantTitle}</Text>
                                </InlineStack>
                              )}
                              {item.sku ? (
                                <InlineStack gap="200">
                                  <Text as="span" variant="bodySm" tone="subdued">SKU :</Text>
                                  <Badge>{item.sku}</Badge>
                                </InlineStack>
                              ) : (
                                <Badge tone="critical">Aucun SKU</Badge>
                              )}
                              <InlineStack gap="200">
                                <Text as="span" variant="bodySm" tone="subdued">Statut :</Text>
                                <Badge tone={item.status === 'active' ? 'success' : 'info'}>
                                  {item.status === 'active' ? 'Actif' : item.status === 'draft' ? 'Brouillon' : item.status}
                                </Badge>
                              </InlineStack>
                            </BlockStack>
                            <Button
                              url={`shopify://admin/products`}
                              external
                            >
                              Modifier dans Shopify
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
                🎉 Tous vos produits sont synchronisés avec Stockeasy !
              </Text>
            </Banner>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
};


