/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  // Validate required inputs
  if (!params.shopId) {
    throw new Error('shopId is required');
  }

  if (!params.sku) {
    throw new Error('sku is required');
  }

  if (params.newQuantity === undefined || params.newQuantity === null) {
    throw new Error('newQuantity is required');
  }

  if (params.newQuantity < 0) {
    throw new Error('newQuantity must be >= 0');
  }

  // Get the shop to retrieve primaryLocationId if needed
  const shop = await api.shopifyShop.findOne(params.shopId, {
    select: {
      id: true,
      myshopifyDomain: true,
      stockEasyCompanyId: true,
      primaryLocationId: true
    }
  });

  if (!shop) {
    throw new Error(`Shop not found: ${params.shopId}`);
  }

  // Find the product mapping
  const mapping = await api.productMapping.findFirst({
    filter: {
      shopId: { equals: params.shopId },
      stockEasySku: { equals: params.sku }
    },
    select: {
      id: true,
      shopifyInventoryItemId: true,
      shopifyVariantId: true,
      stockEasySku: true,
      productTitle: true,
      variantTitle: true
    }
  });

  if (!mapping) {
    throw new Error(`No product mapping found for SKU "${params.sku}" in shop ${shop.myshopifyDomain}`);
  }

  if (!mapping.shopifyInventoryItemId) {
    throw new Error(`Product mapping exists but shopifyInventoryItemId is missing for SKU "${params.sku}"`);
  }

  // Determine the location
  const locationId = params.locationId || shop.primaryLocationId;

  if (!locationId) {
    throw new Error('No locationId provided and shop has no primaryLocation');
  }

  const startTime = Date.now();

  try {
    await api.enqueue(api.writeToShopify, {
      shopId: params.shopId,
      mutation: `
        mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
          inventorySetQuantities(input: $input) {
            inventoryAdjustmentGroup {
              id
              createdAt
              reason
              changes {
                name
                delta
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          reason: "correction",
          name: "available",
          quantities: [
            {
              inventoryItemId: `gid://shopify/InventoryItem/${mapping.shopifyInventoryItemId}`,
              locationId: `gid://shopify/Location/${locationId}`,
              quantity: params.newQuantity
            }
          ]
        }
      }
    });

    const processingTime = Date.now() - startTime;

    // Log success
    await api.syncLog.create({
      shop: { _link: params.shopId },
      entity: "inventory",
      operation: "update",
      direction: "stockeasy_to_shopify",
      status: "success",
      stockEasySku: params.sku,
      shopifyId: mapping.shopifyInventoryItemId,
      message: `Updated inventory for ${mapping.productTitle} ${mapping.variantTitle ? '- ' + mapping.variantTitle : ''} to ${params.newQuantity}`,
      processingTimeMs: processingTime,
      payload: {
        sku: params.sku,
        inventoryItemId: mapping.shopifyInventoryItemId,
        locationId: locationId,
        newQuantity: params.newQuantity,
        productTitle: mapping.productTitle,
        variantTitle: mapping.variantTitle
      }
    });

    logger.info({
      sku: params.sku,
      shopifyInventoryItemId: mapping.shopifyInventoryItemId,
      newQuantity: params.newQuantity,
      locationId: locationId
    }, 'Shopify inventory updated successfully');

    return {
      success: true,
      sku: params.sku,
      shopifyInventoryItemId: mapping.shopifyInventoryItemId,
      newQuantity: params.newQuantity,
      locationId: locationId,
      productTitle: mapping.productTitle,
      variantTitle: mapping.variantTitle
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;

    // Log error
    await api.syncLog.create({
      shop: { _link: params.shopId },
      entity: "inventory",
      operation: "update",
      direction: "stockeasy_to_shopify",
      status: "error",
      stockEasySku: params.sku,
      shopifyId: mapping.shopifyInventoryItemId,
      message: `Failed to update inventory: ${error.message}`,
      processingTimeMs: processingTime,
      payload: {
        sku: params.sku,
        inventoryItemId: mapping.shopifyInventoryItemId,
        locationId: locationId,
        newQuantity: params.newQuantity,
        error: error.message
      }
    });

    logger.error({
      error: error,
      sku: params.sku,
      shopifyInventoryItemId: mapping.shopifyInventoryItemId
    }, 'Failed to update Shopify inventory');

    throw error;
  }
};

export const params = {
  shopId: { type: "string" },
  sku: { type: "string" },
  newQuantity: { type: "number" },
  locationId: { type: "string" }
};

/** @type { ActionOptions } */
export const options = {
  returnType: true
};
