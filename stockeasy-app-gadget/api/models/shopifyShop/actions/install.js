import { applyParams, save, ActionOptions } from "gadget-server";
import { createShopifyUserAndCompany } from "../../../lib/supabase";

/** @type { ActionRun } */
export const run = async ({ params, record, logger, api, connections }) => {
  applyParams(params, record);
  await save(record);
};

/** @type { ActionOnSuccess } */
export const onSuccess = async ({ params, record, logger, api, connections }) => {
  // Log installation
  await api.syncLog.create({
    shop: { _link: record.id },
    entity: 'webhook',
    operation: 'create',
    direction: 'shopify_to_stockeasy',
    status: 'success',
    message: `Shop ${record.domain} installed app`
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. SET DEFAULT LOCATION for stock sync
  // ═══════════════════════════════════════════════════════════════════════════
  let defaultLocationId = null;
  try {
    const locations = await api.shopifyLocation.findMany({
      filter: {
        AND: [
          { shopId: { equals: record.id } },
          { active: { equals: true } }
        ]
      },
      first: 1,
      select: { id: true, name: true }
    });
    
    if (locations.length > 0) {
      const defaultLocation = locations[0];
      defaultLocationId = defaultLocation.id;
      
      await api.shopifyShop.update(record.id, {
        defaultLocationId: defaultLocation.id
      });
      
      logger.info({ locationId: defaultLocation.id, locationName: defaultLocation.name }, '📍 Set default location for stock sync');
    } else {
      logger.warn({ shopId: record.id }, '⚠️ No active locations found - cannot set default location');
    }
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to set default location');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. CREATE USER AND COMPANY IN SUPABASE (if not already created)
  // ═══════════════════════════════════════════════════════════════════════════
  let companyId = record.stockEasyCompanyId;

  if (!companyId) {
    // Company doesn't exist yet - create it!
    try {
      // IMPORTANT: Use myshopifyDomain as the unique identifier (guaranteed to be unique)
      // This must match the lookup in syncOrderToSupabase and other sync actions
      const shopifyShopId = record.myshopifyDomain || record.domain;
      
      // Get shop owner email and name from Shopify
      const shopOwnerEmail = record.email || record.shopOwner || `${shopifyShopId.replace('.myshopify.com', '')}@shopify-placeholder.com`;
      const shopOwnerName = record.shopOwner || null;

      logger.info({ 
        shopId: record.id, 
        myshopifyDomain: record.myshopifyDomain,
        domain: record.domain,
        shopifyShopIdUsed: shopifyShopId,
        email: shopOwnerEmail, 
        name: shopOwnerName 
      }, '🏢 Creating Supabase user and company for new shop installation');

      // Create user and company in Supabase
      // CRITICAL: Use myshopifyDomain for consistent lookup across all sync actions
      const { userId, companyId: newCompanyId } = await createShopifyUserAndCompany(
        shopifyShopId,      // shopifyShopId - MUST be myshopifyDomain for consistency
        shopOwnerEmail,     // shopOwnerEmail  
        record.name,        // shopName
        shopOwnerName       // shopOwnerName
      );
      
      companyId = newCompanyId;
      
      logger.info({ userId, companyId }, '✅ User and company created in Supabase');

      // Update the shop record with the new companyId
      await api.shopifyShop.update(record.id, {
        stockEasyCompanyId: companyId
      });
      
      logger.info({ shopId: record.id, companyId }, '✅ Updated shop with stockEasyCompanyId');

      await api.syncLog.create({
        shop: { _link: record.id },
        entity: 'api_call',
        operation: 'create',
        direction: 'shopify_to_stockeasy',
        status: 'success',
        message: `Created Supabase user and company for ${shopifyShopId}`,
        payload: { userId, companyId, shopifyShopId }
      });

      // ═══════════════════════════════════════════════════════════════════════════
      // 2b. SEND WELCOME EMAIL WITH PASSWORD SETUP LINK
      // ═══════════════════════════════════════════════════════════════════════════
      try {
        logger.info({ email: shopOwnerEmail }, '📧 Sending welcome email to new merchant');
        
        await api.enqueue(api.sendWelcomeEmail, {
          email: shopOwnerEmail,
          shopName: record.name || record.domain,
          ownerName: shopOwnerName
        });
        
        logger.info({ email: shopOwnerEmail }, '✅ Welcome email enqueued');
        
        await api.syncLog.create({
          shop: { _link: record.id },
          entity: 'email',
          operation: 'create',
          direction: 'stockeasy_to_merchant',
          status: 'pending',
          message: `Welcome email enqueued for ${shopOwnerEmail}`
        });
      } catch (emailError) {
        // Don't fail installation if email fails - just log it
        logger.error({ error: emailError.message }, '⚠️ Failed to send welcome email (non-blocking)');
        
        await api.syncLog.create({
          shop: { _link: record.id },
          entity: 'email',
          operation: 'create',
          direction: 'stockeasy_to_merchant',
          status: 'error',
          message: `Failed to send welcome email: ${emailError.message}`
        });
      }

    } catch (error) {
      logger.error({ error: error.message }, '❌ Failed to create user and company in Supabase');
      
      await api.syncLog.create({
        shop: { _link: record.id },
        entity: 'api_call',
        operation: 'create',
        direction: 'shopify_to_stockeasy',
        status: 'error',
        message: `Failed to create user/company: ${error.message}`
      });
      
      // Don't proceed with syncs if we couldn't create the company
      return;
    }
  } else {
    logger.info({ companyId }, '✅ Shop already has stockEasyCompanyId - skipping user/company creation');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. SYNC SHOPIFY LOCATIONS TO WAREHOUSES
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    logger.info({ shopId: record.id }, '🏭 Syncing Shopify locations to warehouses');
    
    await api.enqueue(api.syncShopifyLocations, {
      shopId: record.id
    });
    
    logger.info({ domain: record.domain }, '✅ Enqueued Shopify locations sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'warehouse',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'pending',
      message: 'Initial Shopify locations sync enqueued'
    });
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to enqueue locations sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'warehouse',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      message: `Failed to enqueue locations sync: ${error.message}`
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SYNC INITIAL PRODUCTS FROM SHOPIFY
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    logger.info({ shopId: record.id }, '📦 Syncing initial products from Shopify');
    
    await api.enqueue(api.syncShopifyProducts, {
      shopId: record.id
    });
    
    logger.info({ domain: record.domain }, '✅ Enqueued Shopify products sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'product',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'pending',
      message: 'Initial products sync from Shopify enqueued'
    });
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to enqueue products sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'product',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      message: `Failed to enqueue products sync: ${error.message}`
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. SYNC INITIAL INVENTORY FROM SHOPIFY
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    logger.info({ shopId: record.id }, '📊 Syncing initial inventory from Shopify');
    
    await api.enqueue(api.syncInitialInventoryFromShopify, {
      shopId: record.id
    });
    
    logger.info({ domain: record.domain }, '✅ Enqueued initial inventory sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'inventory',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'pending',
      message: 'Initial inventory sync from Shopify enqueued'
    });
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to enqueue initial inventory sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'inventory',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      message: `Failed to enqueue initial inventory sync: ${error.message}`
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. SYNC 30 DAYS OF HISTORICAL ORDERS
  // ═══════════════════════════════════════════════════════════════════════════
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    logger.info({ shopId: record.id }, '📅 Syncing 30 days of historical orders');
    
    await api.enqueue(api.syncOrdersToSupabase, {
      shopId: record.id,
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
    
    logger.info({ domain: record.domain }, '✅ Enqueued 30-day historical orders sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'order',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'pending',
      message: 'Initial 30-day historical sync enqueued'
    });
  } catch (error) {
    logger.error({ error: error.message }, '❌ Failed to enqueue historical orders sync');
    
    await api.syncLog.create({
      shop: { _link: record.id },
      entity: 'order',
      operation: 'sync',
      direction: 'shopify_to_stockeasy',
      status: 'error',
      message: `Failed to enqueue historical sync: ${error.message}`
    });
  }

  logger.info({ 
    shopId: record.id, 
    domain: record.domain,
    companyId 
  }, '🎉 Shop installation complete - all initial syncs enqueued');
};

/** @type { ActionOptions } */
export const options = { actionType: "create" };
