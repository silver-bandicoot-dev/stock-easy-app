import { RouteHandler } from "gadget-server";

/**
 * Route handler to update Shopify inventory from Stockeasy
 * @type {RouteHandler<{ Body: { company_id: string; updates: Array<{ sku: string; stock_actuel: number }> } }>}
 */
const route = async ({ request, reply, api, logger, config }) => {
  const startTime = Date.now();

  // Set CORS headers manually (route.options.cors doesn't work reliably)
  const allowedOrigins = [
    'https://stockeasy.app',
    'https://www.stockeasy.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
  }
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');

  try {
    // 1. Authenticate the request
    const authHeader = request.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '');

    if (!apiKey || apiKey !== config.STOCKEASY_INTERNAL_API_KEY) {
      logger.warn({ authHeader }, 'Unauthorized access attempt to update-shopify-inventory');
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // 2. Extract and validate request body
    const { company_id, updates } = request.body;

    if (!company_id) {
      return reply.code(400).send({ error: 'company_id is required' });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return reply.code(400).send({ error: 'updates must be a non-empty array' });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.sku || typeof update.sku !== 'string') {
        return reply.code(400).send({ error: 'Each update must have a sku (string)' });
      }
      if (typeof update.stock_actuel !== 'number' || update.stock_actuel < 0) {
        return reply.code(400).send({ error: 'Each update must have a stock_actuel (number >= 0)' });
      }
    }

    logger.info({ company_id, updateCount: updates.length }, 'Processing inventory updates from Stockeasy');

    // 3. Find the shop by company_id
    const shop = await api.shopifyShop.findFirst({
      filter: { stockEasyCompanyId: { equals: company_id } },
      select: { id: true, domain: true }
    });

    if (!shop) {
      logger.warn({ company_id }, 'Shop not found for company_id');
      return reply.code(404).send({ error: 'Shop not found for company_id' });
    }

    // 4. Get the primary location for inventory updates
    const locations = await api.shopifyLocation.findMany({
      filter: { shopId: { equals: shop.id } },
      select: { id: true },
      first: 1
    });

    const locationId = locations[0]?.id;

    if (!locationId) {
      logger.error({ shopId: shop.id }, 'No location found for shop');
      return reply.code(500).send({ error: 'No location found for shop' });
    }

    // 5. Process each update
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const update of updates) {
      const { sku, stock_actuel } = update;
      const updateStartTime = Date.now();

      try {
        // a. Find productMapping by SKU
        const mapping = await api.productMapping.findFirst({
          filter: {
            shopId: { equals: shop.id },
            stockEasySku: { equals: sku }
          },
          select: {
            shopifyInventoryItemId: true,
            shopifyVariantId: true
          }
        });

        // b. If mapping not found, skip and log
        if (!mapping || !mapping.shopifyInventoryItemId) {
          logger.warn({ sku, shopId: shop.id }, 'Product mapping not found for SKU');
          skippedCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'skipped',
            shop: { _link: shop.id },
            stockEasySku: sku,
            message: `No mapping found for SKU: ${sku}`,
            processingTimeMs: Date.now() - updateStartTime
          });

          continue;
        }

        // c. Update inventory in Shopify using writeToShopify global action
        const result = await api.writeToShopify({
          shopId: shop.id,
          mutation: `
            mutation inventorySetQuantities($input: InventorySetQuantitiesInput!) {
              inventorySetQuantities(input: $input) {
                userErrors {
                  field
                  message
                }
                inventoryAdjustmentGroup {
                  reason
                }
              }
            }
          `,
          variables: {
            input: {
              reason: "correction",
              name: "Stockeasy sync",
              quantities: [
                {
                  inventoryItemId: `gid://shopify/InventoryItem/${mapping.shopifyInventoryItemId}`,
                  locationId: `gid://shopify/Location/${locationId}`,
                  quantity: stock_actuel
                }
              ]
            }
          }
        });

        // d. Check for errors in the mutation result
        const userErrors = result?.result?.data?.inventorySetQuantities?.userErrors;

        if (userErrors && userErrors.length > 0) {
          logger.error({ sku, userErrors }, 'Shopify mutation returned errors');
          errorCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'error',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: `Shopify errors: ${userErrors.map(e => e.message).join(', ')}`,
            payload: { sku, stock_actuel, userErrors },
            processingTimeMs: Date.now() - updateStartTime
          });
        } else {
          logger.info({ sku, stock_actuel }, 'Successfully updated inventory in Shopify');
          successCount++;

          await api.syncLog.create({
            direction: 'stockeasy_to_shopify',
            entity: 'inventory',
            operation: 'update',
            status: 'success',
            shop: { _link: shop.id },
            stockEasySku: sku,
            shopifyId: mapping.shopifyInventoryItemId,
            message: `Updated inventory to ${stock_actuel}`,
            payload: { sku, stock_actuel },
            processingTimeMs: Date.now() - updateStartTime
          });
        }
      } catch (error) {
        logger.error({ sku, error }, 'Error processing inventory update');
        errorCount++;

        await api.syncLog.create({
          direction: 'stockeasy_to_shopify',
          entity: 'inventory',
          operation: 'update',
          status: 'error',
          shop: { _link: shop.id },
          stockEasySku: sku,
          message: `Error: ${error.message}`,
          payload: { sku, stock_actuel, error: error.message },
          processingTimeMs: Date.now() - updateStartTime
        });
      }
    }

    // 6. Return summary
    const totalTime = Date.now() - startTime;
    logger.info(
      { successCount, errorCount, skippedCount, totalTime },
      'Completed inventory update batch from Stockeasy'
    );

    return reply.code(200).send({
      success: true,
      processed: successCount,
      errors: errorCount,
      skipped: skippedCount
    });
  } catch (error) {
    logger.error({ error }, 'Unexpected error in update-shopify-inventory route');
    return reply.code(500).send({ error: 'Internal server error' });
  }
};

route.options = {
  schema: {
    body: {
      type: 'object',
      properties: {
        company_id: { type: 'string' },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              sku: { type: 'string' },
              stock_actuel: { type: 'number', minimum: 0 }
            },
            required: ['sku', 'stock_actuel']
          }
        }
      },
      required: ['company_id', 'updates']
    }
  },
  cors: {
    origin: [
      'https://stockeasy.app',
      'https://www.stockeasy.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }
};

export default route;