-- ============================================
-- Migration 022: Ajout et Calcul de la Colonne Investissement
-- ============================================
-- Cette migration ajoute la colonne investissement et calcule automatiquement
-- l'investissement nécessaire pour chaque produit (qte_a_commander * prix_achat)

-- ============================================
-- 1. AJOUTER LA COLONNE INVESTISSEMENT SI ELLE N'EXISTE PAS
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'investissement'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN investissement NUMERIC(10,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne investissement ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne investissement existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. MISE À JOUR DU TRIGGER POUR CALCULER L'INVESTISSEMENT
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_advanced_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_current_stock INTEGER;
  v_moq INTEGER;
  v_security_stock INTEGER;
  v_reorder_point INTEGER;
  v_qty_to_order INTEGER;
  v_days_of_stock INTEGER;
  v_buffer_days INTEGER := 7;
  v_max_stock INTEGER;
  v_stockout_risk INTEGER;
  v_overstock_risk INTEGER;
  v_storage_cost NUMERIC;
  v_potential_revenue NUMERIC;
  v_gross_margin NUMERIC;
  v_rotation_rate NUMERIC;
  v_priority INTEGER;
  v_projected_stock INTEGER;
  v_stockout_date TIMESTAMP;
  v_performance_score INTEGER;
  v_investment NUMERIC;
  v_buy_price NUMERIC;
BEGIN
  SET search_path = public;

  -- ============================================
  -- RÉCUPÉRATION DES VALEURS DE BASE
  -- ============================================
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);
  v_buy_price := COALESCE(NEW.prix_achat, 0);

  -- ============================================
  -- 1. STOCK DE SÉCURITÉ
  -- ============================================
  IF NEW.stock_secu_custom_jours IS NOT NULL AND NEW.stock_secu_custom_jours > 0 THEN
    v_security_stock := CEIL(v_sales_per_day * NEW.stock_secu_custom_jours);
  ELSE
    v_security_stock := GREATEST(1, CEIL(v_sales_per_day * v_lead_time * 0.2));
  END IF;
  NEW.stock_securite := v_security_stock;

  -- ============================================
  -- 2. POINT DE COMMANDE
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL((v_sales_per_day * v_lead_time) + v_security_stock);
  ELSE
    v_reorder_point := v_moq;
  END IF;
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  NEW.point_commande := v_reorder_point;

  -- ============================================
  -- 3. STOCK MAXIMUM RECOMMANDÉ
  -- ============================================
  v_max_stock := v_reorder_point + CEIL(v_moq * 1.5);
  NEW.stock_max := v_max_stock;

  -- ============================================
  -- 4. QUANTITÉ À COMMANDER
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
  -- 5. INVESTISSEMENT (qte_a_commander * prix_achat)
  -- ============================================
  v_investment := v_qty_to_order * v_buy_price;
  NEW.investissement := COALESCE(v_investment, 0);

  -- ============================================
  -- 6. AUTONOMIE EN JOURS
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_days_of_stock := FLOOR(v_current_stock / v_sales_per_day);
  ELSE
    v_days_of_stock := 999;
  END IF;
  NEW.autonomie_jours := v_days_of_stock;

  -- ============================================
  -- 7. RISQUE DE RUPTURE (0-100)
  -- ============================================
  IF v_days_of_stock = 0 THEN
    v_stockout_risk := 100;
  ELSIF v_days_of_stock <= v_lead_time * 0.5 THEN
    v_stockout_risk := 80;
  ELSIF v_days_of_stock <= v_lead_time THEN
    v_stockout_risk := 50;
  ELSIF v_days_of_stock <= v_lead_time * 1.5 THEN
    v_stockout_risk := 20;
  ELSE
    v_stockout_risk := 0;
  END IF;
  NEW.risque_rupture := v_stockout_risk;

  -- ============================================
  -- 8. RISQUE DE SURSTOCK (0-100)
  -- ============================================
  IF v_sales_per_day > 0 THEN
    IF v_current_stock >= v_max_stock * 1.5 THEN
      v_overstock_risk := 100;
    ELSIF v_current_stock >= v_max_stock * 1.2 THEN
      v_overstock_risk := 70;
    ELSIF v_current_stock >= v_max_stock THEN
      v_overstock_risk := 40;
    ELSIF v_current_stock >= v_reorder_point * 1.5 THEN
      v_overstock_risk := 20;
    ELSE
      v_overstock_risk := 0;
    END IF;
  ELSE
    v_overstock_risk := CASE WHEN v_current_stock > 0 THEN 80 ELSE 0 END;
  END IF;
  NEW.risque_surstock := v_overstock_risk;

  -- ============================================
  -- 9. COÛT DE STOCKAGE
  -- ============================================
  v_storage_cost := v_current_stock * COALESCE(NEW.cout_stockage_unitaire, 0.01);
  NEW.cout_stockage_total := v_storage_cost;

  -- ============================================
  -- 10. REVENU POTENTIEL & MARGE BRUTE
  -- ============================================
  v_potential_revenue := v_current_stock * COALESCE(NEW.prix_vente, 0);
  NEW.revenu_potentiel := v_potential_revenue;
  
  v_gross_margin := v_current_stock * COALESCE(NEW.marge_unitaire, 0);
  NEW.marge_brute := v_gross_margin;

  -- ============================================
  -- 11. TAUX DE ROTATION
  -- ============================================
  IF v_current_stock > 0 AND v_sales_per_day > 0 THEN
    v_rotation_rate := (v_sales_per_day * 365) / v_current_stock;
  ELSE
    v_rotation_rate := 0;
  END IF;
  NEW.taux_rotation := v_rotation_rate;

  -- ============================================
  -- 12. PRIORITÉ DE COMMANDE (1-10)
  -- ============================================
  IF v_stockout_risk >= 80 THEN
    v_priority := 10;
  ELSIF v_stockout_risk >= 50 THEN
    v_priority := 8;
  ELSIF v_qty_to_order > 0 THEN
    v_priority := 6;
  ELSIF v_stockout_risk >= 20 THEN
    v_priority := 4;
  ELSE
    v_priority := 2;
  END IF;
  
  IF NEW.marge_unitaire > 20 AND v_qty_to_order > 0 THEN
    v_priority := LEAST(10, v_priority + 2);
  END IF;
  
  NEW.priorite_commande := v_priority;

  -- ============================================
  -- 13. STOCK PROJETÉ
  -- ============================================
  v_projected_stock := v_current_stock + COALESCE(NEW.qte_en_transit, 0) - 
                       CEIL(v_sales_per_day * v_lead_time);
  NEW.stock_projete := v_projected_stock;

  -- ============================================
  -- 14. DATE DE RUPTURE ESTIMÉE
  -- ============================================
  IF v_sales_per_day > 0 AND v_current_stock > 0 THEN
    v_stockout_date := NOW() + (v_days_of_stock || ' days')::INTERVAL;
    NEW.date_rupture_estimee := v_stockout_date;
  ELSE
    NEW.date_rupture_estimee := NULL;
  END IF;

  -- ============================================
  -- 15. SCORE DE PERFORMANCE (0-100)
  -- ============================================
  v_performance_score := 50;
  
  IF v_rotation_rate > 10 THEN
    v_performance_score := v_performance_score + 20;
  ELSIF v_rotation_rate > 5 THEN
    v_performance_score := v_performance_score + 10;
  END IF;
  
  IF NEW.marge_unitaire > 20 THEN
    v_performance_score := v_performance_score + 15;
  ELSIF NEW.marge_unitaire > 10 THEN
    v_performance_score := v_performance_score + 10;
  END IF;
  
  v_performance_score := v_performance_score - (v_stockout_risk / 5);
  v_performance_score := v_performance_score - (v_overstock_risk / 5);
  v_performance_score := GREATEST(0, LEAST(100, v_performance_score));
  NEW.score_performance := v_performance_score;

  -- ============================================
  -- 16. CATÉGORIE ABC
  -- ============================================
  IF v_potential_revenue > 10000 THEN
    NEW.categorie_abc := 'A';
  ELSIF v_potential_revenue > 3000 THEN
    NEW.categorie_abc := 'B';
  ELSE
    NEW.categorie_abc := 'C';
  END IF;

  -- ============================================
  -- 17. GÉNÉRER DES ALERTES AUTOMATIQUES
  -- ============================================
  NEW.notes_alertes := NULL;
  
  IF v_stockout_risk >= 80 THEN
    NEW.notes_alertes := '🚨 CRITIQUE: Risque de rupture imminent! Commander en urgence.';
  ELSIF v_stockout_risk >= 50 THEN
    NEW.notes_alertes := '⚠️ ATTENTION: Stock faible. Planifier une commande rapidement.';
  ELSIF v_overstock_risk >= 70 THEN
    NEW.notes_alertes := '📦 SURSTOCK: Stock excessif. Réduire les commandes futures.';
  ELSIF v_rotation_rate < 2 AND v_current_stock > 0 THEN
    NEW.notes_alertes := '⏸️ ROTATION LENTE: Envisager une promotion ou réduire le stock.';
  END IF;

  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FONCTION POUR RECALCULER L'INVESTISSEMENT DE TOUS LES PRODUITS
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_all_investments()
RETURNS JSON AS $$
DECLARE
  v_count INTEGER := 0;
  v_product RECORD;
BEGIN
  SET search_path = public;
  
  RAISE NOTICE '🔄 Recalcul de l''investissement pour tous les produits...';
  
  -- Mettre à jour directement la colonne investissement
  FOR v_product IN 
    SELECT sku, qte_a_commander, prix_achat 
    FROM public.produits
    WHERE qte_a_commander IS NOT NULL 
      AND prix_achat IS NOT NULL
  LOOP
    UPDATE public.produits
    SET investissement = COALESCE(v_product.qte_a_commander, 0) * COALESCE(v_product.prix_achat, 0)
    WHERE sku = v_product.sku;
    
    v_count := v_count + 1;
  END LOOP;
  
  -- Mettre à jour les produits avec qte_a_commander = 0 ou NULL
  UPDATE public.produits
  SET investissement = 0
  WHERE qte_a_commander IS NULL 
     OR qte_a_commander = 0
     OR prix_achat IS NULL
     OR prix_achat = 0;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec l''investissement!', v_count;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', format('Investissement recalculé pour %s produit(s)', v_count),
    'updated_count', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.recalculate_all_investments() TO authenticated;

COMMENT ON FUNCTION public.recalculate_all_investments() IS 
'Recalcule l''investissement pour tous les produits : investissement = qte_a_commander * prix_achat';

-- ============================================
-- 4. RECALCULER TOUS LES PRODUITS
-- ============================================

DO $$
DECLARE
  v_result JSON;
  v_count INTEGER;
BEGIN
  -- Appeler la fonction pour recalculer tous les investissements
  SELECT public.recalculate_all_investments() INTO v_result;
  
  -- Aussi déclencher le trigger pour mettre à jour toutes les autres métriques
  SELECT COUNT(*) INTO v_count FROM public.produits;
  
  RAISE NOTICE '🔄 Déclenchement du trigger pour % produit(s)...', v_count;
  
  UPDATE public.produits
  SET updated_at = COALESCE(updated_at, NOW());
  
  RAISE NOTICE '✅ % produit(s) recalculé(s) avec succès!', v_count;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 022
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 022 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Colonne investissement ajoutée à la table produits';
  RAISE NOTICE '   ✅ Calcul automatique: investissement = qte_a_commander * prix_achat';
  RAISE NOTICE '   ✅ Tous les produits recalculés avec l''investissement';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 L''investissement est maintenant calculé automatiquement pour chaque produit!';
END $$;

