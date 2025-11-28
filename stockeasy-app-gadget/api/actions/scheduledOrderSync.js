import { insertSalesHistory, getCompanyUuidByShopifyId, insertUnmappedProducts } from "../lib/supabase";
import { convertToShopDate } from "../lib/dateUtils";
import { ActionOptions } from "gadget-server";

/** @type { ActionRun } */
export const run = async ({ params, logger, api, connections }) => {
  const startDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const endDate = new Date();
  
  logger.info(`Starting scheduled order sync for orders between ${startDate.toISOString()} and ${endDate.toISOString()}`);
  
  let totalShopsProcessed = 0;
  let totalOrdersSynced = 0;
  let totalItemsSynced = 0;
  const failedShops = [];
  
  try {
    const shops = await api.shopifyShop.findMany({
      filter: {
        stockEasyCompanyId: { isSet: true }
      },
      select: {
        id: true,
        stockEasyCompanyId: true,
        domain: true,
        timezone: true
      }
    });
    
    logger.info(`Found ${shops.length} shops to sync`);
    
    for (const shop of shops) {
      try {
        const companyUuid = await getCompanyUuidByShopifyId(shop.stockEasyCompanyId);
        if (!companyUuid) {
          logger.warn(`Company UUID not found for shop ${shop.domain}, skipping`);
          continue;
        }
        
        const orders = await api.shopifyOrder.findMany({
          filter: {
            AND: [
              { shopId: { equals: shop.id } },
              { createdAt: { greaterThanOrEqual: startDate } },
              { createdAt: { lessThanOrEqual: endDate } }
            ]
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            currentTotalPrice: true,
            lineItems: {
              edges: {
                node: {
                  id: true,
                  variantId: true,
                  productId: true,
                  quantity: true,
                  price: true,
                  currentQuantity: true
                }
              }
            }
          }
        });
        
        let shopOrderCount = 0;
        const shopSalesData = [];
        const shopUnmappedProducts = []; // Track unmapped products for this shop
        
        for (const order of orders) {
          const lineItems = order.lineItems?.edges?.map(edge => edge.node) || [];
          
          for (const lineItem of lineItems) {
            if (!lineItem.variantId) continue;
            
            const productMapping = await api.productMapping.findFirst({
              filter: {
                AND: [
                  { shopId: { equals: shop.id } },
                  { shopifyVariantId: { equals: lineItem.variantId } }
                ]
              },
              select: {
                stockEasySku: true
              }
            });
            
            if (!productMapping) {
              // Track unmapped product
              if (lineItem.variantId) {
                shopUnmappedProducts.push({
                  company_id: companyUuid,
                  shopify_variant_id: lineItem.variantId,
                  shopify_sku: null,
                  product_title: 'Unknown',
                  variant_title: null
                });
              }
              continue;
            }
            
            const quantity = lineItem.currentQuantity || lineItem.quantity || 0;
            const unitPrice = parseFloat(lineItem.price || '0');
            
            const salesData = {
              company_id: companyUuid,
              sku: productMapping.stockEasySku,
              quantity: quantity,
              revenue: unitPrice * quantity,
              sale_date: convertToShopDate(order.createdAt, shop.timezone), // Use shop timezone
              source: 'shopify',
              // Dedicated columns for unique constraint (prevents duplicates)
              shopify_order_id: order.id,
              shopify_line_item_id: lineItem.id,
              // Keep metadata for additional info
              metadata: {
                shopify_order_id: order.id,
                shopify_line_item_id: lineItem.id,
                order_name: order.name,
                variant_id: lineItem.variantId,
                unit_price: unitPrice
              }
            };
            
            shopSalesData.push(salesData);
          }
          
          shopOrderCount++;
        }
        
        // Insert in batches of 100
        for (let i = 0; i < shopSalesData.length; i += 100) {
          const batch = shopSalesData.slice(i, i + 100);
          await insertSalesHistory(batch);
        }
        
        // Track unmapped products for this shop
        if (shopUnmappedProducts.length > 0) {
          try {
            await insertUnmappedProducts(shopUnmappedProducts);
            logger.info({ count: shopUnmappedProducts.length, shop: shop.domain }, 'Tracked unmapped products');
          } catch (error) {
            logger.warn({ error: error.message, shop: shop.domain }, 'Failed to track unmapped products');
          }
        }
        
        const shopItemCount = shopSalesData.length;
        
        totalShopsProcessed++;
        totalOrdersSynced += shopOrderCount;
        totalItemsSynced += shopItemCount;
        
        logger.info(`Synced ${shopOrderCount} orders with ${shopItemCount} items for shop ${shop.domain}`);
        
      } catch (shopError) {
        logger.error(`Failed to sync shop ${shop.domain}: ${shopError.message}`);
        failedShops.push({
          shopId: shop.id,
          domain: shop.domain,
          error: shopError.message
        });
        
        await api.syncLog.create({
          shop: { _link: shop.id },
          entity: 'order',
          operation: 'sync',
          status: 'error',
          direction: 'shopify_to_stockeasy',
          message: `Scheduled sync failed: ${shopError.message}`,
          payload: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            error: shopError.message
          }
        });
      }
    }
    
    const summary = {
      shopsProcessed: totalShopsProcessed,
      ordersSynced: totalOrdersSynced,
      itemsSynced: totalItemsSynced,
      failedShops: failedShops.length,
      timeWindow: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    };
    
    logger.info(`Scheduled order sync completed: ${JSON.stringify(summary)}`);
    
    return summary;
    
  } catch (error) {
    logger.error(`Scheduled order sync failed: ${error.message}`);
    throw error;
  }
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    scheduler: [
      {
        cron: "0 * * * *"
      }
    ]
  }
};
