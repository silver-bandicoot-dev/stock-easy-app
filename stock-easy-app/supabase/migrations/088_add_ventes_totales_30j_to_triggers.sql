-- ============================================
-- Migration 088: Ajout du calcul automatique de ventes_totales_30j
-- ============================================
-- 
-- PROBLÈME RÉSOLU:
-- La colonne ventes_totales_30j n'était pas calculée automatiquement par les triggers.
-- Elle n'était mise à jour que par l'action Gadget syncSalesMetrics.js qui n'est pas
-- appelée systématiquement.
--
-- SOLUTION:
-- Modifier les triggers existants pour calculer AUSSI ventes_totales_30j
-- en plus de ventes_jour_moy_30j.
--
-- FORMULES:
-- - ventes_totales_30j = SUM(quantity) sur les 30 derniers jours (total)
-- - ventes_jour_moy_30j = ventes_totales_30j / nombre_de_jours (moyenne/jour)
--
-- Date: 2025-12-05
-- ============================================

-- ============================================
-- 1. VÉRIFIER/CRÉER LA COLONNE ventes_totales_30j
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'produits' 
    AND column_name = 'ventes_totales_30j'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN ventes_totales_30j INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne ventes_totales_30j créée';
  ELSE
    RAISE NOTICE '✅ Colonne ventes_totales_30j existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. METTRE À JOUR LA FONCTION SUR sales_history
-- ============================================
-- Cette fonction se déclenche quand une vente est ajoutée/modifiée/supprimée
-- Elle calcule maintenant AUSSI ventes_totales_30j

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
  
  -- Calculer les ventes sur les 30 derniers jours (INCLURE aujourd'hui)
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
  
  -- Calculer la moyenne quotidienne
  v_avg_daily_sales := v_total_sales / v_days_count;
  
  -- Mettre à jour le produit avec LES DEUX colonnes
  UPDATE public.produits
  SET 
    ventes_totales_30j = ROUND(v_total_sales)::INTEGER,  -- Total des ventes
    ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4),   -- Moyenne par jour
    updated_at = NOW()
  WHERE company_id = v_company_id
    AND sku = v_sku;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.update_ventes_jour_moy_30j_on_sales_change() IS 
'Met à jour ventes_totales_30j ET ventes_jour_moy_30j quand une vente change dans sales_history.
- ventes_totales_30j = Total des unités vendues sur 30 jours
- ventes_jour_moy_30j = Moyenne des ventes par jour
CORRIGÉ (088): Calcule maintenant aussi ventes_totales_30j automatiquement.';

-- ============================================
-- 3. METTRE À JOUR LA FONCTION SUR produits
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
  
  -- Calculer les ventes sur les 30 derniers jours (INCLURE aujourd'hui)
  SELECT 
    COALESCE(SUM(quantity), 0),
    GREATEST(COUNT(DISTINCT sale_date), 1)  -- Au moins 1 jour
  INTO 
    v_total_sales,
    v_days_count
  FROM public.sales_history
  WHERE company_id = v_company_id
    AND sku = NEW.sku
    AND sale_date >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Calculer la moyenne quotidienne
  v_avg_daily_sales := v_total_sales / v_days_count;
  
  -- Mettre à jour LES DEUX colonnes
  NEW.ventes_totales_30j := ROUND(v_total_sales)::INTEGER;
  NEW.ventes_jour_moy_30j := ROUND(v_avg_daily_sales, 4);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_ventes_jour_moy_30j() IS 
'Calcule automatiquement ventes_totales_30j ET ventes_jour_moy_30j avant INSERT/UPDATE.
- ventes_totales_30j = Total des unités vendues sur 30 jours
- ventes_jour_moy_30j = Moyenne des ventes par jour
CORRIGÉ (088): Calcule maintenant aussi ventes_totales_30j automatiquement.';

-- ============================================
-- 4. RECALCULER POUR TOUS LES PRODUITS EXISTANTS
-- ============================================

DO $$
DECLARE
  v_product RECORD;
  v_total_sales NUMERIC;
  v_days_count INTEGER;
  v_avg_daily_sales NUMERIC;
  v_multiplicateur NUMERIC;
  v_updated INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Recalcul de ventes_totales_30j et ventes_jour_moy_30j pour tous les produits...';
  
  -- Pour chaque produit
  FOR v_product IN 
    SELECT DISTINCT p.sku, p.company_id, p.multiplicateur_prevision
    FROM public.produits p
  LOOP
    -- Calculer les ventes des 30 derniers jours
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
      ventes_totales_30j = ROUND(v_total_sales)::INTEGER,
      ventes_jour_moy_30j = ROUND(v_avg_daily_sales, 4),
      ventes_jour_ajustees = ROUND(v_avg_daily_sales * v_multiplicateur, 4),
      updated_at = NOW()
    WHERE company_id = v_product.company_id
      AND sku = v_product.sku;
    
    IF v_total_sales > 0 THEN
      v_updated := v_updated + 1;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ % produit(s) avec ventes recalculés', v_updated;
END $$;

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_products_with_sales INTEGER;
  v_total_products INTEGER;
  v_sample RECORD;
BEGIN
  SELECT COUNT(*) INTO v_products_with_sales FROM public.produits WHERE ventes_totales_30j > 0;
  SELECT COUNT(*) INTO v_total_products FROM public.produits;
  
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 088 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Colonne ventes_totales_30j vérifiée/créée';
  RAISE NOTICE '   ✅ Fonction update_ventes_jour_moy_30j_on_sales_change() mise à jour';
  RAISE NOTICE '   ✅ Fonction calculate_ventes_jour_moy_30j() mise à jour';
  RAISE NOTICE '   ✅ Produits existants recalculés';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES:';
  RAISE NOTICE '   - Produits avec ventes > 0: %', v_products_with_sales;
  RAISE NOTICE '   - Total produits: %', v_total_products;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 NOUVELLES FONCTIONNALITÉS:';
  RAISE NOTICE '   Les triggers calculent maintenant AUTOMATIQUEMENT:';
  RAISE NOTICE '   - ventes_totales_30j = Total des unités vendues sur 30 jours';
  RAISE NOTICE '   - ventes_jour_moy_30j = Moyenne des ventes par jour';
  RAISE NOTICE '   - ventes_jour_ajustees = Moyenne × multiplicateur';
  RAISE NOTICE '';
  RAISE NOTICE '📝 L''action Gadget syncSalesMetrics.js est maintenant OBSOLÈTE';
  RAISE NOTICE '   car les triggers gèrent tout automatiquement.';
  
  -- Afficher un exemple
  SELECT sku, ventes_totales_30j, ventes_jour_moy_30j, ventes_jour_ajustees
  INTO v_sample
  FROM public.produits
  WHERE ventes_totales_30j > 0
  LIMIT 1;
  
  IF v_sample IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📦 EXEMPLE:';
    RAISE NOTICE '   SKU: %', v_sample.sku;
    RAISE NOTICE '   ventes_totales_30j: %', v_sample.ventes_totales_30j;
    RAISE NOTICE '   ventes_jour_moy_30j: %', v_sample.ventes_jour_moy_30j;
    RAISE NOTICE '   ventes_jour_ajustees: %', v_sample.ventes_jour_ajustees;
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 088
-- ============================================

