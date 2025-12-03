-- ============================================
-- Migration: Add billing columns to companies
-- Date: 2024-12-03
-- Description: Add subscription/billing columns to track Shopify App Store plans
-- ============================================

-- ============================================
-- 1. ADD BILLING COLUMNS TO COMPANIES TABLE
-- ============================================

-- Subscription plan (basic, pro, plus)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'basic';

-- Subscription status
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending' 
CHECK (subscription_status IN ('active', 'cancelled', 'frozen', 'pending', 'trial'));

-- Shopify subscription ID (for reference)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS shopify_subscription_id TEXT;

-- Trial dates
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;

-- Billing activation date
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS billing_activated_at TIMESTAMP WITH TIME ZONE;

-- Max sync locations based on plan (for future multi-location feature)
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS max_sync_locations INTEGER DEFAULT 1;

-- ============================================
-- 2. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN public.companies.subscription_plan IS 'Shopify App Store plan: basic, pro, plus';
COMMENT ON COLUMN public.companies.subscription_status IS 'Subscription status: active, cancelled, frozen, pending, trial';
COMMENT ON COLUMN public.companies.shopify_subscription_id IS 'Shopify subscription GraphQL ID';
COMMENT ON COLUMN public.companies.trial_started_at IS 'When the trial period started';
COMMENT ON COLUMN public.companies.trial_ends_at IS 'When the trial period ends';
COMMENT ON COLUMN public.companies.billing_activated_at IS 'When the merchant activated billing';
COMMENT ON COLUMN public.companies.max_sync_locations IS 'Max sync locations based on plan: basic=1, pro=3, plus=15';

-- ============================================
-- 3. CREATE INDEX FOR SUBSCRIPTION STATUS QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_companies_subscription_status 
ON public.companies(subscription_status);

CREATE INDEX IF NOT EXISTS idx_companies_subscription_plan 
ON public.companies(subscription_plan);

-- ============================================
-- 4. CREATE FUNCTION TO UPDATE COMPANY BILLING
-- ============================================

CREATE OR REPLACE FUNCTION public.update_company_billing(
  p_company_id UUID,
  p_subscription_plan TEXT DEFAULT NULL,
  p_subscription_status TEXT DEFAULT NULL,
  p_shopify_subscription_id TEXT DEFAULT NULL,
  p_trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_billing_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_max_sync_locations INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies
  SET
    subscription_plan = COALESCE(p_subscription_plan, subscription_plan),
    subscription_status = COALESCE(p_subscription_status, subscription_status),
    shopify_subscription_id = COALESCE(p_shopify_subscription_id, shopify_subscription_id),
    trial_started_at = COALESCE(p_trial_started_at, trial_started_at),
    trial_ends_at = COALESCE(p_trial_ends_at, trial_ends_at),
    billing_activated_at = COALESCE(p_billing_activated_at, billing_activated_at),
    max_sync_locations = COALESCE(p_max_sync_locations, max_sync_locations),
    updated_at = NOW()
  WHERE id = p_company_id;
  
  RETURN FOUND;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_company_billing TO service_role;

-- ============================================
-- 5. CREATE FUNCTION TO GET BILLING STATUS BY SHOPIFY SHOP ID
-- ============================================

CREATE OR REPLACE FUNCTION public.get_company_billing_by_shopify_id(
  p_shopify_shop_id TEXT
)
RETURNS TABLE (
  company_id UUID,
  subscription_plan TEXT,
  subscription_status TEXT,
  shopify_subscription_id TEXT,
  trial_started_at TIMESTAMP WITH TIME ZONE,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  billing_activated_at TIMESTAMP WITH TIME ZONE,
  max_sync_locations INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS company_id,
    c.subscription_plan,
    c.subscription_status,
    c.shopify_subscription_id,
    c.trial_started_at,
    c.trial_ends_at,
    c.billing_activated_at,
    c.max_sync_locations
  FROM public.companies c
  WHERE c.shopify_shop_id = p_shopify_shop_id
  LIMIT 1;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_company_billing_by_shopify_id TO service_role;

-- ============================================
-- 6. UPDATE EXISTING COMPANIES WITH DEFAULT VALUES
-- ============================================

-- Set all existing companies to 'trial' status if they don't have a status yet
UPDATE public.companies
SET 
  subscription_status = 'trial',
  trial_started_at = created_at,
  trial_ends_at = created_at + INTERVAL '14 days'
WHERE subscription_status IS NULL OR subscription_status = 'pending';

