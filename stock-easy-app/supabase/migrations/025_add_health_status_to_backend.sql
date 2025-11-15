-- ============================================
-- Migration 025: Ajouter health_status et health_percentage au backend
-- ============================================
-- Cette migration déplace les calculs de healthStatus et healthPercentage
-- du frontend vers le backend pour garantir la cohérence des données

-- ============================================
-- 1. AJOUTER LES COLONNES MANQUANTES
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne health_status si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'health_status'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN health_status TEXT DEFAULT 'healthy';
    RAISE NOTICE '✅ Colonne health_status ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne health_status existe déjà';
  END IF;

  -- Ajouter la colonne health_percentage si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'health_percentage'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN health_percentage INTEGER DEFAULT 100;
    RAISE NOTICE '✅ Colonne health_percentage ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne health_percentage existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. METTRE À JOUR LA FONCTION DE CALCUL
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_current_stock NUMERIC;
  v_moq INTEGER;
  v_security_stock INTEGER;
  v_reorder_point INTEGER;
  v_qty_to_order INTEGER;
  v_days_of_stock NUMERIC;
  v_security_stock_days NUMERIC; -- Stock de sécurité en jours (pas en unités)
  v_health_status TEXT;
  v_health_percentage INTEGER;
  v_buffer_days INTEGER := 7; -- Jours de buffer pour la quantité à commander
  v_ratio NUMERIC;
  v_security_120 NUMERIC;
  v_security_200 NUMERIC;
BEGIN
  SET search_path = public;

  -- ============================================
  -- RÉCUPÉRATION DES VALEURS
  -- ============================================
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);

  -- ============================================
  -- 1. CALCULER LE STOCK DE SÉCURITÉ (en jours)
  -- ============================================
  IF NEW.stock_secu_custom_jours IS NOT NULL AND NEW.stock_secu_custom_jours > 0 THEN
    v_security_stock_days := NEW.stock_secu_custom_jours;
  ELSE
    v_security_stock_days := GREATEST(1, v_lead_time * 0.2);
  END IF;
  
  -- Stock de sécurité en unités pour le stock_securite
  v_security_stock := GREATEST(1, CEIL(v_sales_per_day * v_security_stock_days));
  NEW.stock_securite := v_security_stock;

  -- ============================================
  -- 2. CALCULER LE POINT DE COMMANDE (REORDER POINT)
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL((v_sales_per_day * v_lead_time) + v_security_stock);
  ELSE
    v_reorder_point := v_moq;
  END IF;
  
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  NEW.point_commande := v_reorder_point;

  -- ============================================
  -- 3. CALCULER L'AUTONOMIE EN JOURS (DAYS OF STOCK)
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_days_of_stock := v_current_stock / v_sales_per_day;
    NEW.autonomie_jours := FLOOR(v_days_of_stock);
  ELSE
    v_days_of_stock := 999;
    NEW.autonomie_jours := 999;
  END IF;

  -- ============================================
  -- 4. CALCULER LA QUANTITÉ À COMMANDER
  -- ============================================
  IF v_current_stock <= v_reorder_point THEN
    v_qty_to_order := v_reorder_point - v_current_stock + CEIL(v_sales_per_day * v_buffer_days);
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    IF v_moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_moq) * v_moq;
    END IF;
    
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
  ELSE
    v_qty_to_order := 0;
  END IF;
  
  NEW.qte_a_commander := COALESCE(v_qty_to_order, 0);

  -- ============================================
  -- 5. CALCULER HEALTH STATUS ET HEALTH PERCENTAGE
  -- ============================================
  -- Priorité 1: Si qtyToOrder > 0, le produit est URGENT
  IF v_qty_to_order > 0 THEN
    v_health_status := 'urgent';
    -- Pourcentage basé sur daysOfStock / securityStock (entre 5% et 25%)
    IF v_security_stock_days > 0 THEN
      v_health_percentage := GREATEST(5, LEAST(25, FLOOR((v_days_of_stock / v_security_stock_days) * 25)));
    ELSE
      v_health_percentage := 5;
    END IF;
  ELSIF v_sales_per_day > 0 AND v_days_of_stock < v_security_stock_days THEN
    -- 🔴 URGENT: autonomie inférieure au stock de sécurité
    v_health_status := 'urgent';
    IF v_security_stock_days > 0 THEN
      v_health_percentage := GREATEST(5, LEAST(25, FLOOR((v_days_of_stock / v_security_stock_days) * 25)));
    ELSE
      v_health_percentage := 5;
    END IF;
  ELSIF v_sales_per_day > 0 AND v_days_of_stock < (v_security_stock_days * 1.2) THEN
    -- 🟡 WARNING: autonomie entre stock sécu et stock sécu × 1.2
    v_health_status := 'warning';
    -- Pourcentage entre 25% et 50%
    IF v_security_stock_days > 0 THEN
      v_ratio := (v_days_of_stock - v_security_stock_days) / (v_security_stock_days * 0.2);
      v_health_percentage := 25 + FLOOR(v_ratio * 25);
    ELSE
      v_health_percentage := 25;
    END IF;
  ELSE
    -- 🟢 HEALTHY: autonomie > stock sécu × 1.2
    v_health_status := 'healthy';
    IF v_sales_per_day > 0 AND v_security_stock_days > 0 AND v_days_of_stock > (v_security_stock_days * 1.2) THEN
      v_security_120 := v_security_stock_days * 1.2;
      v_security_200 := v_security_stock_days * 2;
      v_ratio := (v_days_of_stock - v_security_120) / v_security_200;
      v_health_percentage := LEAST(100, 50 + FLOOR(v_ratio * 50));
    ELSIF v_sales_per_day > 0 AND v_security_stock_days > 0 THEN
      v_health_percentage := 50;
    ELSE
      v_health_percentage := 100;
    END IF;
  END IF;

  NEW.health_status := v_health_status;
  NEW.health_percentage := v_health_percentage;

  -- Mettre à jour le timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_product_metrics() IS 
'Calcule automatiquement les métriques (stock sécurité, point commande, quantité à commander, autonomie, health_status, health_percentage) avant insertion/mise à jour';

-- ============================================
-- 3. RECALCULER TOUS LES PRODUITS EXISTANTS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM public.produits;
  
  RAISE NOTICE '🔄 Recalcul de % produit(s) avec health_status et health_percentage...', v_count;
  
  -- Forcer le trigger sur tous les produits
  UPDATE public.produits
  SET updated_at = COALESCE(updated_at, NOW());
  
  RAISE NOTICE '✅ % produit(s) recalculé(s)', v_count;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 025 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Colonnes health_status et health_percentage ajoutées';
  RAISE NOTICE '   ✅ Fonction calculate_product_metrics() mise à jour';
  RAISE NOTICE '   ✅ Tous les produits recalculés avec health_status et health_percentage';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les calculs de santé sont maintenant faits dans le backend!';
  RAISE NOTICE '   Le frontend peut maintenant utiliser directement ces valeurs.';
END $$;

