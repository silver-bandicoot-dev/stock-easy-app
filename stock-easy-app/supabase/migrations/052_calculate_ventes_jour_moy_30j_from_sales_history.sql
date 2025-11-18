-- ============================================
-- Migration 052: Calcul automatique de ventes_jour_moy_30j depuis sales_history
-- ============================================
-- Cette migration crée un trigger qui calcule automatiquement
-- ventes_jour_moy_30j à partir de l'historique des ventes des 30 derniers jours
-- 
-- Problème résolu:
-- - Les nouveaux produits n'avaient pas ventes_jour_moy_30j calculé
-- - La rotation et autres métriques dépendaient de cette valeur
-- - Le ML ne chargeait pas les nouveaux produits

-- ============================================
-- 1. FONCTION POUR CALCULER ventes_jour_moy_30j
-- ============================================

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
  
  -- Si pas de company_id, essayer de le récupérer
  IF v_company_id IS NULL THEN
    v_company_id := public.get_current_user_company_id();
  END IF;
  
  -- Calculer la moyenne des ventes sur les 30 derniers jours
  SELECT 
    COALESCE(SUM(quantity), 0),
    COUNT(DISTINCT sale_date)
  INTO 
    v_total_sales,
    v_days_count
  FROM public.sales_history
  WHERE company_id = v_company_id
    AND sku = NEW.sku
    AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
    AND sale_date < CURRENT_DATE;
  
  -- Calculer la moyenne quotidienne
  -- Si on a des ventes sur moins de 30 jours, on divise par le nombre de jours réels
  -- Sinon, on divise par 30 pour avoir une moyenne sur 30 jours
  IF v_days_count > 0 THEN
    v_avg_daily_sales := v_total_sales / GREATEST(v_days_count, 1);
  ELSE
    v_avg_daily_sales := 0;
  END IF;
  
  -- Mettre à jour ventes_jour_moy_30j
  NEW.ventes_jour_moy_30j := ROUND(v_avg_daily_sales, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_ventes_jour_moy_30j() IS 
'Calcule automatiquement ventes_jour_moy_30j à partir de l''historique des ventes des 30 derniers jours.
S''exécute avant INSERT/UPDATE pour garantir que la valeur est toujours à jour.';

-- ============================================
-- 2. CRÉER LE TRIGGER SUR PRODUITS
-- ============================================

DROP TRIGGER IF EXISTS trigger_calculate_ventes_jour_moy_30j ON public.produits;

-- Ce trigger doit s'exécuter AVANT le trigger qui calcule ventes_jour_ajustees
-- pour que ventes_jour_moy_30j soit disponible
CREATE TRIGGER trigger_calculate_ventes_jour_moy_30j
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ventes_jour_moy_30j();

COMMENT ON TRIGGER trigger_calculate_ventes_jour_moy_30j ON public.produits IS 
'Calcule automatiquement ventes_jour_moy_30j avant INSERT/UPDATE.
S''exécute avant les autres triggers pour garantir que ventes_jour_moy_30j est toujours à jour.';

-- ============================================
-- 3. CRÉER LE TRIGGER SUR SALES_HISTORY
-- ============================================
-- Quand une nouvelle vente est ajoutée, recalculer ventes_jour_moy_30j pour le produit concerné

CREATE OR REPLACE FUNCTION public.update_ventes_jour_moy_30j_on_sales_change()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id uuid;
  v_total_sales NUMERIC := 0;
  v_days_count INTEGER := 0;
  v_avg_daily_sales NUMERIC := 0;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id
  v_company_id := COALESCE(NEW.company_id, OLD.company_id, public.get_current_user_company_id());
  
  -- Calculer la nouvelle moyenne
  SELECT 
    COALESCE(SUM(quantity), 0),
    COUNT(DISTINCT sale_date)
  INTO 
    v_total_sales,
    v_days_count
  FROM public.sales_history
  WHERE company_id = v_company_id
    AND sku = COALESCE(NEW.sku, OLD.sku)
    AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
    AND sale_date < CURRENT_DATE;
  
  -- Calculer la moyenne quotidienne
  IF v_days_count > 0 THEN
    v_avg_daily_sales := v_total_sales / GREATEST(v_days_count, 1);
  ELSE
    v_avg_daily_sales := 0;
  END IF;
  
  -- Mettre à jour le produit
  UPDATE public.produits
  SET ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4),
      updated_at = NOW()
  WHERE company_id = v_company_id
    AND sku = COALESCE(NEW.sku, OLD.sku);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_ventes_jour_moy_30j_on_sales_change() IS 
'Met à jour ventes_jour_moy_30j quand une vente est ajoutée/modifiée/supprimée dans sales_history.';

DROP TRIGGER IF EXISTS trigger_update_ventes_jour_moy_30j_on_sales ON public.sales_history;

CREATE TRIGGER trigger_update_ventes_jour_moy_30j_on_sales
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_history
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ventes_jour_moy_30j_on_sales_change();

COMMENT ON TRIGGER trigger_update_ventes_jour_moy_30j_on_sales ON public.sales_history IS 
'Met à jour automatiquement ventes_jour_moy_30j quand l''historique des ventes change.';

-- ============================================
-- 4. METTRE À JOUR LES PRODUITS EXISTANTS
-- ============================================

DO $$
DECLARE
  v_updated_count INTEGER;
  v_product RECORD;
  v_total_sales NUMERIC;
  v_days_count INTEGER;
  v_avg_daily_sales NUMERIC;
BEGIN
  RAISE NOTICE '🔄 Recalcul de ventes_jour_moy_30j pour tous les produits...';
  
  v_updated_count := 0;
  
  FOR v_product IN 
    SELECT DISTINCT p.sku, p.company_id
    FROM public.produits p
  LOOP
    -- Calculer la moyenne pour ce produit
    SELECT 
      COALESCE(SUM(quantity), 0),
      COUNT(DISTINCT sale_date)
    INTO 
      v_total_sales,
      v_days_count
    FROM public.sales_history
    WHERE company_id = v_product.company_id
      AND sku = v_product.sku
      AND sale_date >= CURRENT_DATE - INTERVAL '30 days'
      AND sale_date < CURRENT_DATE;
    
    -- Calculer la moyenne quotidienne
    IF v_days_count > 0 THEN
      v_avg_daily_sales := v_total_sales / GREATEST(v_days_count, 1);
    ELSE
      v_avg_daily_sales := 0;
    END IF;
    
    -- Mettre à jour le produit
    UPDATE public.produits
    SET ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4)
    WHERE company_id = v_product.company_id
      AND sku = v_product.sku;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec ventes_jour_moy_30j recalculé', v_updated_count;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 052
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 052 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Fonction calculate_ventes_jour_moy_30j() créée';
  RAISE NOTICE '   ✅ Trigger sur produits pour calculer ventes_jour_moy_30j';
  RAISE NOTICE '   ✅ Trigger sur sales_history pour mettre à jour automatiquement';
  RAISE NOTICE '   ✅ Produits existants mis à jour';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Fonctionnalités:';
  RAISE NOTICE '   - Calcul automatique de ventes_jour_moy_30j à partir de sales_history';
  RAISE NOTICE '   - Mise à jour automatique quand de nouvelles ventes sont ajoutées';
  RAISE NOTICE '   - Les nouveaux produits auront ventes_jour_moy_30j calculé automatiquement';
  RAISE NOTICE '   - La rotation et autres métriques seront maintenant à jour';
END $$;

