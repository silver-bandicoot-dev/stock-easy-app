/**
 * Récupère les emplacements/entrepôts actifs d'une boutique Shopify
 * Utilisé pour la sélection d'emplacement lors de la connexion
 */
export const run = async ({ params, logger, api, connections }) => {
  const { shopId } = params;
  
  logger.info({ shopId }, '📍 Getting shop locations');
  
  if (!shopId) {
    return { success: false, message: 'shopId is required', locations: [] };
  }

  try {
    // Récupérer les emplacements depuis la base Gadget (synchronisés depuis Shopify)
    // Note: Pour les relations belongsTo, on filtre par shop.id
    const locations = await api.shopifyLocation.findMany({
      filter: {
        shop: { 
          id: { equals: shopId } 
        }
      },
      select: {
        id: true,
        name: true,
        active: true,
        address1: true,
        address2: true,
        city: true,
        province: true,
        provinceCode: true,
        country: true,
        countryCode: true,
        zipCode: true,
        phone: true,
        fulfillsOnlineOrders: true,
        hasActiveInventory: true
      }
      // Note: sort removed as 'name' is not indexed for sorting in shopifyLocation
    });

    // Filtrer uniquement les emplacements actifs et trier par nom côté JS
    const activeLocations = locations
      .filter(loc => loc.active)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    logger.info({ 
      total: locations.length, 
      active: activeLocations.length 
    }, '✅ Locations retrieved');

    return {
      success: true,
      locations: activeLocations,
      totalLocations: locations.length,
      activeLocations: activeLocations.length
    };

  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to get locations');
    return { 
      success: false, 
      message: error.message, 
      locations: [] 
    };
  }
};

export const params = {
  shopId: { type: "string" }
};

