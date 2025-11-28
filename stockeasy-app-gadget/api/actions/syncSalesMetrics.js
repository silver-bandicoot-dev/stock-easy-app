/** @type { ActionRun } */
export const run = async ({ params, logger, api, config }) => {
  // 1. Load the shop
  const shop = await api.shopifyShop.findOne(params.shopId);
  if (!shop.stockEasyCompanyId) {
    throw new Error("Shop has no stockEasyCompanyId");
  }

  // 2. Calculate date ranges
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  // 3. Fetch all order line items from last 30 days
  const recentLineItems = await api.shopifyOrderLineItem.findMany({
    filter: {
      shopId: { equals: params.shopId },
      createdAt: { greaterThan: thirtyDaysAgo }
    },
    select: {
      id: true,
      sku: true,
      quantity: true,
      createdAt: true
    }
  });

  // 4. Group by SKU and calculate metrics
  const metricsBySku = {};

  for (const lineItem of recentLineItems) {
    if (!lineItem.sku) continue;
    
    if (!metricsBySku[lineItem.sku]) {
      metricsBySku[lineItem.sku] = {
        derniere_vente: lineItem.createdAt,
        ventes_totales_30j: 0
      };
    }
    
    // Update derniere_vente if this sale is more recent
    if (new Date(lineItem.createdAt) > new Date(metricsBySku[lineItem.sku].derniere_vente)) {
      metricsBySku[lineItem.sku].derniere_vente = lineItem.createdAt;
    }
    
    // Sum quantities
    metricsBySku[lineItem.sku].ventes_totales_30j += lineItem.quantity;
  }

  // 5. Update each product in Supabase
  let errorCount = 0;
  for (const [sku, metrics] of Object.entries(metricsBySku)) {
    const supabaseData = {
      derniere_vente: metrics.derniere_vente,
      ventes_totales_30j: metrics.ventes_totales_30j
    };
    
    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/produits?sku=eq.${encodeURIComponent(sku)}&company_id=eq.${shop.stockEasyCompanyId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': config.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify(supabaseData)
      }
    );
    
    if (!response.ok) {
      errorCount++;
      logger.error({ sku, error: await response.text() }, "Failed to update sales metrics");
    }
  }

  // 6. Return summary
  return {
    success: true,
    productsUpdated: Object.keys(metricsBySku).length,
    totalLineItems: recentLineItems.length,
    errorCount
  };
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true
  }
};

export const params = {
  shopId: {
    type: "string"
  }
};
