-- ============================================
-- Migration 013: Calculs Automatiques des Quantités à Commander
-- ============================================
-- Objectif : Implémenter les formules de calcul automatiques pour :
--   - Stock de sécurité
--   - Point de commande (reorder point)
--   - Quantité à commander (qty to order)
--   - Autonomie en jours

-- ============================================
-- 1. FONCTION DE CALCUL COMPLÈTE
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_reorder_point INTEGER;
  v_security_stock INTEGER;
  v_qty_to_order INTEGER;
  v_days_of_stock NUMERIC;
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_current_stock INTEGER;
  v_moq INTEGER;
  v_max_stock INTEGER;
BEGIN
  SET search_path = public;
  
  -- Récupérer et valider les valeurs
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);
  -- Note: stock_max n'existe pas dans la table, on utilise une valeur par défaut élevée
  v_max_stock := v_current_stock + 10000;
  
  -- ============================================
  -- 1. CALCULER LE STOCK DE SÉCURITÉ
  -- ============================================
  -- Utiliser le stock personnalisé si défini, sinon calculer
  IF NEW.stock_securite_personnalise IS NOT NULL AND NEW.stock_securite_personnalise > 0 THEN
    v_security_stock := NEW.stock_securite_personnalise;
  ELSE
    -- Formule : 20% du délai de livraison en jours de ventes
    -- Exemple : si délai = 30j, alors stock sécu = 6j de ventes
    v_security_stock := CEIL(v_lead_time * 0.2);
  END IF;
  
  -- S'assurer que le stock de sécurité est au moins 1
  v_security_stock := GREATEST(v_security_stock, 1);
  
  -- ============================================
  -- 2. CALCULER LE POINT DE COMMANDE (REORDER POINT)
  -- ============================================
  -- Formule : (Ventes/jour × Délai livraison) + (Ventes/jour × Stock sécurité)
  -- Cela représente la consommation pendant le délai + le buffer de sécurité
  
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL(
      (v_sales_per_day * v_lead_time) + 
      (v_sales_per_day * v_security_stock)
    );
  ELSE
    -- Si pas de ventes, utiliser une valeur conservative
    v_reorder_point := v_moq;
  END IF;
  
  -- S'assurer que le point de commande est au moins égal au MOQ
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  
  -- ============================================
  -- 3. CALCULER L'AUTONOMIE EN JOURS
  -- ============================================
  IF v_sales_per_day > 0 THEN
    v_days_of_stock := ROUND(v_current_stock / v_sales_per_day, 1);
  ELSE
    -- Si pas de ventes, autonomie infinie (représentée par 999)
    v_days_of_stock := 999;
  END IF;
  
  -- ============================================
  -- 4. CALCULER LA QUANTITÉ À COMMANDER
  -- ============================================
  IF v_current_stock <= v_reorder_point THEN
    -- BESOIN DE COMMANDER
    
    -- Stratégie 1: Commander jusqu'au point de commande + stock de sécurité
    -- Cela garantit qu'on repasse au-dessus du seuil avec un buffer
    v_qty_to_order := v_reorder_point - v_current_stock + (v_security_stock * v_sales_per_day);
    
    -- S'assurer que la quantité est positive
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    -- Arrondir au MOQ supérieur
    IF v_moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_moq) * v_moq;
    END IF;
    
    -- S'assurer que la quantité respecte le MOQ minimum
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
    
    -- Vérifier qu'on ne dépasse pas le stock maximum
    IF v_max_stock > 0 AND (v_current_stock + v_qty_to_order) > v_max_stock THEN
      v_qty_to_order := v_max_stock - v_current_stock;
      
      -- Re-arrondir au MOQ si nécessaire
      IF v_moq > 0 AND v_qty_to_order > 0 THEN
        v_qty_to_order := FLOOR(v_qty_to_order::NUMERIC / v_moq) * v_moq;
      END IF;
    END IF;
    
    -- Si après tous les calculs la quantité est < MOQ, on commande quand même le MOQ
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
    
  ELSE
    -- PAS BESOIN DE COMMANDER
    v_qty_to_order := 0;
  END IF;
  
  -- ============================================
  -- 5. METTRE À JOUR LES CHAMPS CALCULÉS
  -- ============================================
  NEW.stock_securite := v_security_stock;
  NEW.point_commande := v_reorder_point;
  NEW.quantite_a_commander := COALESCE(v_qty_to_order, 0);
  NEW.stock_actuel := v_current_stock;
  
  -- Log pour debug (optionnel, commenter en production)
  -- RAISE NOTICE 'SKU %: Stock=%, Reorder=%, QtyToOrder=%', 
  --   NEW.sku, v_current_stock, v_reorder_point, v_qty_to_order;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. APPLIQUER LE TRIGGER
-- ============================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_calculate_metrics
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_metrics();

-- ============================================
-- 3. FONCTION DE RECALCUL GLOBAL
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_all_products()
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_product RECORD;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  -- Recalculer tous les produits de l'entreprise
  FOR v_product IN 
    SELECT sku FROM public.produits 
    WHERE company_id = v_company_id OR company_id IS NULL
  LOOP
    -- Forcer le trigger en mettant à jour updated_at
    UPDATE public.produits
    SET updated_at = NOW()
    WHERE sku = v_product.sku;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', TRUE,
    'updated_count', v_updated_count,
    'message', format('%s produit(s) recalculé(s)', v_updated_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. FONCTION DE RECALCUL D'UN SEUL PRODUIT
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_product(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
BEGIN
  SET search_path = public;
  
  -- Récupérer les informations du produit
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', format('Produit avec SKU %s non trouvé', p_sku)
    );
  END IF;
  
  -- Forcer le recalcul
  UPDATE public.produits
  SET updated_at = NOW()
  WHERE sku = p_sku;
  
  -- Récupérer les valeurs recalculées
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  RETURN json_build_object(
    'success', TRUE,
    'product', json_build_object(
      'sku', v_product.sku,
      'stock_actuel', v_product.stock_actuel,
      'point_commande', v_product.point_commande,
      'stock_securite', v_product.stock_securite,
      'quantite_a_commander', v_product.quantite_a_commander,
      'ventes_jour_ajustees', v_product.ventes_jour_ajustees,
      'lead_time_days', v_product.lead_time_days,
      'moq', v_product.moq
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. FONCTION D'ANALYSE DES CALCULS
-- ============================================
-- Utile pour débugger et comprendre pourquoi un produit a une certaine qtyToOrder

CREATE OR REPLACE FUNCTION public.analyze_product_calculation(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_calculation JSON;
BEGIN
  SET search_path = public;
  
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', format('Produit avec SKU %s non trouvé', p_sku)
    );
  END IF;
  
  -- Construire l'analyse détaillée
  v_calculation := json_build_object(
    'sku', v_product.sku,
    'nom_produit', v_product.nom_produit,
    
    -- Données de base
    'donnees_base', json_build_object(
      'stock_actuel', v_product.stock_actuel,
      'ventes_jour_ajustees', v_product.ventes_jour_ajustees,
      'lead_time_days', v_product.lead_time_days,
      'moq', v_product.moq,
      'stock_max', v_product.stock_max
    ),
    
    -- Calculs intermédiaires
    'calculs', json_build_object(
      'stock_securite', v_product.stock_securite,
      'stock_securite_personnalise', v_product.stock_securite_personnalise,
      'point_commande', v_product.point_commande,
      'autonomie_jours', CASE 
        WHEN v_product.ventes_jour_ajustees > 0 
        THEN ROUND(v_product.stock_actuel / v_product.ventes_jour_ajustees, 1)
        ELSE 999
      END
    ),
    
    -- Résultat
    'resultat', json_build_object(
      'quantite_a_commander', v_product.quantite_a_commander,
      'besoin_commander', v_product.stock_actuel <= v_product.point_commande,
      'raison', CASE
        WHEN v_product.stock_actuel <= v_product.point_commande THEN 
          format('Stock (%s) ≤ Point de commande (%s)', 
                 v_product.stock_actuel, v_product.point_commande)
        ELSE 
          format('Stock (%s) > Point de commande (%s) - Pas besoin de commander',
                 v_product.stock_actuel, v_product.point_commande)
      END
    ),
    
    -- Formules utilisées
    'formules', json_build_object(
      'stock_securite', '20% du délai de livraison',
      'point_commande', '(Ventes/jour × Délai) + (Ventes/jour × Stock sécu)',
      'quantite_commander', 'Point commande - Stock + Buffer, arrondi au MOQ'
    )
  );
  
  RETURN json_build_object('success', TRUE, 'analysis', v_calculation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RECALCULER TOUS LES PRODUITS EXISTANTS
-- ============================================
-- Cette section force le recalcul de tous les produits existants
-- pour s'assurer que les valeurs sont à jour

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Compter les produits
  SELECT COUNT(*) INTO v_count FROM public.produits;
  
  RAISE NOTICE '🔄 Recalcul de % produit(s)...', v_count;
  
  -- Forcer le trigger sur tous les produits
  UPDATE public.produits
  SET updated_at = NOW();
  
  RAISE NOTICE '✅ % produit(s) recalculé(s) avec succès', v_count;
END $$;

-- ============================================
-- 7. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.calculate_product_metrics IS 
  'Calcule automatiquement les métriques de stock (sécurité, point de commande, quantité à commander) lors de l''insertion ou mise à jour d''un produit';

COMMENT ON FUNCTION public.recalculate_all_products IS 
  'Recalcule les métriques pour tous les produits de l''entreprise de l''utilisateur actuel';

COMMENT ON FUNCTION public.recalculate_product IS 
  'Recalcule les métriques d''un produit spécifique et retourne les valeurs calculées';

COMMENT ON FUNCTION public.analyze_product_calculation IS 
  'Analyse détaillée du calcul de quantité à commander pour un produit (utile pour le debugging)';

-- ============================================
-- 8. TESTS DE VÉRIFICATION
-- ============================================

-- Test 1: Vérifier qu'un produit avec stock faible a une qtyToOrder > 0
DO $$
DECLARE
  v_test_result RECORD;
BEGIN
  SELECT 
    sku,
    stock_actuel,
    point_commande,
    quantite_a_commander,
    CASE 
      WHEN stock_actuel <= point_commande AND quantite_a_commander > 0 THEN '✅ OK'
      WHEN stock_actuel > point_commande AND quantite_a_commander = 0 THEN '✅ OK'
      ELSE '❌ ERREUR'
    END as test_status
  INTO v_test_result
  FROM public.produits
  WHERE ventes_jour_ajustees > 0
  LIMIT 1;
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE 'Test sur SKU %: Stock=%, Reorder=%, QtyToOrder=% - %',
      v_test_result.sku,
      v_test_result.stock_actuel,
      v_test_result.point_commande,
      v_test_result.quantite_a_commander,
      v_test_result.test_status;
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Summary log
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 013 appliquée avec succès !';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Fonctions créées:';
  RAISE NOTICE '  - calculate_product_metrics() [TRIGGER]';
  RAISE NOTICE '  - recalculate_all_products()';
  RAISE NOTICE '  - recalculate_product(sku)';
  RAISE NOTICE '  - analyze_product_calculation(sku)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Tous les produits ont été recalculés';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Utilisation:';
  RAISE NOTICE '  - Les calculs se font automatiquement à chaque INSERT/UPDATE';
  RAISE NOTICE '  - Pour recalculer tous: SELECT recalculate_all_products();';
  RAISE NOTICE '  - Pour analyser un produit: SELECT analyze_product_calculation(''SKU'');';
  RAISE NOTICE '';
END $$;

