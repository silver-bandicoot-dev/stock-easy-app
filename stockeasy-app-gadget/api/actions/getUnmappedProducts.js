import { getSupabaseClient } from "../lib/supabase";

/**
 * Action to retrieve unmapped products for a specific shop/company
 * Used by StockEasy frontend to display the unmapped products dashboard
 * 
 * @type { ActionRun }
 */
export const run = async ({ params, logger, api }) => {
  const { shopId, limit = 100, offset = 0 } = params;

  if (!shopId) {
    throw new Error("shopId is required");
  }

  logger.info({ shopId, limit, offset }, "Fetching unmapped products");

  // Get shop to retrieve company ID
  const shop = await api.shopifyShop.findOne(shopId, {
    select: {
      id: true,
      stockEasyCompanyId: true,
      domain: true
    }
  });

  if (!shop.stockEasyCompanyId) {
    throw new Error(`Shop ${shopId} does not have a stockEasyCompanyId configured`);
  }

  const companyId = shop.stockEasyCompanyId;
  const supabase = getSupabaseClient();

  // Fetch unmapped products with pagination
  const { data: unmappedProducts, error, count } = await supabase
    .from("unmapped_products")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("last_seen_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error({ error }, "Failed to fetch unmapped products");
    throw new Error(`Failed to fetch unmapped products: ${error.message}`);
  }

  // Get summary stats
  const { data: stats, error: statsError } = await supabase
    .from("unmapped_products")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);

  const totalCount = count || 0;

  // Get products seen in last 24h
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("unmapped_products")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .gte("last_seen_at", yesterday);

  logger.info({ 
    totalCount, 
    recentCount: recentCount || 0,
    returned: unmappedProducts?.length || 0 
  }, "Fetched unmapped products");

  return {
    products: unmappedProducts || [],
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    },
    stats: {
      totalUnmapped: totalCount,
      seenInLast24h: recentCount || 0
    }
  };
};

export const params = {
  shopId: { type: "string" },
  limit: { type: "number" },
  offset: { type: "number" }
};

/** @type { ActionOptions } */
export const options = {
  triggers: {
    api: true
  }
};


