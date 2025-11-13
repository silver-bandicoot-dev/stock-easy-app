-- Migration 008: Nettoyer les policies en double et optimiser toutes les policies RLS
-- Supprime les anciennes policies et garde uniquement les nouvelles optimisées

-- ==========================================
-- 1. ARTICLES_COMMANDE
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view articles_commande" ON public.articles_commande;
DROP POLICY IF EXISTS "Authenticated users can insert articles_commande" ON public.articles_commande;
DROP POLICY IF EXISTS "Authenticated users can update articles_commande" ON public.articles_commande;
DROP POLICY IF EXISTS "Authenticated users can delete articles_commande" ON public.articles_commande;

-- ==========================================
-- 2. COMMANDES
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view commandes" ON public.commandes;
DROP POLICY IF EXISTS "Authenticated users can insert commandes" ON public.commandes;
DROP POLICY IF EXISTS "Authenticated users can update commandes" ON public.commandes;
DROP POLICY IF EXISTS "Authenticated users can delete commandes" ON public.commandes;

-- ==========================================
-- 3. FOURNISSEURS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view fournisseurs" ON public.fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can insert fournisseurs" ON public.fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can update fournisseurs" ON public.fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can delete fournisseurs" ON public.fournisseurs;

-- ==========================================
-- 4. PRODUITS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view produits" ON public.produits;
DROP POLICY IF EXISTS "Authenticated users can insert produits" ON public.produits;
DROP POLICY IF EXISTS "Authenticated users can update produits" ON public.produits;
DROP POLICY IF EXISTS "Authenticated users can delete produits" ON public.produits;

-- ==========================================
-- 5. SKU_FOURNISSEURS
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view sku_fournisseurs" ON public.sku_fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can insert sku_fournisseurs" ON public.sku_fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can update sku_fournisseurs" ON public.sku_fournisseurs;
DROP POLICY IF EXISTS "Authenticated users can delete sku_fournisseurs" ON public.sku_fournisseurs;

-- ==========================================
-- 6. WAREHOUSES
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can insert warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can update warehouses" ON public.warehouses;
DROP POLICY IF EXISTS "Authenticated users can delete warehouses" ON public.warehouses;

-- ==========================================
-- 7. PARAMETRES
-- ==========================================
DROP POLICY IF EXISTS "Authenticated users can view parametres" ON public.parametres;
DROP POLICY IF EXISTS "Authenticated users can insert parametres" ON public.parametres;
DROP POLICY IF EXISTS "Authenticated users can update parametres" ON public.parametres;

-- ==========================================
-- 8. KPI_HISTORY - Optimiser les anciennes policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own kpi_history" ON public.kpi_history;
DROP POLICY IF EXISTS "Users can insert their own kpi_history" ON public.kpi_history;

-- Recréer les policies kpi_history avec optimisation
CREATE POLICY "Users can view their own kpi_history" 
  ON public.kpi_history 
  FOR SELECT 
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert their own kpi_history" 
  ON public.kpi_history 
  FOR INSERT 
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- ==========================================
-- VÉRIFICATION FINALE
-- ==========================================

-- Compter les policies restantes (devrait être ~25)
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';
  
  RAISE NOTICE 'Nombre total de policies RLS: %', policy_count;
END $$;

-- Commentaire final
COMMENT ON SCHEMA public IS 'Toutes les policies RLS ont été nettoyées et optimisées';

