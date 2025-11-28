import { insertSalesHistory, insertUnmappedProducts } from '../lib/supabase';
import { convertToShopDate } from '../lib/dateUtils';

/** @type { ActionRun } */
export const run = async ({ params, logger, api }) => {
  try {
    // Validate required shopId parameter
    if (!params.shopId) {
      throw new Error('shopId is required');
    }

    // Parse and validate dates
    const endDate = params.endDate 
      ? new Date(params.endDate) 
      : new Date();
    
    const startDate = params.startDate 
      ? new Date(params.startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format. Use YYYY-MM-DD format');
    }

    logger.info({ shopId: params.shopId, startDate, endDate }, 'Starting manual order sync');

    // Fetch shop record to get stockEasyCompanyId and timezone
    const shop = await api.shopifyShop.findOne(params.shopId, {
      select: {
        id: true,
        stockEasyCompanyId: true,
        domain: true,
        timezone: true
      }
    });

    if (!shop.stockEasyCompanyId) {
      throw new Error(`Shop ${params.shopId} does not have a stockEasyCompanyId configured`);
    }

    logger.info({ stockEasyCompanyId: shop.stockEasyCompanyId }, 'Found shop with company ID');

    // stockEasyCompanyId is already the UUID, use it directly
    const companyUuid = shop.stockEasyCompanyId;
    logger.info({ companyUuid }, 'Using company UUID from stockEasyCompanyId');

    // Fetch orders with pagination
    let allOrders = [];
    let hasNextPage = true;
    let cursor = null;
    
    while (hasNextPage) {
      const orders = await api.shopifyOrder.findMany({
        filter: {
          shopId: { equals: params.shopId },
          createdAt: {
            greaterThanOrEqual: startDate.toISOString(),
            lessThanOrEqual: endDate.toISOString()
          }
        },
        select: {
          id: true,
          createdAt: true,
          shopId: true
        },
        first: 250,
        after: cursor
      });

      allOrders = allOrders.concat(orders);
      hasNextPage = orders.hasNextPage;
      cursor = orders.hasNextPage ? orders.endCursor : null;

      logger.info({ fetched: orders.length, total: allOrders.length }, 'Fetched orders batch');
    }

    logger.info({ orderCount: allOrders.length }, 'Fetched all orders');

    // Process orders and collect sales data
    let salesData = [];
    let itemCount = 0;
    let skippedCount = 0;
    let unmappedProducts = []; // Track unmapped products

    for (const order of allOrders) {
      // Fetch line items for this order
      let hasMoreItems = true;
      let itemCursor = null;

      while (hasMoreItems) {
        const lineItems = await api.shopifyOrderLineItem.findMany({
          filter: {
            orderId: { equals: order.id }
          },
          select: {
            id: true,
            variantId: true,
            sku: true,
            quantity: true,
            price: true,
            productId: true
          },
          first: 250,
          after: itemCursor
        });

        // Process line items
        for (const item of lineItems) {
          // Try to find product mapping by variantId first, then by SKU
          let mapping = null;

          if (item.variantId) {
            mapping = await api.productMapping.findFirst({
              filter: {
                shopId: { equals: params.shopId },
                shopifyVariantId: { equals: item.variantId }
              },
              select: {
                stockEasySku: true
              }
            });
          }

          // If no mapping by variantId, try by SKU
          if (!mapping && item.sku) {
            mapping = await api.productMapping.findFirst({
              filter: {
                shopId: { equals: params.shopId },
                shopifySku: { equals: item.sku }
              },
              select: {
                stockEasySku: true
              }
            });
          }

          if (!mapping) {
            logger.warn({ 
              orderLineItemId: item.id,
              variantId: item.variantId,
              shopifySku: item.sku 
            }, 'Skipping line item without product mapping - tracking as unmapped');
            
            // Track unmapped product
            if (item.variantId) {
              unmappedProducts.push({
                company_id: companyUuid,
                shopify_variant_id: item.variantId,
                shopify_sku: item.sku || null,
                product_title: 'Unknown', // We don't have title in this context
                variant_title: null
              });
            }
            
            skippedCount++;
            continue;
          }

          const quantity = item.quantity || 0;
          const price = parseFloat(item.price) || 0;
          const revenue = price * quantity;

          salesData.push({
            company_id: companyUuid,
            sku: mapping.stockEasySku,
            sale_date: convertToShopDate(order.createdAt, shop.timezone), // Use shop timezone
            quantity: quantity,
            revenue: revenue,
            source: 'shopify',
            // Dedicated columns for unique constraint (prevents duplicates)
            shopify_order_id: order.id,
            shopify_line_item_id: item.id,
            // Keep metadata for additional info
            metadata: {
              shopify_order_id: order.id,
              shopify_line_item_id: item.id,
              shopify_product_id: item.productId
            }
          });

          itemCount++;
        }

        hasMoreItems = lineItems.hasNextPage;
        itemCursor = lineItems.hasNextPage ? lineItems.endCursor : null;
      }
    }

    logger.info({ itemCount, skippedCount }, 'Collected sales data');

    // Insert sales data in batches of 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < salesData.length; i += batchSize) {
      const batch = salesData.slice(i, i + batchSize);
      await insertSalesHistory(batch);
      insertedCount += batch.length;
      logger.info({ inserted: insertedCount, total: salesData.length }, 'Inserted batch');
    }

    // Track unmapped products
    if (unmappedProducts.length > 0) {
      try {
        await insertUnmappedProducts(unmappedProducts);
        logger.info({ count: unmappedProducts.length }, 'Tracked unmapped products');
      } catch (error) {
        logger.warn({ error: error.message }, 'Failed to track unmapped products');
      }
    }

    // Create success syncLog entry
    await api.syncLog.create({
      shop: { _link: params.shopId },
      entity: 'order',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'success',
      message: `Synced ${allOrders.length} orders with ${itemCount} items (${skippedCount} skipped) to Supabase`,
      payload: {
        ordersProcessed: allOrders.length,
        itemsSynced: itemCount,
        itemsSkipped: skippedCount,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });

    logger.info({ 
      ordersProcessed: allOrders.length, 
      itemsSynced: itemCount,
      itemsSkipped: skippedCount
    }, 'Manual sync completed successfully');

    return {
      ordersProcessed: allOrders.length,
      itemsSynced: itemCount,
      itemsSkipped: skippedCount,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };

  } catch (error) {
    logger.error({ error }, 'Error during manual order sync');

    // Create error syncLog entry if we have a shopId
    if (params.shopId) {
      await api.syncLog.create({
        shop: { _link: params.shopId },
        entity: 'order',
        operation: 'sync',
        direction: 'shopify_to_stockeasy',
        status: 'error',
        message: `Manual sync failed: ${error.message}`,
        payload: {
          error: error.message,
          stack: error.stack
        }
      });
    }

    throw error;
  }
};

export const params = {
  shopId: { type: "string" },
  startDate: { type: "string" },
  endDate: { type: "string" }
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true
  }
};
