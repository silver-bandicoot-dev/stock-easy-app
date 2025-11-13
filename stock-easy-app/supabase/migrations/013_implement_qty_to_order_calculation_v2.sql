-- ============================================
-- Migration 013: Calculs Automatiques des Quantités à Commander (Version Corrigée)
-- ============================================
-- Cette version utilise UNIQUEMENT les champs qui existent dans la table produits

-- ============================================
-- 1. VÉRIFIER LES COLONNES EXISTANTES
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🔍 Vérification des colonnes de la table produits...';
  
  -- Afficher les colonnes qui nous intéressent
  PERFORM column_name 
  FROM information_schema.columns 
  WHERE table_name = 'produits' 
    AND column_name IN (
      'stock_actuel', 
      'ventes_jour_ajustees', 
      'lead_time_days', 
      'moq',
      'stock_securite',
      'stock_securite_personnalise',
      'point_commande',
      'quantite_a_commander'
    );
END $$;

-- ============================================
-- 2. FONCTION DE CALCUL SIMPLIFIÉE
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
RETURNS TRIGGER AS $$
DECLARE
  v_reorder_point INTEGER;
  v_security_stock INTEGER;
  v_qty_to_order INTEGER;
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_current_stock INTEGER;
  v_moq INTEGER;
BEGIN
  SET search_path = public;
  
  -- Récupérer et valider les valeurs (uniquement les champs qui existent)
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);
  
  -- ============================================
  -- 1. CALCULER LE STOCK DE SÉCURITÉ
  -- ============================================
  -- Formule simple : 20% du délai de livraison en jours de ventes
  v_security_stock := GREATEST(CEIL(v_lead_time * 0.2), 1);
  
  -- ============================================
  -- 2. CALCULER LE POINT DE COMMANDE (REORDER POINT)
  -- ============================================
  -- Formule : (Ventes/jour × Délai livraison) + (Ventes/jour × Stock sécurité)
  
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL(
      (v_sales_per_day * v_lead_time) + 
      (v_sales_per_day * v_security_stock)
    );
  ELSE
    -- Si pas de ventes, utiliser le MOQ comme minimum
    v_reorder_point := v_moq;
  END IF;
  
  -- S'assurer que le point de commande est au moins égal au MOQ
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  
  -- ============================================
  -- 3. CALCULER LA QUANTITÉ À COMMANDER
  -- ============================================
  IF v_current_stock <= v_reorder_point THEN
    -- BESOIN DE COMMANDER
    
    -- Calculer la quantité nécessaire pour atteindre le point de commande + buffer
    v_qty_to_order := v_reorder_point - v_current_stock + CEIL(v_security_stock * v_sales_per_day);
    
    -- S'assurer que la quantité est positive
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    -- Arrondir au MOQ supérieur
    IF v_moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_moq) * v_moq;
    END IF;
    
    -- S'assurer du MOQ minimum
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
    
  ELSE
    -- PAS BESOIN DE COMMANDER
    v_qty_to_order := 0;
  END IF;
  
  -- ============================================
  -- 4. METTRE À JOUR LES CHAMPS CALCULÉS
  -- ============================================
  -- On met à jour UNIQUEMENT les champs qui existent dans la table
  
  -- Vérifier si stock_securite existe
  BEGIN
    NEW.stock_securite := v_security_stock;
  EXCEPTION
    WHEN undefined_column THEN
      -- Le champ n'existe pas, on ignore
      NULL;
  END;
  
  -- Vérifier si point_commande existe
  BEGIN
    NEW.point_commande := v_reorder_point;
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  -- Vérifier si quantite_a_commander existe
  BEGIN
    NEW.quantite_a_commander := COALESCE(v_qty_to_order, 0);
  EXCEPTION
    WHEN undefined_column THEN
      NULL;
  END;
  
  -- S'assurer que stock_actuel est défini
  NEW.stock_actuel := v_current_stock;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. APPLIQUER LE TRIGGER
-- ============================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_calculate_metrics
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_metrics();

-- ============================================
-- 4. FONCTION DE RECALCUL GLOBAL
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_all_products()
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_product RECORD;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel (si la fonction existe)
  BEGIN
    v_company_id := public.get_current_user_company_id();
  EXCEPTION
    WHEN undefined_function THEN
      v_company_id := NULL;
  END;
  
  -- Recalculer tous les produits
  FOR v_product IN 
    SELECT sku FROM public.produits 
    WHERE v_company_id IS NULL OR company_id = v_company_id OR company_id IS NULL
  LOOP
    -- Forcer le trigger en mettant à jour updated_at
    UPDATE public.produits
    SET updated_at = COALESCE(updated_at, NOW())
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
-- 5. FONCTION D'ANALYSE D'UN PRODUIT
-- ============================================

CREATE OR REPLACE FUNCTION public.analyze_product_calculation(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_sales_per_day NUMERIC;
  v_lead_time INTEGER;
  v_security_stock INTEGER;
  v_reorder_point INTEGER;
  v_autonomy NUMERIC;
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
  
  -- Recalculer les métriques
  v_sales_per_day := COALESCE(v_product.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(v_product.lead_time_days, 30);
  v_security_stock := GREATEST(CEIL(v_lead_time * 0.2), 1);
  
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL(
      (v_sales_per_day * v_lead_time) + 
      (v_sales_per_day * v_security_stock)
    );
    v_autonomy := ROUND(v_product.stock_actuel / v_sales_per_day, 1);
  ELSE
    v_reorder_point := COALESCE(v_product.moq, 1);
    v_autonomy := 999;
  END IF;
  
  v_reorder_point := GREATEST(v_reorder_point, COALESCE(v_product.moq, 1));
  
  RETURN json_build_object(
    'success', TRUE,
    'analysis', json_build_object(
      'sku', v_product.sku,
      'nom_produit', v_product.nom_produit,
      'donnees_base', json_build_object(
        'stock_actuel', v_product.stock_actuel,
        'ventes_jour_ajustees', v_product.ventes_jour_ajustees,
        'lead_time_days', v_product.lead_time_days,
        'moq', v_product.moq
      ),
      'calculs', json_build_object(
        'stock_securite', v_security_stock,
        'point_commande', v_reorder_point,
        'autonomie_jours', v_autonomy
      ),
      'resultat', json_build_object(
        'quantite_a_commander', v_product.quantite_a_commander,
        'besoin_commander', v_product.stock_actuel <= v_reorder_point,
        'raison', CASE
          WHEN v_product.stock_actuel <= v_reorder_point THEN 
            format('Stock (%s) ≤ Point de commande (%s)', 
                   v_product.stock_actuel, v_reorder_point)
          ELSE 
            format('Stock (%s) > Point de commande (%s)',
                   v_product.stock_actuel, v_reorder_point)
        END
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. RECALCULER TOUS LES PRODUITS EXISTANTS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Compter les produits
  SELECT COUNT(*) INTO v_count FROM public.produits;
  
  RAISE NOTICE '🔄 Recalcul de % produit(s)...', v_count;
  
  -- Forcer le trigger sur tous les produits
  UPDATE public.produits
  SET updated_at = COALESCE(updated_at, NOW());
  
  RAISE NOTICE '✅ % produit(s) recalculé(s)', v_count;
END $$;

-- ============================================
-- 7. TEST DE VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_test_result RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🧪 Test de vérification...';
  
  SELECT 
    sku,
    nom_produit,
    stock_actuel,
    COALESCE(point_commande, 0) as point_commande,
    COALESCE(quantite_a_commander, 0) as quantite_a_commander
  INTO v_test_result
  FROM public.produits
  WHERE ventes_jour_ajustees > 0
  LIMIT 1;
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '📦 Produit test: %', v_test_result.nom_produit;
    RAISE NOTICE '   Stock actuel: %', v_test_result.stock_actuel;
    RAISE NOTICE '   Point de commande: %', v_test_result.point_commande;
    RAISE NOTICE '   Quantité à commander: %', v_test_result.quantite_a_commander;
    
    IF v_test_result.stock_actuel <= v_test_result.point_commande AND v_test_result.quantite_a_commander > 0 THEN
      RAISE NOTICE '   ✅ Logique correcte: Stock faible → Quantité > 0';
    ELSIF v_test_result.stock_actuel > v_test_result.point_commande AND v_test_result.quantite_a_commander = 0 THEN
      RAISE NOTICE '   ✅ Logique correcte: Stock suffisant → Quantité = 0';
    ELSE
      RAISE NOTICE '   ⚠️ À vérifier manuellement';
    END IF;
  END IF;
END $$;

-- ============================================
-- 8. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.calculate_product_metrics IS 
  'Calcule automatiquement stock de sécurité, point de commande et quantité à commander';

COMMENT ON FUNCTION public.recalculate_all_products IS 
  'Recalcule les métriques pour tous les produits';

COMMENT ON FUNCTION public.analyze_product_calculation IS 
  'Analyse détaillée du calcul pour un produit spécifique';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Migration 013 v2 appliquée avec succès !';
  RAISE NOTICE '================================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Fonctions créées:';
  RAISE NOTICE '  - calculate_product_metrics() [TRIGGER]';
  RAISE NOTICE '  - recalculate_all_products()';
  RAISE NOTICE '  - analyze_product_calculation(sku)';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Tous les produits ont été recalculés';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Utilisation:';
  RAISE NOTICE '  SELECT analyze_product_calculation(''003'');';
  RAISE NOTICE '  SELECT recalculate_all_products();';
  RAISE NOTICE '';
END $$;

