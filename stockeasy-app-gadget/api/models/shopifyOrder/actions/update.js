import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossShopDataAccess } from "gadget-server/shopify";
import { DateTime } from 'luxon';
import { 
  getCompanyUuidByShopifyId, 
  insertSalesHistory, 
  deleteSalesHistoryByOrderId,
  insertUnmappedProducts 
} from "../../../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await preventCrossShopDataAccess(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  try {
    // Get the shop with timezone
    const shop = await api.shopifyShop.findOne(record.shopId, {
      select: {
        id: true,
        domain: true,
        stockEasyCompanyId: true,
        timezone: true
      }
    });

    if (!shop || !shop.stockEasyCompanyId) {
      logger.warn({ orderId: record.id }, 'Shop not found or no stockEasyCompanyId - skipping order update sync');
      return;
    }

    // Get company UUID
    let companyUuid;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(shop.stockEasyCompanyId);
    
    if (isUuid) {
      companyUuid = shop.stockEasyCompanyId;
    } else {
      companyUuid = await getCompanyUuidByShopifyId(shop.stockEasyCompanyId);
      if (!companyUuid) {
        logger.warn({ stockEasyCompanyId: shop.stockEasyCompanyId }, 'Company not found in Supabase');
        return;
      }
    }

    // CASE 1: Order was cancelled
    if (record.cancelledAt && record.changed('cancelledAt')) {
      logger.info({ orderId: record.id, cancelledAt: record.cancelledAt }, 'Processing order cancellation');
      
      // Get all line items for this order
      const lineItems = await api.shopifyOrderLineItem.findMany({
        filter: { orderId: { equals: record.id } },
        select: {
          id: true,
          variantId: true,
          sku: true,
          title: true,
          variantTitle: true,
          quantity: true,
          price: true
        }
      });

      const cancellationData = [];
      const cancelDate = DateTime
        .fromISO(record.cancelledAt, { zone: 'utc' })
        .setZone(shop.timezone || 'America/New_York')
        .toFormat('yyyy-MM-dd');

      for (const lineItem of lineItems) {
        // Try to find mapping - first by variantId, then by SKU as fallback
        let mapping = null;
        
        if (lineItem.variantId) {
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifyVariantId: { equals: lineItem.variantId }
            },
            select: { stockEasySku: true }
          });
        }
        
        if (!mapping && lineItem.sku) {
          // Fallback: try to find by Shopify SKU
          logger.info({ 
            lineItemId: lineItem.id, 
            sku: lineItem.sku,
            hasVariantId: !!lineItem.variantId
          }, 'Trying to find mapping by SKU for cancellation');
          
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifySku: { equals: lineItem.sku }
            },
            select: { stockEasySku: true }
          });
        }
        
        // Skip if we have neither variantId nor SKU
        if (!lineItem.variantId && !lineItem.sku) {
          logger.warn({ lineItemId: lineItem.id }, 'Line item has no variantId or SKU - skipping cancellation entry');
          continue;
        }

        if (!mapping) {
          logger.warn({ variantId: lineItem.variantId }, 'No mapping found for cancelled item - skipping');
          continue;
        }

        // Create NEGATIVE entry to cancel the sale
        // Use unique IDs with '_cancel' suffix to allow both sale and cancellation in same table
        cancellationData.push({
          company_id: companyUuid,
          sku: mapping.stockEasySku,
          sale_date: cancelDate,
          quantity: -lineItem.quantity,  // NEGATIVE
          revenue: -(parseFloat(lineItem.price) * lineItem.quantity),  // NEGATIVE
          source: 'shopify',
          // Dedicated columns for unique constraint - suffix with _cancel to differentiate from original sale
          shopify_order_id: `${record.id}_cancel`,
          shopify_line_item_id: lineItem.id,
          metadata: {
            shopify_order_id: record.id,
            shopify_line_item_id: lineItem.id,
            type: 'cancellation',
            cancelled_at: record.cancelledAt,
            cancel_reason: record.cancelReason || null
          }
        });
      }

      if (cancellationData.length > 0) {
        await insertSalesHistory(cancellationData);
        logger.info({ count: cancellationData.length }, 'Inserted cancellation entries in sales_history');

        await api.syncLog.create({
          shop: { _link: record.shopId },
          entity: 'order',
          operation: 'delete',
          direction: 'shopify_to_stockeasy',
          status: 'success',
          shopifyId: record.id,
          message: `Order ${record.name} cancelled - inserted ${cancellationData.length} negative entries`,
          payload: {
            orderId: record.id,
            cancelledAt: record.cancelledAt,
            cancelReason: record.cancelReason,
            itemsCancelled: cancellationData.length
          }
        });
      }

      return; // Done processing cancellation
    }

    // CASE 2: Order was refunded (partially or fully)
    // Detect refunds by checking financialStatus change to PARTIALLY_REFUNDED or REFUNDED
    const isRefund = record.changed('financialStatus') && 
      (record.financialStatus === 'PARTIALLY_REFUNDED' || record.financialStatus === 'REFUNDED');
    
    if (isRefund) {
      logger.info({ 
        orderId: record.id, 
        financialStatus: record.financialStatus 
      }, '💰 Processing order refund - creating negative entries');

      const lineItems = await api.shopifyOrderLineItem.findMany({
        filter: { orderId: { equals: record.id } },
        select: {
          id: true,
          variantId: true,
          sku: true,
          title: true,
          variantTitle: true,
          quantity: true,           // Original quantity
          currentQuantity: true,    // Quantity after refunds
          refundableQuantity: true, // Quantity that can still be refunded
          price: true
        }
      });

      const refundData = [];
      const refundDate = DateTime.now()
        .setZone(shop.timezone || 'America/New_York')
        .toFormat('yyyy-MM-dd');

      for (const lineItem of lineItems) {
        // Calculate refunded quantity
        const originalQty = lineItem.quantity || 0;
        const currentQty = lineItem.currentQuantity ?? originalQty; // currentQuantity can be null
        const refundedQty = originalQty - currentQty;

        // Skip if nothing was refunded for this line item
        if (refundedQty <= 0) {
          continue;
        }

        // Find mapping
        let mapping = null;
        if (lineItem.variantId) {
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifyVariantId: { equals: lineItem.variantId }
            },
            select: { stockEasySku: true }
          });
        }
        
        if (!mapping && lineItem.sku) {
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifySku: { equals: lineItem.sku }
            },
            select: { stockEasySku: true }
          });
        }

        if (!mapping) {
          logger.warn({ variantId: lineItem.variantId, sku: lineItem.sku }, 'No mapping for refunded item - skipping');
          continue;
        }

        // Create NEGATIVE entry for the refund
        refundData.push({
          company_id: companyUuid,
          sku: mapping.stockEasySku,
          sale_date: refundDate,
          quantity: -refundedQty,  // NEGATIVE
          revenue: -(parseFloat(lineItem.price) * refundedQty),  // NEGATIVE
          source: 'shopify',
          shopify_order_id: `${record.id}_refund`,
          shopify_line_item_id: `${lineItem.id}_refund`,
          metadata: {
            shopify_order_id: record.id,
            shopify_line_item_id: lineItem.id,
            type: 'refund',
            financial_status: record.financialStatus,
            original_quantity: originalQty,
            current_quantity: currentQty,
            refunded_quantity: refundedQty
          }
        });
      }

      if (refundData.length > 0) {
        await insertSalesHistory(refundData);
        logger.info({ count: refundData.length }, '✅ Inserted refund entries in sales_history');

        await api.syncLog.create({
          shop: { _link: record.shopId },
          entity: 'order',
          operation: 'update',
          direction: 'shopify_to_stockeasy',
          status: 'success',
          shopifyId: record.id,
          message: `Order ${record.name} refunded - inserted ${refundData.length} negative entries`,
          payload: {
            orderId: record.id,
            financialStatus: record.financialStatus,
            refundedItems: refundData.length
          }
        });
      }

      return; // Done processing refund
    }

    // CASE 3: Order was updated (but not cancelled or refunded)
    // Handle general updates to order data
    if (record.changed('fulfillmentStatus') || 
        record.changed('currentSubtotalPrice') || record.changed('currentTotalPrice')) {
      
      logger.info({ orderId: record.id }, 'Order was updated - re-syncing to sales_history');

      // Step 1: Delete old sales_history entries for this order (keep refund entries)
      await deleteSalesHistoryByOrderId(companyUuid, record.id, { includeCancellations: false });
      logger.info({ orderId: record.id }, 'Deleted old sales_history entries');

      // Step 2: Re-insert updated data using currentQuantity (reflects refunds)
      const lineItems = await api.shopifyOrderLineItem.findMany({
        filter: { orderId: { equals: record.id } },
        select: {
          id: true,
          variantId: true,
          sku: true,
          title: true,
          variantTitle: true,
          quantity: true,
          currentQuantity: true,
          price: true
        }
      });

      const salesData = [];
      const unmappedProducts = [];
      const saleDate = DateTime
        .fromISO(record.createdAt, { zone: 'utc' })
        .setZone(shop.timezone || 'America/New_York')
        .toFormat('yyyy-MM-dd');

      for (const lineItem of lineItems) {
        // Use currentQuantity if available (reflects refunds), fallback to quantity
        const effectiveQuantity = lineItem.currentQuantity ?? lineItem.quantity;
        
        // Skip if quantity is 0 (fully refunded)
        if (effectiveQuantity <= 0) {
          continue;
        }

        // Try to find mapping - first by variantId, then by SKU as fallback
        let mapping = null;
        
        if (lineItem.variantId) {
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifyVariantId: { equals: lineItem.variantId }
            },
            select: {
              id: true,
              stockEasySku: true,
              productTitle: true,
              variantTitle: true
            }
          });
        }
        
        if (!mapping && lineItem.sku) {
          // Fallback: try to find by Shopify SKU
          logger.info({ 
            lineItemId: lineItem.id, 
            sku: lineItem.sku,
            hasVariantId: !!lineItem.variantId
          }, 'Trying to find mapping by SKU for update');
          
          mapping = await api.productMapping.findFirst({
            filter: {
              shopId: { equals: record.shopId },
              shopifySku: { equals: lineItem.sku }
            },
            select: {
              id: true,
              stockEasySku: true,
              productTitle: true,
              variantTitle: true
            }
          });
        }
        
        // Skip if no variantId or SKU
        if (!lineItem.variantId && !lineItem.sku) {
          logger.warn({ lineItemId: lineItem.id }, 'Line item has no variantId or SKU - skipping');
          continue;
        }

        if (!mapping) {
          unmappedProducts.push({
            company_id: companyUuid,
            shopify_variant_id: lineItem.variantId,
            shopify_sku: lineItem.sku || null,
            product_title: lineItem.title,
            variant_title: lineItem.variantTitle || null
          });
          
          logger.warn({ variantId: lineItem.variantId }, 'Product variant not mapped - tracking as unmapped');
          continue;
        }

        salesData.push({
          company_id: companyUuid,
          sku: mapping.stockEasySku,
          sale_date: saleDate,
          quantity: effectiveQuantity,  // Use effective quantity (after refunds)
          revenue: parseFloat(lineItem.price) * effectiveQuantity,
          source: 'shopify',
          // Dedicated columns for unique constraint
          shopify_order_id: record.id,
          shopify_line_item_id: lineItem.id,
          metadata: {
            shopify_order_id: record.id,
            shopify_line_item_id: lineItem.id,
            type: 'update',
            order_name: record.name,
            financial_status: record.financialStatus,
            fulfillment_status: record.fulfillmentStatus,
            original_quantity: lineItem.quantity,
            effective_quantity: effectiveQuantity
          }
        });
      }

      // Insert updated sales data
      if (salesData.length > 0) {
        await insertSalesHistory(salesData);
        logger.info({ count: salesData.length }, 'Re-inserted updated sales_history entries');
      }

      // Track unmapped products
      if (unmappedProducts.length > 0) {
        await insertUnmappedProducts(unmappedProducts);
        logger.info({ count: unmappedProducts.length }, 'Tracked unmapped products');
      }

      await api.syncLog.create({
        shop: { _link: record.shopId },
        entity: 'order',
        operation: 'update',
        direction: 'shopify_to_stockeasy',
        status: 'success',
        shopifyId: record.id,
        message: `Order ${record.name} updated - re-synced ${salesData.length} items`,
        payload: {
          orderId: record.id,
          syncedItems: salesData.length,
          skippedItems: unmappedProducts.length
        }
      });
    }

  } catch (error) {
    logger.error({ error, orderId: record.id }, 'Failed to sync order update to Supabase');
    
    await api.syncLog.create({
      shop: { _link: record.shopId },
      entity: 'order',
      operation: 'update',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      shopifyId: record.id,
      message: `Failed to sync order update: ${error.message}`
    });
  }

  // Enqueue syncOrderToSupabase to ensure all order data is synced
  try {
    await api.enqueue(api.syncOrderToSupabase, {
      orderId: record.id,
      shopId: record.shopId
    }, {
      retries: {
        retryCount: 5,
        backoffFactor: 2,
        initialInterval: 1000
      }
    });
    logger.info({ orderId: record.id }, 'Enqueued order sync to Supabase');
  } catch (error) {
    logger.error({ error, orderId: record.id }, 'Failed to enqueue order sync');
  }
};

/** @type { ActionOptions } */
export const options = { 
  actionType: "update"
};
