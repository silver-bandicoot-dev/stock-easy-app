import { useAction, useFindFirst } from "@gadgetinc/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Icon,
  InlineStack,
  Page,
  Spinner,
  Text,
} from "@shopify/polaris";
import { CheckCircleIcon, ClockIcon } from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { api } from "../api";
import { useTranslations } from "../hooks/useTranslations";

// Feature item component - OUTSIDE of BillingPage to prevent recreation on each render
const FeatureItem = ({ text }) => (
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: "8px",
    padding: "5px 0"
  }}>
    <div style={{ 
      color: "#008060",
      display: "flex",
      alignItems: "center",
      flexShrink: 0
    }}>
      <CheckCircleIcon width={16} height={16} />
    </div>
    <Text as="span" variant="bodySm">{text}</Text>
  </div>
);

/**
 * Billing Page - Displays subscription plans and handles subscription management
 */
export function BillingPage() {
  const { t, language } = useTranslations();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if we're in development mode
  const isDevelopment = window.location.hostname.includes("--development") ||
                        window.location.hostname.includes("localhost") ||
                        process.env.NODE_ENV === "development";

  // Get current shop
  const [{ data: shop, fetching: shopLoading }] = useFindFirst(api.shopifyShop, {
    select: {
      id: true,
      domain: true,
      subscriptionStatus: true,
      subscriptionPlan: true,
      trialStartedAt: true,
      trialEndsAt: true,
      billingActivatedAt: true,
    },
  });

  // Actions
  const [{ fetching: createFetching }, createSubscription] = useAction(api.createSubscription);
  const [{ fetching: cancelFetching }, cancelSubscription] = useAction(api.cancelSubscription);

  // Calculate trial info
  const now = new Date();
  const trialEnds = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
  const isInTrial = trialEnds && now < trialEnds && 
    (shop?.subscriptionStatus === "trial" || shop?.subscriptionStatus === "active");
  
  let trialDaysRemaining = 0;
  if (isInTrial && trialEnds) {
    trialDaysRemaining = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const hasActiveSubscription = shop?.subscriptionStatus === "active" || shop?.subscriptionStatus === "trial";
  const isCancelled = shop?.subscriptionStatus === "cancelled";

  // Format date based on language
  const formatDate = useCallback((date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString(language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [language]);

  // Handle subscription creation
  const handleSubscribe = useCallback(async () => {
    if (!shop?.id) return;
    
    setIsSubscribing(true);
    setError(null);
    
    try {
      console.log("Creating subscription for shop:", shop.id);
      const result = await createSubscription({ shopId: shop.id });
      console.log("Subscription result:", result);
      
      // Check for GraphQL/action errors
      if (result.error) {
        console.error("Subscription error from API:", result.error);
        const errorMsg = result.error.message || result.error.toString();
        setError(`${t("billingError")} - ${errorMsg}`);
        return;
      }
      
      if (result.data?.confirmationUrl) {
        // Redirect to Shopify payment page
        console.log("Redirecting to:", result.data.confirmationUrl);
        window.top.location.href = result.data.confirmationUrl;
      } else if (result.data?.alreadySubscribed) {
        // Already subscribed, reload page
        window.location.reload();
      } else {
        console.error("No confirmation URL in result:", result);
        setError(t("billingError"));
      }
    } catch (err) {
      console.error("Subscription catch error:", err);
      setError(err.message || t("billingError"));
    } finally {
      setIsSubscribing(false);
    }
  }, [shop?.id, createSubscription, t]);

  // Handle subscription cancellation
  const handleCancel = useCallback(async () => {
    if (!shop?.id) return;
    if (!window.confirm(t("billingCancelConfirm"))) return;
    
    setIsCancelling(true);
    setError(null);
    
    try {
      await cancelSubscription({ shopId: shop.id });
      window.location.reload();
    } catch (err) {
      console.error("Cancellation error:", err);
      setError(err.message || t("billingError"));
    } finally {
      setIsCancelling(false);
    }
  }, [shop?.id, cancelSubscription, t]);

  if (shopLoading) {
    return (
      <Page>
        <Box padding="800">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <Spinner accessibilityLabel={t("loading")} size="large" />
          </div>
        </Box>
      </Page>
    );
  }

  // Plan features
  const planFeatures = [
    t("billingFeatureUnlimitedSkus"),
    t("billingFeatureRealtimeSync"),
    t("billingFeatureSupplierOrders"),
    t("billingFeatureDashboard"),
    t("billingFeatureAiPredictions"),
    t("billingFeatureAdvancedReports"),
    t("billingFeatureOneLocation"),
  ];

  // Handle dev mode skip
  const handleDevModeSkip = useCallback(() => {
    window.location.href = "/";
  }, []);

  return (
    <Page title={t("billingTitle")}>
      <div style={{ maxWidth: "420px", margin: "0 auto", fontSize: "14px" }}>
        <BlockStack gap="400">
          {/* Dev Mode Banner */}
          {isDevelopment && (
            <Banner tone="warning" title="🔧 Mode Développement">
              <BlockStack gap="200">
                <Text as="p" variant="bodySm">
                  {language === "fr" 
                    ? "Le Billing API nécessite une distribution Shopify configurée. En mode dev, vous pouvez bypasser cette étape."
                    : language === "es"
                      ? "La API de facturación requiere una distribución de Shopify configurada. En modo dev, puede omitir este paso."
                      : "Billing API requires Shopify distribution to be configured. In dev mode, you can bypass this step."
                  }
                </Text>
                <Button onClick={handleDevModeSkip} variant="primary" size="slim">
                  {language === "fr" 
                    ? "Aller au Dashboard (Dev Mode)"
                    : language === "es"
                      ? "Ir al Dashboard (Modo Dev)"
                      : "Go to Dashboard (Dev Mode)"
                  }
                </Button>
              </BlockStack>
            </Banner>
          )}

          {error && (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          {/* Current Subscription Status */}
          {hasActiveSubscription && (
            <Card>
              <BlockStack gap="400">
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <InlineStack gap="200" blockAlign="center">
                      <Text variant="headingMd" as="h2">
                        {isInTrial ? t("billingSubscriptionTrial") : t("billingSubscriptionActive")}
                      </Text>
                      <div style={{
                        background: isInTrial ? "#FFC96B" : "#AEE9D1",
                        color: isInTrial ? "#594208" : "#0D5035",
                        padding: "4px 10px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {t("billingBasicPlan")}
                      </div>
                    </InlineStack>
                    {isInTrial && (
                      <InlineStack gap="200" blockAlign="center">
                        <Icon source={ClockIcon} tone="warning" />
                        <Text tone="subdued" variant="bodySm">
                          {t("billingTrialDaysRemaining", { count: trialDaysRemaining })}
                          {" • "}
                          {t("billingTrialEnds")} {formatDate(trialEnds)}
                        </Text>
                      </InlineStack>
                    )}
                  </BlockStack>
                  <Text variant="headingLg" as="span">
                    {t("billingPrice")}
                  </Text>
                </InlineStack>
                
                <Divider />
                
                <Button 
                  tone="critical" 
                  variant="plain"
                  onClick={handleCancel}
                  loading={isCancelling}
                  disabled={isCancelling}
                >
                  {isCancelling ? t("billingCancelling") : t("billingCancelSubscription")}
                </Button>
              </BlockStack>
            </Card>
          )}

          {/* Cancelled Status */}
          {isCancelled && (
            <Banner tone="warning">
              <Text as="p">{t("billingCancelled")}</Text>
            </Banner>
          )}

          {/* Plan Selection Card */}
          {(!hasActiveSubscription || isCancelled) && (
            <Card>
              <BlockStack gap="400">
                {/* Header */}
                <BlockStack gap="050">
                  <Text variant="headingMd" as="h1" fontWeight="bold">
                    {t("billingBasicPlan")}
                  </Text>
                  <Text tone="subdued" as="p" variant="bodySm">
                    {t("billingEverythingYouNeed")}
                  </Text>
                </BlockStack>

                {/* Price Section */}
                <div style={{ 
                  background: "#F6F6F7", 
                  padding: "14px 16px", 
                  borderRadius: "10px",
                  margin: "0 -12px"
                }}>
                  <BlockStack gap="050">
                    <Text variant="headingLg" as="span" fontWeight="bold">
                      {t("billingPrice")}
                    </Text>
                    <InlineStack gap="150" blockAlign="center">
                      <div style={{ color: "#008060", display: "flex", alignItems: "center" }}>
                        <ClockIcon width={14} height={14} />
                      </div>
                      <Text tone="success" fontWeight="semibold" variant="bodySm">
                        {t("billingTrialDays")}
                      </Text>
                    </InlineStack>
                  </BlockStack>
                </div>

                {/* Features List */}
                <BlockStack gap="0">
                  <Text variant="bodySm" as="h3" fontWeight="semibold">
                    {language === "fr" ? "Inclus" : language === "es" ? "Incluido" : "Included"}
                  </Text>
                  <div style={{ marginTop: "6px" }}>
                    {planFeatures.map((feature, index) => (
                      <FeatureItem key={index} text={feature} />
                    ))}
                  </div>
                </BlockStack>

                <Divider />

                {/* CTA Button */}
                <BlockStack gap="200">
                  <Button
                    variant="primary"
                    size="medium"
                    fullWidth
                    onClick={handleSubscribe}
                    loading={isSubscribing || createFetching}
                    disabled={isSubscribing || createFetching}
                  >
                    {isSubscribing || createFetching 
                      ? t("billingSubscribing") 
                      : isCancelled 
                        ? t("billingResubscribe")
                        : t("billingStartTrial")
                    }
                  </Button>

                  <Text tone="subdued" alignment="center" as="p" variant="bodyXs">
                    {language === "fr" 
                      ? "Pas de frais pendant les 14 jours d'essai" 
                      : language === "es"
                        ? "Sin cargos durante los 14 días de prueba"
                        : "No charges during the 14-day trial"
                    }
                  </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          )}
        </BlockStack>
      </div>
    </Page>
  );
}

export default BillingPage;
