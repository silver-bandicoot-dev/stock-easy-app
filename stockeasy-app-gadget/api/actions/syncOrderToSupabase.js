import { getSupabaseClient, insertUnmappedProducts } from "../lib/supabase";
import { convertToShopDate } from "../lib/dateUtils";

/** @type { ActionRun } */
export const run = async ({ params, logger, api }) => {
  const { orderId, shopId } = params;
  
  logger.info({ orderId, shopId }, "Starting order sync to Supabase");

  // Load the order with line items from Gadget
  const order = await api.shopifyOrder.maybeFindOne(orderId, {
    select: {
      id: true,
      name: true,
      createdAt: true,
      lineItems: {
        edges: {
          node: {
            id: true,
            variantId: true,
            sku: true,
            quantity: true,
            price: true,
            title: true
          }
        }
      }
    }
  });

  if (!order) {
    logger.warn({ orderId }, "Order not found, skipping sync");
    return;
  }

  // Load the shop to get the domain AND timezone
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      myshopifyDomain: true,
      timezone: true
    }
  });

  // Initialize Supabase client
  const supabase = getSupabaseClient();

  // Get company_id from Supabase
  const { data: companyData, error: companyError } = await supabase.rpc(
    'get_company_by_shopify_shop_id',
    { p_shopify_shop_id: shop.myshopifyDomain }
  );

  if (companyError || !companyData) {
    logger.error({ shopId, domain: shop.myshopifyDomain, error: companyError }, "Company not found in Supabase");
    throw new Error(`Company not found for shop ${shop.myshopifyDomain}`);
  }

  const companyId = companyData;
  logger.info({ companyId, shopId }, "Resolved company ID");

  // Process line items
  const lineItems = order.lineItems.edges.map(edge => edge.node);
  logger.info({ orderName: order.name, lineItemCount: lineItems.length }, "Processing order line items");

  let processedCount = 0;
  let skippedCount = 0;
  const unmappedProducts = []; // Track unmapped products

  for (const lineItem of lineItems) {
    // Skip only if BOTH variantId and sku are missing
    if (!lineItem.variantId && !lineItem.sku) {
      logger.warn({ lineItemId: lineItem.id, title: lineItem.title }, "Line item has no variant ID or SKU, skipping");
      skippedCount++;
      continue;
    }

    // Look up product mapping - try variantId first, then SKU as fallback
    let mappings = null;
    let mappingError = null;

    if (lineItem.variantId) {
      const result = await supabase
        .from('product_mapping')
        .select('stockeasy_sku')
        .eq('company_id', companyId)
        .eq('shopify_variant_id', lineItem.variantId)
        .maybeSingle();
      mappings = result.data;
      mappingError = result.error;
    }

    // Fallback to SKU if variantId didn't find a mapping
    if (!mappings && lineItem.sku) {
      logger.info({ lineItemId: lineItem.id, sku: lineItem.sku }, "No mapping found by variantId, trying SKU");
      const result = await supabase
        .from('product_mapping')
        .select('stockeasy_sku')
        .eq('company_id', companyId)
        .eq('shopify_sku', lineItem.sku)
        .maybeSingle();
      mappings = result.data;
      mappingError = result.error;
    }

    if (mappingError || !mappings) {
      logger.warn({ 
        variantId: lineItem.variantId, 
        lineItemTitle: lineItem.title,
        error: mappingError 
      }, "Product mapping not found for variant, tracking as unmapped");
      
      // Track unmapped product
      if (lineItem.variantId) {
        unmappedProducts.push({
          company_id: companyId,
          shopify_variant_id: lineItem.variantId,
          shopify_sku: lineItem.sku || null,
          product_title: lineItem.title || 'Unknown',
          variant_title: null
        });
      }
      
      skippedCount++;
      continue;
    }

    // Calculate sale date (using shop timezone) and revenue
    const saleDate = convertToShopDate(order.createdAt, shop.timezone);
    const revenue = parseFloat(lineItem.price) * lineItem.quantity;

    // Insert into sales_history with UPSERT to handle duplicates gracefully
    const { data: insertedData, error: insertError } = await supabase
      .from('sales_history')
      .upsert({
        company_id: companyId,
        sku: mappings.stockeasy_sku,
        sale_date: saleDate,
        quantity: lineItem.quantity,
        revenue: revenue,
        source: 'shopify',
        // Dedicated columns for unique constraint (prevents duplicates)
        shopify_order_id: order.id,
        shopify_line_item_id: lineItem.id,
        // Keep metadata for additional info
        metadata: {
          shopify_order_id: order.id,
          shopify_line_item_id: lineItem.id,
          shopify_variant_id: lineItem.variantId
        }
      }, {
        onConflict: 'company_id,shopify_order_id,shopify_line_item_id',
        ignoreDuplicates: true
      })
      .select('id');

    if (insertError) {
      // Check if it's a duplicate constraint error (shouldn't happen with ignoreDuplicates)
      if (insertError.code === '23505') {
        logger.info({ 
          sku: mappings.stockeasy_sku, 
          orderId: order.id,
          lineItemId: lineItem.id 
        }, "Sales record already exists (duplicate), skipping");
        skippedCount++;
      } else {
        logger.error({ 
          error: insertError, 
          sku: mappings.stockeasy_sku,
          lineItemId: lineItem.id 
        }, "Failed to insert sales history record");
        skippedCount++;
      }
    } else if (!insertedData || insertedData.length === 0) {
      // No data returned means it was a duplicate that was skipped
      logger.info({ 
        sku: mappings.stockeasy_sku, 
        orderId: order.id,
        lineItemId: lineItem.id 
      }, "Sales record already exists (duplicate via upsert), skipping");
      skippedCount++;
    } else {
      logger.info({ 
        sku: mappings.stockeasy_sku, 
        quantity: lineItem.quantity, 
        revenue 
      }, "Successfully inserted sales history record");
      processedCount++;
    }
  }

  // Track unmapped products in Supabase
  if (unmappedProducts.length > 0) {
    try {
      await insertUnmappedProducts(unmappedProducts);
      logger.info({ count: unmappedProducts.length }, "Tracked unmapped products");
    } catch (error) {
      logger.warn({ error: error.message }, "Failed to track unmapped products");
    }
  }

  logger.info({ 
    orderId: order.id, 
    orderName: order.name,
    totalLineItems: lineItems.length,
    processedCount, 
    skippedCount,
    unmappedCount: unmappedProducts.length
  }, "Completed order sync to Supabase");
};

/** @type { ActionOptions } */
export const options = {
  timeoutMS: 60000,
  triggers: {
    api: true
  }
};

export const params = {
  orderId: { type: "string" },
  shopId: { type: "string" }
};
