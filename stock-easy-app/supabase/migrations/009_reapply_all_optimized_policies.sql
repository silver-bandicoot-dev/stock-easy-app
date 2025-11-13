-- Migration 009: Réappliquer TOUTES les policies avec optimisation complète
-- Force la recréation de toutes les policies avec (SELECT auth.xxx())

-- ==========================================
-- 1. PRODUITS (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_products_select" ON public.produits;
DROP POLICY IF EXISTS "auth_products_all" ON public.produits;

CREATE POLICY "auth_products_select" 
  ON public.produits 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_products_all" 
  ON public.produits 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 2. COMMANDES (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_orders_select" ON public.commandes;
DROP POLICY IF EXISTS "auth_orders_all" ON public.commandes;

CREATE POLICY "auth_orders_select" 
  ON public.commandes 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_orders_all" 
  ON public.commandes 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 3. ARTICLES_COMMANDE (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_order_items_select" ON public.articles_commande;
DROP POLICY IF EXISTS "auth_order_items_all" ON public.articles_commande;

CREATE POLICY "auth_order_items_select" 
  ON public.articles_commande 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_order_items_all" 
  ON public.articles_commande 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 4. FOURNISSEURS (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_suppliers_select" ON public.fournisseurs;
DROP POLICY IF EXISTS "auth_suppliers_all" ON public.fournisseurs;

CREATE POLICY "auth_suppliers_select" 
  ON public.fournisseurs 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_suppliers_all" 
  ON public.fournisseurs 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 5. WAREHOUSES (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_warehouses_select" ON public.warehouses;
DROP POLICY IF EXISTS "auth_warehouses_all" ON public.warehouses;

CREATE POLICY "auth_warehouses_select" 
  ON public.warehouses 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_warehouses_all" 
  ON public.warehouses 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 6. PARAMETRES (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_parameters_select" ON public.parametres;
DROP POLICY IF EXISTS "auth_parameters_all" ON public.parametres;

CREATE POLICY "auth_parameters_select" 
  ON public.parametres 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_parameters_all" 
  ON public.parametres 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 7. SKU_FOURNISSEURS (2 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_sku_suppliers_select" ON public.sku_fournisseurs;
DROP POLICY IF EXISTS "auth_sku_suppliers_all" ON public.sku_fournisseurs;

CREATE POLICY "auth_sku_suppliers_select" 
  ON public.sku_fournisseurs 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_sku_suppliers_all" 
  ON public.sku_fournisseurs 
  FOR ALL 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 8. KPI_HISTORY (4 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_kpi_select" ON public.kpi_history;
DROP POLICY IF EXISTS "auth_kpi_all" ON public.kpi_history;
DROP POLICY IF EXISTS "Users can view their own kpi_history" ON public.kpi_history;
DROP POLICY IF EXISTS "Users can insert their own kpi_history" ON public.kpi_history;

-- Recréer avec optimisation
CREATE POLICY "auth_kpi_select" 
  ON public.kpi_history 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_kpi_insert" 
  ON public.kpi_history 
  FOR INSERT 
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_kpi_update" 
  ON public.kpi_history 
  FOR UPDATE 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_kpi_delete" 
  ON public.kpi_history 
  FOR DELETE 
  USING ((SELECT auth.role()) = 'authenticated');

-- ==========================================
-- 9. USER_PROFILES (3 policies)
-- ==========================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = id);

-- ==========================================
-- 10. COMPANIES (4 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_companies_select" ON public.companies;
DROP POLICY IF EXISTS "auth_companies_insert" ON public.companies;
DROP POLICY IF EXISTS "auth_companies_update" ON public.companies;
DROP POLICY IF EXISTS "auth_companies_delete" ON public.companies;

CREATE POLICY "auth_companies_select" 
  ON public.companies 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_companies_insert" 
  ON public.companies 
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = owner_id);

CREATE POLICY "auth_companies_update" 
  ON public.companies 
  FOR UPDATE 
  USING ((SELECT auth.uid()) = owner_id);

CREATE POLICY "auth_companies_delete" 
  ON public.companies 
  FOR DELETE 
  USING ((SELECT auth.uid()) = owner_id);

-- ==========================================
-- 11. COMMENTS (4 policies)
-- ==========================================
DROP POLICY IF EXISTS "auth_comments_select" ON public.comments;
DROP POLICY IF EXISTS "auth_comments_insert" ON public.comments;
DROP POLICY IF EXISTS "auth_comments_update" ON public.comments;
DROP POLICY IF EXISTS "auth_comments_delete" ON public.comments;

CREATE POLICY "auth_comments_select" 
  ON public.comments 
  FOR SELECT 
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "auth_comments_insert" 
  ON public.comments 
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "auth_comments_update" 
  ON public.comments 
  FOR UPDATE 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "auth_comments_delete" 
  ON public.comments 
  FOR DELETE 
  USING ((SELECT auth.uid()) = user_id);

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Total policies RLS optimisées: %', policy_count;
END $$;

