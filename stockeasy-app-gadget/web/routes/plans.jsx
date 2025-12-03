import { useAction, useFindFirst } from "@gadgetinc/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Divider,
  Icon,
  InlineGrid,
  InlineStack,
  Page,
  ProgressBar,
  Spinner,
  Text,
} from "@shopify/polaris";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  AlertCircleIcon,
  StarFilledIcon,
  LockIcon
} from "@shopify/polaris-icons";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useTranslations } from "../hooks/useTranslations";

/**
 * Plans Page - Manage subscription and view available plans
 */
export function PlansPage() {
  const { t, language } = useTranslations();
  const navigate = useNavigate();
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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
  const [{ fetching: cancelFetching }, cancelSubscription] = useAction(api.cancelSubscription);

  // Calculate trial info
  const now = new Date();
  const trialEnds = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
  const trialStarts = shop?.trialStartedAt ? new Date(shop.trialStartedAt) : null;
  const isInTrial = trialEnds && now < trialEnds && 
    (shop?.subscriptionStatus === "trial" || shop?.subscriptionStatus === "active");
  
  let trialDaysRemaining = 0;
  let trialProgress = 0;
  if (isInTrial && trialEnds && trialStarts) {
    trialDaysRemaining = Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const totalTrialDays = 14;
    const daysUsed = totalTrialDays - trialDaysRemaining;
    trialProgress = (daysUsed / totalTrialDays) * 100;
  }

  const hasActiveSubscription = shop?.subscriptionStatus === "active" || shop?.subscriptionStatus === "trial";
  const isCancelled = shop?.subscriptionStatus === "cancelled";
  const isPending = shop?.subscriptionStatus === "pending";

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

  // Handle subscription cancellation
  const handleCancel = useCallback(async () => {
    if (!shop?.id) return;
    
    const confirmMessage = language === "fr" 
      ? "Êtes-vous sûr de vouloir annuler votre abonnement ? Vous perdrez l'accès à toutes les fonctionnalités à la fin de la période de facturation."
      : language === "es"
        ? "¿Está seguro de que desea cancelar su suscripción? Perderá el acceso a todas las funciones al final del período de facturación."
        : "Are you sure you want to cancel your subscription? You will lose access to all features at the end of the billing period.";
    
    if (!window.confirm(confirmMessage)) return;
    
    setIsCancelling(true);
    setError(null);
    
    try {
      await cancelSubscription({ shopId: shop.id });
      setSuccess(language === "fr" 
        ? "Abonnement annulé avec succès" 
        : language === "es" 
          ? "Suscripción cancelada con éxito"
          : "Subscription cancelled successfully");
      // Reload after a short delay to show success message
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error("Cancellation error:", err);
      setError(err.message || t("billingError"));
    } finally {
      setIsCancelling(false);
    }
  }, [shop?.id, cancelSubscription, language, t]);

  // Handle resubscribe
  const handleResubscribe = useCallback(() => {
    navigate("/billing");
  }, [navigate]);

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

  // Labels based on language
  const labels = {
    pageTitle: language === "fr" ? "Gestion du plan" : language === "es" ? "Gestión del plan" : "Plan Management",
    currentPlan: language === "fr" ? "Votre plan actuel" : language === "es" ? "Su plan actual" : "Your current plan",
    trialPeriod: language === "fr" ? "Période d'essai" : language === "es" ? "Período de prueba" : "Trial period",
    daysRemaining: language === "fr" ? "jours restants" : language === "es" ? "días restantes" : "days remaining",
    endsOn: language === "fr" ? "Se termine le" : language === "es" ? "Termina el" : "Ends on",
    activeSubscription: language === "fr" ? "Abonnement actif" : language === "es" ? "Suscripción activa" : "Active subscription",
    cancelledSubscription: language === "fr" ? "Abonnement annulé" : language === "es" ? "Suscripción cancelada" : "Subscription cancelled",
    cancelSubscription: language === "fr" ? "Annuler l'abonnement" : language === "es" ? "Cancelar suscripción" : "Cancel subscription",
    resubscribe: language === "fr" ? "Se réabonner" : language === "es" ? "Volver a suscribirse" : "Resubscribe",
    availablePlans: language === "fr" ? "Plans disponibles" : language === "es" ? "Planes disponibles" : "Available plans",
    comingSoon: language === "fr" ? "Bientôt disponible" : language === "es" ? "Próximamente" : "Coming soon",
    current: language === "fr" ? "Actuel" : language === "es" ? "Actual" : "Current",
    perMonth: language === "fr" ? "/mois" : language === "es" ? "/mes" : "/month",
    locations: language === "fr" ? "emplacement(s)" : language === "es" ? "ubicación(es)" : "location(s)",
    allFeatures: language === "fr" ? "Toutes les fonctionnalités" : language === "es" ? "Todas las características" : "All features",
    plusFeatures: language === "fr" ? "+ fonctionnalités avancées" : language === "es" ? "+ características avanzadas" : "+ advanced features",
    cancelling: language === "fr" ? "Annulation..." : language === "es" ? "Cancelando..." : "Cancelling...",
    noActiveSubscription: language === "fr" ? "Pas d'abonnement actif" : language === "es" ? "Sin suscripción activa" : "No active subscription",
    subscribeNow: language === "fr" ? "Souscrire maintenant" : language === "es" ? "Suscribirse ahora" : "Subscribe now",
  };

  // Plan data for display
  const plans = [
    {
      name: "Basic",
      price: "29$",
      locations: 1,
      isCurrent: shop?.subscriptionPlan === "basic" && hasActiveSubscription,
      isAvailable: true,
      features: [
        language === "fr" ? "SKUs illimités" : language === "es" ? "SKUs ilimitados" : "Unlimited SKUs",
        language === "fr" ? "Sync temps réel" : language === "es" ? "Sincronización en tiempo real" : "Real-time sync",
        language === "fr" ? "Dashboard complet" : language === "es" ? "Dashboard completo" : "Complete dashboard",
      ]
    },
    {
      name: "Pro",
      price: "79$",
      locations: 3,
      isCurrent: shop?.subscriptionPlan === "pro" && hasActiveSubscription,
      isAvailable: false,
      features: [
        labels.allFeatures + " Basic",
        language === "fr" ? "3 emplacements" : language === "es" ? "3 ubicaciones" : "3 locations",
        language === "fr" ? "Support prioritaire" : language === "es" ? "Soporte prioritario" : "Priority support",
      ]
    },
    {
      name: "Plus",
      price: "199$",
      locations: 15,
      isCurrent: shop?.subscriptionPlan === "plus" && hasActiveSubscription,
      isAvailable: false,
      features: [
        labels.allFeatures + " Pro",
        language === "fr" ? "15 emplacements" : language === "es" ? "15 ubicaciones" : "15 locations",
        language === "fr" ? "API dédiée" : language === "es" ? "API dedicada" : "Dedicated API",
      ]
    }
  ];

  return (
    <Page title={labels.pageTitle}>
      <div style={{ maxWidth: "800px", margin: "0 auto", fontSize: "13px" }}>
      <BlockStack gap="400">
        {/* Alerts */}
        {error && (
          <Banner tone="critical" onDismiss={() => setError(null)}>
            {error}
          </Banner>
        )}
        {success && (
          <Banner tone="success" onDismiss={() => setSuccess(null)}>
            {success}
          </Banner>
        )}

        {/* Current Plan Status Card */}
        <Card>
          <BlockStack gap="300">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingSm" as="h2">{labels.currentPlan}</Text>
              {hasActiveSubscription && (
                <Badge tone={isInTrial ? "warning" : "success"}>
                  {isInTrial ? labels.trialPeriod : labels.activeSubscription}
                </Badge>
              )}
              {isCancelled && (
                <Badge tone="critical">{labels.cancelledSubscription}</Badge>
              )}
              {isPending && (
                <Badge tone="attention">{language === "fr" ? "En attente" : "Pending"}</Badge>
              )}
            </InlineStack>

            {/* Active subscription info */}
            {hasActiveSubscription && (
              <>
                <InlineStack gap="300" blockAlign="center">
                  <div style={{
                    background: "#008060",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontWeight: "600",
                    fontSize: "14px"
                  }}>
                    Basic
                  </div>
                  <BlockStack gap="050">
                    <Text variant="headingSm" as="span" fontWeight="bold">29${labels.perMonth}</Text>
                    <Text tone="subdued" variant="bodyXs">1 {labels.locations}</Text>
                  </BlockStack>
                </InlineStack>

                {/* Trial progress */}
                {isInTrial && (
                  <Box background="bg-surface-secondary" padding="300" borderRadius="200">
                    <BlockStack gap="200">
                      <InlineStack align="space-between">
                        <InlineStack gap="150" blockAlign="center">
                          <Icon source={ClockIcon} tone="warning" />
                          <Text fontWeight="semibold" variant="bodySm">{labels.trialPeriod}</Text>
                        </InlineStack>
                        <Text tone="subdued" variant="bodySm">{trialDaysRemaining} {labels.daysRemaining}</Text>
                      </InlineStack>
                      <ProgressBar progress={trialProgress} tone="warning" size="small" />
                      <Text tone="subdued" variant="bodyXs">
                        {labels.endsOn} {formatDate(trialEnds)}
                      </Text>
                    </BlockStack>
                  </Box>
                )}

                <Divider />

                {/* Cancel button */}
                <InlineStack align="end">
                  <Button 
                    tone="critical" 
                    variant="plain"
                    onClick={handleCancel}
                    loading={isCancelling}
                    disabled={isCancelling}
                  >
                    {isCancelling ? labels.cancelling : labels.cancelSubscription}
                  </Button>
                </InlineStack>
              </>
            )}

            {/* Cancelled state */}
            {isCancelled && (
              <>
                <Box background="bg-surface-critical" padding="400" borderRadius="200">
                  <InlineStack gap="300" blockAlign="center">
                    <Icon source={AlertCircleIcon} tone="critical" />
                    <Text>
                      {language === "fr" 
                        ? "Votre abonnement a été annulé. Réabonnez-vous pour continuer à utiliser Stockeasy."
                        : language === "es"
                          ? "Su suscripción ha sido cancelada. Vuelva a suscribirse para seguir usando Stockeasy."
                          : "Your subscription has been cancelled. Resubscribe to continue using Stockeasy."}
                    </Text>
                  </InlineStack>
                </Box>
                <Button variant="primary" onClick={handleResubscribe} fullWidth>
                  {labels.resubscribe}
                </Button>
              </>
            )}

            {/* No subscription state */}
            {(isPending || (!hasActiveSubscription && !isCancelled)) && (
              <>
                <Box background="bg-surface-secondary" padding="400" borderRadius="200">
                  <Text tone="subdued">{labels.noActiveSubscription}</Text>
                </Box>
                <Button variant="primary" onClick={handleResubscribe} fullWidth>
                  {labels.subscribeNow}
                </Button>
              </>
            )}
          </BlockStack>
        </Card>

        {/* Available Plans */}
        <BlockStack gap="300">
          <Text variant="headingSm" as="h2">{labels.availablePlans}</Text>
          
          <InlineGrid columns={{ xs: 1, sm: 1, md: 3 }} gap="300">
            {plans.map((plan) => (
              <Card key={plan.name}>
                <BlockStack gap="300">
                  {/* Plan header */}
                  <InlineStack align="space-between" blockAlign="center">
                    <Text variant="headingSm" as="h3" fontWeight="bold">{plan.name}</Text>
                    {plan.isCurrent && (
                      <Badge tone="success" size="small">
                        {labels.current}
                      </Badge>
                    )}
                    {!plan.isAvailable && !plan.isCurrent && (
                      <Badge tone="info" size="small">{labels.comingSoon}</Badge>
                    )}
                  </InlineStack>

                  {/* Price */}
                  <BlockStack gap="050">
                    <InlineStack gap="100" blockAlign="end">
                      <Text variant="headingLg" as="span" fontWeight="bold">
                        {plan.price}
                      </Text>
                      <Text tone="subdued" variant="bodySm">{labels.perMonth}</Text>
                    </InlineStack>
                    <Text tone="subdued" variant="bodyXs">
                      {plan.locations} {labels.locations}
                    </Text>
                  </BlockStack>

                  <Divider />

                  {/* Features */}
                  <BlockStack gap="150">
                    {plan.features.map((feature, idx) => (
                      <InlineStack key={idx} gap="150" blockAlign="center">
                        <div style={{ color: plan.isAvailable ? "#008060" : "#8C9196" }}>
                          <CheckCircleIcon width={14} height={14} />
                        </div>
                        <Text variant="bodyXs" tone={plan.isAvailable ? undefined : "subdued"}>
                          {feature}
                        </Text>
                      </InlineStack>
                    ))}
                  </BlockStack>

                  {/* Action button */}
                  {!plan.isAvailable && !plan.isCurrent && (
                    <Button disabled fullWidth size="slim">
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={LockIcon} />
                        {labels.comingSoon}
                      </InlineStack>
                    </Button>
                  )}
                  {plan.isCurrent && (
                    <Button disabled fullWidth size="slim" tone="success">
                      <InlineStack gap="100" blockAlign="center">
                        <Icon source={StarFilledIcon} />
                        {labels.current}
                      </InlineStack>
                    </Button>
                  )}
                  {plan.isAvailable && !plan.isCurrent && (
                    <Button variant="primary" onClick={handleResubscribe} fullWidth size="slim">
                      {labels.subscribeNow}
                    </Button>
                  )}
                </BlockStack>
              </Card>
            ))}
          </InlineGrid>
        </BlockStack>
      </BlockStack>
      </div>
    </Page>
  );
}

export default PlansPage;

