import { createClient } from "@supabase/supabase-js";
import { validateSalesHistoryBatch, validateStockUpdate } from "./validation.js";

/**
 * Creates and returns a configured Supabase client instance.
 * 
 * @returns {import("@supabase/supabase-js").SupabaseClient} Configured Supabase client
 * @throws {Error} If SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are missing
 */
export const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL environment variable is not set");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

/**
 * Gets the company UUID by Shopify shop ID.
 * 
 * @param {string} shopifyShopId - The Shopify shop ID (e.g., "mystore.myshopify.com")
 * @returns {Promise<string|null>} The company UUID or null if not found
 * @throws {Error} If the query fails
 */
export const getCompanyUuidByShopifyId = async (shopifyShopId) => {
  if (!shopifyShopId) {
    throw new Error("shopifyShopId is required");
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('shopify_shop_id', shopifyShopId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Failed to get company UUID: ${error.message}`);
    }

    return data?.id || null;
  } catch (error) {
    throw new Error(`Error getting company UUID from Supabase: ${error.message}`);
  }
};

/**
 * Creates a Shopify company or returns existing UUID.
 * Calls the PostgreSQL function create_shopify_company.
 * 
 * @param {string} shopifyShopId - The Shopify shop ID (required)
 * @param {string} [shopName] - The shop name (optional)
 * @param {string} [shopDomain] - The shop domain (optional)
 * @returns {Promise<string>} The company UUID (created or existing)
 * @throws {Error} If the RPC call fails
 */
export const createShopifyCompany = async (shopifyShopId, shopName, shopDomain) => {
  if (!shopifyShopId) {
    throw new Error("shopifyShopId is required");
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('create_shopify_company', {
      p_shopify_shop_id: shopifyShopId,
      p_shop_name: shopName || null,
      p_shop_domain: shopDomain || null
    });

    if (error) {
      throw new Error(`Failed to create Shopify company: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(`Error creating Shopify company in Supabase: ${error.message}`);
  }
};

/**
 * Creates a Supabase Auth user and company for a new Shopify installation.
 * 
 * Flow:
 * 1. Create auth user (or find existing by email)
 * 2. Create company with owner_id
 * 3. User profile is created automatically by create_shopify_company function
 * 
 * The user will need to use "Forgot password" to set their password and access Stockeasy.
 * 
 * @param {string} shopifyShopId - The Shopify shop ID (e.g., "mystore.myshopify.com")
 * @param {string} shopOwnerEmail - The shop owner's email
 * @param {string} [shopName] - The shop name (optional)
 * @param {string} [shopOwnerName] - The shop owner's full name (optional)
 * @returns {Promise<{userId: string, companyId: string}>} The created user ID and company UUID
 * @throws {Error} If creation fails
 */
export const createShopifyUserAndCompany = async (shopifyShopId, shopOwnerEmail, shopName, shopOwnerName) => {
  if (!shopifyShopId) {
    throw new Error("shopifyShopId is required");
  }

  if (!shopOwnerEmail) {
    throw new Error("shopOwnerEmail is required");
  }

  console.log(`[createShopifyUserAndCompany] Starting for shop: ${shopifyShopId}, email: ${shopOwnerEmail}`);

  try {
    const supabase = getSupabaseClient();
    console.log(`[createShopifyUserAndCompany] Supabase client created successfully`);

    // Check if company already exists
    console.log(`[createShopifyUserAndCompany] Checking if company exists for: ${shopifyShopId}`);
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id')
      .eq('shopify_shop_id', shopifyShopId)
      .maybeSingle();

    if (checkError) {
      console.error(`[createShopifyUserAndCompany] Error checking existing company:`, checkError);
      // Don't throw - continue to create
    }

    if (existingCompany) {
      console.log(`[createShopifyUserAndCompany] Company already exists: ${existingCompany.id}`);
      return { userId: null, companyId: existingCompany.id };
    }

    // 1. Create the Supabase Auth user using PostgreSQL function
    console.log(`[createShopifyUserAndCompany] Creating auth user via RPC...`);
    const { data: userId, error: userError } = await supabase.rpc('create_auth_user_for_shopify', {
      p_email: shopOwnerEmail,
      p_shopify_shop_id: shopifyShopId,
      p_shop_name: shopName || shopifyShopId.replace('.myshopify.com', ''),
      p_owner_name: shopOwnerName || null
    });

    if (userError) {
      console.error('[createShopifyUserAndCompany] User creation RPC error:', JSON.stringify(userError, null, 2));
      throw new Error(`Failed to create user via RPC create_auth_user_for_shopify: ${userError.message} (code: ${userError.code}, details: ${userError.details || 'none'})`);
    }

    if (!userId) {
      console.error('[createShopifyUserAndCompany] User creation returned no user ID');
      throw new Error('RPC create_auth_user_for_shopify returned no user ID - function may not exist or returned null');
    }

    console.log(`[createShopifyUserAndCompany] User created successfully: ${userId}`);

    // 2. Create the company with owner_id
    const extractedShopName = shopName || shopifyShopId.replace('.myshopify.com', '');

    console.log(`[createShopifyUserAndCompany] Creating company via RPC with owner_id=${userId}...`);
    const { data: companyId, error: companyError } = await supabase.rpc('create_shopify_company', {
      p_shopify_shop_id: shopifyShopId,
      p_owner_id: userId,
      p_shop_name: extractedShopName,
      p_shop_domain: shopifyShopId,
      p_owner_email: shopOwnerEmail,
      p_owner_first_name: shopOwnerName ? shopOwnerName.split(' ')[0] : null,
      p_owner_last_name: shopOwnerName ? shopOwnerName.split(' ').slice(1).join(' ') || null : null
    });

    if (companyError) {
      console.error('[createShopifyUserAndCompany] Company creation RPC error:', JSON.stringify(companyError, null, 2));
      throw new Error(`Failed to create company via RPC create_shopify_company: ${companyError.message} (code: ${companyError.code}, details: ${companyError.details || 'none'})`);
    }

    if (!companyId) {
      console.error('[createShopifyUserAndCompany] Company creation returned no company ID');
      throw new Error('RPC create_shopify_company returned no company ID - function may not exist or returned null');
    }

    console.log(`[createShopifyUserAndCompany] Company created successfully: ${companyId} with owner_id=${userId}`);

    return { userId, companyId };
  } catch (error) {
    console.error(`[createShopifyUserAndCompany] FATAL ERROR:`, error);
    throw new Error(`Error creating Shopify user and company: ${error.message}`);
  }
};

/**
 * Inserts sales history data into the Supabase sales_history table.
 * Uses UPSERT with ON CONFLICT to prevent duplicates for Shopify orders.
 * Validates all data before insertion.
 * 
 * @param {Array<{
 *   company_id: string,
 *   sku: string,
 *   sale_date: string,
 *   quantity: number,
 *   revenue: number,
 *   source: string,
 *   metadata: object,
 *   shopify_order_id?: string,
 *   shopify_line_item_id?: string
 * }>} salesData - Array of sales data objects to insert (company_id must be UUID)
 * @param {Object} options - Options
 * @param {Object} options.logger - Logger for validation errors (optional)
 * @returns {Promise<{data: any, error: any, insertedCount: number, duplicatesSkipped: number, validationErrors: Array}>}
 * @throws {Error} If salesData is not an array or Supabase operation fails
 */
export const insertSalesHistory = async (salesData, options = {}) => {
  const { logger } = options;

  if (!Array.isArray(salesData)) {
    throw new Error("salesData must be an array");
  }

  if (salesData.length === 0) {
    return { data: [], error: null, insertedCount: 0, duplicatesSkipped: 0, validationErrors: [] };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 1. VALIDATION: Validate all entries before insertion
  // ═══════════════════════════════════════════════════════════════════
  const { validEntries, invalidEntries } = validateSalesHistoryBatch(salesData);

  // Log validation errors if logger provided
  if (invalidEntries.length > 0 && logger) {
    logger.warn({
      invalidCount: invalidEntries.length,
      totalCount: salesData.length,
      errors: invalidEntries.slice(0, 5) // Log first 5 errors
    }, '⚠️ Some sales_history entries failed validation');
  }

  // If no valid entries, return early
  if (validEntries.length === 0) {
    return {
      data: [],
      error: null,
      insertedCount: 0,
      duplicatesSkipped: 0,
      validationErrors: invalidEntries
    };
  }

  try {
    const supabase = getSupabaseClient();

    // ═══════════════════════════════════════════════════════════════════
    // 2. TRANSFORM: Add dedicated columns for Shopify IDs
    // ═══════════════════════════════════════════════════════════════════
    const transformedData = validEntries.map(sale => {
      // Extract Shopify IDs from metadata if not provided directly
      const shopifyOrderId = sale.shopify_order_id || sale.metadata?.shopify_order_id || null;
      const shopifyLineItemId = sale.shopify_line_item_id || sale.metadata?.shopify_line_item_id || null;

      return {
        company_id: sale.company_id,
        sku: sale.sku,
        sale_date: sale.sale_date,
        quantity: sale.quantity,
        revenue: sale.revenue || 0,
        source: sale.source || 'shopify',
        metadata: sale.metadata || {},
        // Dedicated columns for unique constraint
        shopify_order_id: shopifyOrderId,
        shopify_line_item_id: shopifyLineItemId
      };
    });

    // ═══════════════════════════════════════════════════════════════════
    // 3. INSERT: Use UPSERT to handle duplicates gracefully
    // ═══════════════════════════════════════════════════════════════════
    const { data, error } = await supabase
      .from("sales_history")
      .upsert(transformedData, {
        onConflict: 'company_id,shopify_order_id,shopify_line_item_id',
        ignoreDuplicates: true
      })
      .select('id');

    if (error) {
      // Handle unique constraint violation (expected for duplicates)
      if (error.code === '23505') {
        return { 
          data: [], 
          error: null, 
          insertedCount: 0,
          duplicatesSkipped: transformedData.length,
          validationErrors: invalidEntries,
          message: 'All records were duplicates'
        };
      }
      throw new Error(`Failed to insert sales history: ${error.message}`);
    }

    const insertedCount = data?.length || 0;
    const duplicatesSkipped = transformedData.length - insertedCount;

    return { 
      data, 
      error: null, 
      insertedCount,
      duplicatesSkipped,
      validationErrors: invalidEntries
    };
  } catch (error) {
    throw new Error(`Error inserting sales history to Supabase: ${error.message}`);
  }
};

/**
 * Synchronizes a Shopify location to Supabase warehouse.
 * Calls the PostgreSQL function sync_shopify_location which:
 * - Creates or updates a warehouse in the warehouses table
 * - Creates a mapping in shopify_location_mapping table
 * 
 * @param {string} companyId - The company UUID in Supabase
 * @param {string} shopifyLocationId - The Shopify location ID
 * @param {object} locationData - The location data from Shopify
 * @param {string} locationData.name - Location name
 * @param {string} [locationData.address1] - Address line 1
 * @param {string} [locationData.address2] - Address line 2  
 * @param {string} [locationData.city] - City
 * @param {string} [locationData.zip] - Postal code
 * @param {string} [locationData.country] - Country
 * @param {boolean} [locationData.active] - Whether location is active
 * @returns {Promise<string>} The warehouse UUID (created or updated)
 * @throws {Error} If the RPC call fails
 */
export const syncShopifyLocation = async (companyId, shopifyLocationId, locationData) => {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  if (!shopifyLocationId) {
    throw new Error("shopifyLocationId is required");
  }

  if (!locationData || !locationData.name) {
    throw new Error("locationData.name is required");
  }

  try {
    const supabase = getSupabaseClient();

    // Build full address from address1 and address2
    const addressParts = [
      locationData.address1,
      locationData.address2
    ].filter(Boolean);
    const fullAddress = addressParts.join(', ') || null;

    const { data, error } = await supabase.rpc('sync_shopify_location', {
      p_company_id: companyId,
      p_shopify_location_id: shopifyLocationId,
      p_name: locationData.name,
      p_address: fullAddress,
      p_city: locationData.city || null,
      p_postal_code: locationData.zip || null,
      p_country: locationData.country || 'France',
      p_is_active: locationData.active !== false // Default to true if not specified
    });

    if (error) {
      throw new Error(`Failed to sync Shopify location: ${error.message}`);
    }

    return data; // Returns warehouse UUID
  } catch (error) {
    throw new Error(`Error syncing Shopify location to Supabase: ${error.message}`);
  }
};

/**
 * Inserts unmapped product alerts into the Supabase unmapped_products table.
 * Tracks Shopify products/variants that don't have a mapping in productMapping.
 * 
 * @param {Array<{
 *   company_id: string,
 *   shopify_variant_id: string,
 *   shopify_sku: string,
 *   product_title: string,
 *   variant_title: string
 * }>} unmappedProducts - Array of unmapped product data
 * @returns {Promise<{data: any, error: any}>} The result from Supabase insert operation
 * @throws {Error} If unmappedProducts is not an array or Supabase operation fails
 */
export const insertUnmappedProducts = async (unmappedProducts) => {
  if (!Array.isArray(unmappedProducts)) {
    throw new Error("unmappedProducts must be an array");
  }

  if (unmappedProducts.length === 0) {
    return { data: [], error: null };
  }

  try {
    const supabase = getSupabaseClient();

    // Use upsert to update last_seen_at if the product already exists
    const { data, error } = await supabase
      .from("unmapped_products")
      .upsert(
        unmappedProducts.map(product => ({
          ...product,
          last_seen_at: new Date().toISOString()
        })),
        {
          onConflict: 'company_id,shopify_variant_id',
          ignoreDuplicates: false // Update last_seen_at
        }
      );

    if (error) {
      throw new Error(`Failed to insert unmapped products: ${error.message}`);
    }

    return { data, error };
  } catch (error) {
    throw new Error(`Error inserting unmapped products to Supabase: ${error.message}`);
  }
};

/**
 * Deletes sales history entries for a specific order.
 * Used when an order is updated or cancelled to remove old data before re-inserting.
 * 
 * @param {string} companyId - The company UUID in Supabase
 * @param {string} shopifyOrderId - The Shopify order ID
 * @returns {Promise<{data: any, error: any}>} The result from Supabase delete operation
 * @throws {Error} If the delete operation fails
 */
/**
 * Deletes sales history entries for a specific Shopify order.
 * Uses the dedicated shopify_order_id column for better performance.
 * Also deletes associated cancellation entries (suffixed with _cancel).
 * 
 * @param {string} companyId - The company UUID in Supabase
 * @param {string} shopifyOrderId - The Shopify order ID
 * @param {Object} options - Options
 * @param {boolean} options.includeCancellations - Also delete cancellation entries (default: false)
 * @returns {Promise<{data: any, error: any, deletedCount: number}>}
 */
/**
 * Updates billing/subscription information for a company in Supabase.
 * Syncs the Shopify subscription status to Supabase for visibility.
 * 
 * @param {string} companyId - The company UUID in Supabase
 * @param {object} billingData - The billing data to update
 * @param {string} [billingData.subscriptionPlan] - Plan name (basic, pro, plus)
 * @param {string} [billingData.subscriptionStatus] - Status (active, cancelled, frozen, pending, trial)
 * @param {string} [billingData.shopifySubscriptionId] - Shopify subscription GraphQL ID
 * @param {Date} [billingData.trialStartedAt] - Trial start date
 * @param {Date} [billingData.trialEndsAt] - Trial end date
 * @param {Date} [billingData.billingActivatedAt] - Billing activation date
 * @param {number} [billingData.maxSyncLocations] - Max locations for plan
 * @returns {Promise<boolean>} True if update was successful
 * @throws {Error} If the update fails
 */
export const updateCompanyBilling = async (companyId, billingData) => {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase.rpc('update_company_billing', {
      p_company_id: companyId,
      p_subscription_plan: billingData.subscriptionPlan || null,
      p_subscription_status: billingData.subscriptionStatus || null,
      p_shopify_subscription_id: billingData.shopifySubscriptionId || null,
      p_trial_started_at: billingData.trialStartedAt ? new Date(billingData.trialStartedAt).toISOString() : null,
      p_trial_ends_at: billingData.trialEndsAt ? new Date(billingData.trialEndsAt).toISOString() : null,
      p_billing_activated_at: billingData.billingActivatedAt ? new Date(billingData.billingActivatedAt).toISOString() : null,
      p_max_sync_locations: billingData.maxSyncLocations || null
    });

    if (error) {
      throw new Error(`Failed to update company billing: ${error.message}`);
    }

    return data === true;
  } catch (error) {
    throw new Error(`Error updating company billing in Supabase: ${error.message}`);
  }
};

/**
 * Updates billing info by Shopify shop ID (domain).
 * Finds the company by shopify_shop_id and updates billing.
 * 
 * @param {string} shopifyShopId - The Shopify shop ID (e.g., "mystore.myshopify.com")
 * @param {object} billingData - The billing data to update
 * @returns {Promise<boolean>} True if update was successful
 */
export const updateCompanyBillingByShopifyId = async (shopifyShopId, billingData) => {
  if (!shopifyShopId) {
    throw new Error("shopifyShopId is required");
  }

  try {
    const supabase = getSupabaseClient();

    // First, find the company by Shopify shop ID
    const { data: company, error: findError } = await supabase
      .from('companies')
      .select('id')
      .eq('shopify_shop_id', shopifyShopId)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Failed to find company: ${findError.message}`);
    }

    if (!company) {
      // Company not found - might not be synced yet
      return false;
    }

    // Update the billing info
    return await updateCompanyBilling(company.id, billingData);
  } catch (error) {
    throw new Error(`Error updating company billing by Shopify ID: ${error.message}`);
  }
};

export const deleteSalesHistoryByOrderId = async (companyId, shopifyOrderId, options = {}) => {
  const { includeCancellations = false } = options;

  if (!companyId) {
    throw new Error("companyId is required");
  }

  if (!shopifyOrderId) {
    throw new Error("shopifyOrderId is required");
  }

  try {
    const supabase = getSupabaseClient();
    let totalDeleted = 0;

    // Delete main order entries using dedicated column (faster than JSON extraction)
    const { data: mainData, error: mainError, count: mainCount } = await supabase
      .from("sales_history")
      .delete()
      .eq('company_id', companyId)
      .eq('shopify_order_id', shopifyOrderId)
      .select('id');

    if (mainError) {
      throw new Error(`Failed to delete sales history: ${mainError.message}`);
    }

    totalDeleted += mainData?.length || 0;

    // Also delete cancellation entries if requested
    if (includeCancellations) {
      const cancellationOrderId = `${shopifyOrderId}_cancel`;
      const { data: cancelData, error: cancelError } = await supabase
        .from("sales_history")
        .delete()
        .eq('company_id', companyId)
        .eq('shopify_order_id', cancellationOrderId)
        .select('id');

      if (cancelError) {
        throw new Error(`Failed to delete cancellation entries: ${cancelError.message}`);
      }

      totalDeleted += cancelData?.length || 0;
    }

    // Fallback: also try to delete using metadata (for legacy entries)
    const { data: legacyData, error: legacyError } = await supabase
      .from("sales_history")
      .delete()
      .eq('company_id', companyId)
      .is('shopify_order_id', null) // Only entries without dedicated column
      .eq('metadata->>shopify_order_id', shopifyOrderId)
      .select('id');

    if (!legacyError && legacyData) {
      totalDeleted += legacyData.length;
    }

    return { 
      data: mainData, 
      error: null, 
      deletedCount: totalDeleted 
    };
  } catch (error) {
    throw new Error(`Error deleting sales history from Supabase: ${error.message}`);
  }
};