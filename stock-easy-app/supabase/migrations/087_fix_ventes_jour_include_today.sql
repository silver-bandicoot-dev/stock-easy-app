-- ============================================
-- Migration 087: Correction du calcul des ventes pour inclure aujourd'hui
-- ============================================
-- 
-- PROBLÈME RÉSOLU:
-- Les fonctions de calcul des ventes excluaient les ventes du jour actuel
-- avec la condition "sale_date < CURRENT_DATE". Cela empêchait les nouvelles
-- ventes Shopify d'être comptabilisées immédiatement dans les métriques.
--
-- SOLUTION:
-- Modification des 2 fonctions pour inclure les ventes d'aujourd'hui :
-- 1. update_ventes_jour_moy_30j_on_sales_change() - trigger sur sales_history
-- 2. calculate_ventes_jour_moy_30j() - trigger sur produits
--
-- Date: 2025-12-05
-- ============================================

-- ============================================
-- 1. CORRIGER LA FONCTION SUR sales_history
-- ============================================
-- Cette fonction se déclenche quand une vente est ajoutée/modifiée/supprimée

CREATE OR REPLACE FUNCTION public.update_ventes_jour_moy_30j_on_sales_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_sku TEXT;
  v_total_sales NUMERIC := 0;
  v_days_count INTEGER := 0;
  v_avg_daily_sales NUMERIC := 0;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id et sku selon l'opération
  v_company_id := COALESCE(NEW.company_id, OLD.company_id);
  v_sku := COALESCE(NEW.sku, OLD.sku);
  
  -- Vérifier que les valeurs sont valides
  IF v_company_id IS NULL OR v_sku IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculer la nouvelle moyenne sur les 30 derniers jours
  -- ✅ CORRECTION: Inclure les ventes d'aujourd'hui (suppression de "sale_date < CURRENT_DATE")
  SELECT 
    COALESCE(SUM(quantity), 0),
    GREATEST(COUNT(DISTINCT sale_date), 1)  -- Au moins 1 jour pour éviter division par 0
  INTO 
    v_total_sales,
    v_days_count
  FROM public.sales_history
  WHERE company_id = v_company_id
    AND sku = v_sku
    AND sale_date >= CURRENT_DATE - INTERVAL '30 days';
    -- ✅ SUPPRIMÉ: AND sale_date < CURRENT_DATE
  
  -- Calculer la moyenne quotidienne
  v_avg_daily_sales := v_total_sales / v_days_count;
  
  -- Mettre à jour le produit correspondant
  UPDATE public.produits
  SET ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4),
      updated_at = NOW()
  WHERE company_id = v_company_id
    AND sku = v_sku;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_ventes_jour_moy_30j_on_sales_change() IS 
'Met à jour ventes_jour_moy_30j quand une vente est ajoutée/modifiée/supprimée dans sales_history.
CORRIGÉ (087): Inclut désormais les ventes d''aujourd''hui dans le calcul.';

-- ============================================
-- 2. CORRIGER LA FONCTION SUR produits
-- ============================================
-- Cette fonction se déclenche avant INSERT/UPDATE sur produits

CREATE OR REPLACE FUNCTION public.calculate_ventes_jour_moy_30j()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_total_sales NUMERIC := 0;
  v_days_count INTEGER := 0;
  v_avg_daily_sales NUMERIC := 0;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id du produit
  v_company_id := NEW.company_id;
  
  -- Si pas de company_id, essayer de le récupérer via la fonction
  IF v_company_id IS NULL THEN
    v_company_id := public.get_current_user_company_id();
  END IF;
  
  -- Vérifier que company_id est valide
  IF v_company_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculer la moyenne des ventes sur les 30 derniers jours
  -- ✅ CORRECTION: Inclure les ventes d'aujourd'hui (suppression de "sale_date < CURRENT_DATE")
  SELECT 
    COALESCE(SUM(quantity), 0),
    GREATEST(COUNT(DISTINCT sale_date), 1)  -- Au moins 1 jour pour éviter division par 0
  INTO 
    v_total_sales,
    v_days_count
  FROM public.sales_history
  WHERE company_id = v_company_id
    AND sku = NEW.sku
    AND sale_date >= CURRENT_DATE - INTERVAL '30 days';
    -- ✅ SUPPRIMÉ: AND sale_date < CURRENT_DATE
  
  -- Calculer la moyenne quotidienne
  v_avg_daily_sales := v_total_sales / v_days_count;
  
  -- Mettre à jour ventes_jour_moy_30j
  NEW.ventes_jour_moy_30j := ROUND(v_avg_daily_sales, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_ventes_jour_moy_30j() IS 
'Calcule automatiquement ventes_jour_moy_30j à partir de l''historique des ventes des 30 derniers jours.
CORRIGÉ (087): Inclut désormais les ventes d''aujourd''hui dans le calcul.';

-- ============================================
-- 3. RECALCULER TOUS LES PRODUITS EXISTANTS
-- ============================================
-- Pour que les produits existants bénéficient immédiatement de la correction

DO $$
DECLARE
  v_product RECORD;
  v_total_sales NUMERIC;
  v_days_count INTEGER;
  v_avg_daily_sales NUMERIC;
  v_multiplicateur NUMERIC;
  v_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Recalcul de ventes_jour_moy_30j pour tous les produits avec ventes...';
  
  -- Pour chaque produit avec des ventes dans les 30 derniers jours
  FOR v_product IN 
    SELECT DISTINCT p.sku, p.company_id, p.multiplicateur_prevision
    FROM public.produits p
    WHERE EXISTS (
      SELECT 1 FROM public.sales_history sh 
      WHERE sh.sku = p.sku 
        AND sh.company_id = p.company_id
        AND sh.sale_date >= CURRENT_DATE - INTERVAL '30 days'
    )
  LOOP
    -- Calculer les ventes des 30 derniers jours (INCLURE aujourd'hui)
    SELECT 
      COALESCE(SUM(quantity), 0),
      GREATEST(COUNT(DISTINCT sale_date), 1)
    INTO v_total_sales, v_days_count
    FROM public.sales_history
    WHERE company_id = v_product.company_id
      AND sku = v_product.sku
      AND sale_date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculer la moyenne
    v_avg_daily_sales := v_total_sales / v_days_count;
    
    -- Récupérer le multiplicateur (défaut 1.2)
    v_multiplicateur := COALESCE(v_product.multiplicateur_prevision, 1.2);
    
    -- Mettre à jour le produit
    UPDATE public.produits
    SET 
      ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4),
      ventes_jour_ajustees = ROUND(v_avg_daily_sales * v_multiplicateur, 4),
      updated_at = NOW()
    WHERE company_id = v_product.company_id
      AND sku = v_product.sku;
    
    v_updated := v_updated + 1;
  END LOOP;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec ventes recalculées (incluant aujourd''hui)', v_updated;
END $$;

-- ============================================
-- 4. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_products_with_sales INTEGER;
  v_total_products INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_products_with_sales FROM public.produits WHERE ventes_jour_moy_30j > 0;
  SELECT COUNT(*) INTO v_total_products FROM public.produits;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 087 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Fonction update_ventes_jour_moy_30j_on_sales_change() corrigée';
  RAISE NOTICE '   ✅ Fonction calculate_ventes_jour_moy_30j() corrigée';
  RAISE NOTICE '   ✅ Produits existants recalculés';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '   - Produits avec ventes > 0: %', v_products_with_sales;
  RAISE NOTICE '   - Total produits: %', v_total_products;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 CORRECTION APPLIQUÉE:';
  RAISE NOTICE '   Les ventes d''aujourd''hui sont désormais incluses dans le calcul';
  RAISE NOTICE '   de ventes_jour_moy_30j. Les nouvelles commandes Shopify seront';
  RAISE NOTICE '   immédiatement reflétées dans les métriques.';
END $$;

-- ============================================
-- FIN DE LA MIGRATION 087
-- ============================================

