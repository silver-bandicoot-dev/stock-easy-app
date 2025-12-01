import { useState, useCallback } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  Icon,
  RadioButton,
  Spinner,
  Banner
} from "@shopify/polaris";
import { LocationIcon, CheckIcon } from '@shopify/polaris-icons';
import { useTranslations } from "../hooks/useTranslations";

/**
 * LocationSelector - Composant pour sélectionner un emplacement/entrepôt
 * 
 * Comportement :
 * - Si 1 seul emplacement actif → sélection automatique (appelé via callback)
 * - Si plusieurs emplacements → affiche l'UI de sélection
 */
export const LocationSelector = ({ 
  locations, 
  selectedLocationId, 
  onSelectLocation, 
  loading,
  onConfirm
}) => {
  const { t } = useTranslations();
  const [localSelected, setLocalSelected] = useState(selectedLocationId);

  // Filtrer uniquement les emplacements actifs
  const activeLocations = (locations || []).filter(loc => loc.active);

  const handleSelect = useCallback((locationId) => {
    setLocalSelected(locationId);
  }, []);

  const handleConfirm = useCallback(() => {
    if (localSelected && onConfirm) {
      onConfirm(localSelected);
    }
  }, [localSelected, onConfirm]);

  // Loading state
  if (loading) {
    return (
      <Card>
        <BlockStack gap="400" inlineAlign="center">
          <Spinner size="large" />
          <Text as="p" tone="subdued">{t('loadingLocations')}</Text>
        </BlockStack>
      </Card>
    );
  }

  // Pas d'emplacements trouvés
  if (!activeLocations || activeLocations.length === 0) {
    return (
      <Card>
        <Banner tone="warning">
          <Text as="p">{t('noLocationsFound')}</Text>
        </Banner>
      </Card>
    );
  }

  // Un seul emplacement → pas besoin de UI, auto-select est géré par le parent
  // Mais on affiche quand même une confirmation
  if (activeLocations.length === 1) {
    const singleLocation = activeLocations[0];
    return (
      <Card>
        <BlockStack gap="400">
          <InlineStack gap="300" blockAlign="center">
            <Box
              background="bg-fill-success-secondary"
              borderRadius="full"
              padding="200"
            >
              <Icon source={LocationIcon} tone="success" />
            </Box>
            <BlockStack gap="100">
              <Text as="h2" variant="headingMd">{t('singleLocationDetected')}</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {t('singleLocationInfo')}
              </Text>
            </BlockStack>
          </InlineStack>

          <Box background="bg-surface-secondary" borderRadius="200" padding="400">
            <InlineStack align="space-between" blockAlign="center">
              <InlineStack gap="200" blockAlign="center">
                <Icon source={CheckIcon} tone="success" />
                <BlockStack gap="050">
                  <Text as="p" variant="bodyMd" fontWeight="semibold">
                    {singleLocation.name}
                  </Text>
                  {singleLocation.address1 && (
                    <Text as="p" variant="bodySm" tone="subdued">
                      {singleLocation.address1}{singleLocation.city ? `, ${singleLocation.city}` : ''}
                    </Text>
                  )}
                </BlockStack>
              </InlineStack>
            </InlineStack>
          </Box>

          <Button
            variant="primary"
            size="large"
            onClick={() => onConfirm && onConfirm(singleLocation.id)}
            fullWidth
          >
            {t('confirmAndConnect')}
          </Button>
        </BlockStack>
      </Card>
    );
  }

  // Plusieurs emplacements → afficher la sélection
  return (
    <Card>
      <BlockStack gap="500">
        {/* Header */}
        <BlockStack gap="200">
          <InlineStack gap="200" blockAlign="center">
            <Icon source={LocationIcon} />
            <Text as="h2" variant="headingMd">{t('selectLocation')}</Text>
          </InlineStack>
          <Text as="p" variant="bodySm" tone="subdued">
            {t('selectLocationDescription')}
          </Text>
        </BlockStack>

        {/* Liste des emplacements */}
        <BlockStack gap="200">
          {activeLocations.map((location) => (
            <div
              key={location.id}
              onClick={() => handleSelect(location.id)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: localSelected === location.id 
                  ? '2px solid #000' 
                  : '1px solid #e1e3e5',
                backgroundColor: localSelected === location.id 
                  ? '#f6f6f7' 
                  : '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <InlineStack align="space-between" blockAlign="center">
                <InlineStack gap="300" blockAlign="center">
                  <RadioButton
                    label=""
                    checked={localSelected === location.id}
                    onChange={() => handleSelect(location.id)}
                  />
                  <BlockStack gap="050">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      {location.name}
                    </Text>
                    {location.address1 && (
                      <Text as="p" variant="bodySm" tone="subdued">
                        {location.address1}
                        {location.city ? `, ${location.city}` : ''}
                        {location.country ? ` - ${location.country}` : ''}
                      </Text>
                    )}
                  </BlockStack>
                </InlineStack>
                {localSelected === location.id && (
                  <Icon source={CheckIcon} tone="success" />
                )}
              </InlineStack>
            </div>
          ))}
        </BlockStack>

        {/* Info sur le plan Basic */}
        <Banner tone="info">
          <Text as="p" variant="bodySm">
            {t('basicPlanInfo')}
          </Text>
        </Banner>

        {/* Bouton de confirmation */}
        <Button
          variant="primary"
          size="large"
          onClick={handleConfirm}
          disabled={!localSelected}
          fullWidth
        >
          {t('confirmSelection')}
        </Button>
      </BlockStack>
    </Card>
  );
};

export default LocationSelector;

