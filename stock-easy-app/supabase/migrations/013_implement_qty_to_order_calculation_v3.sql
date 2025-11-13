-- ============================================
-- Migration 013: Calculs Automatiques des Quantités à Commander (Version Finale Corrigée)
-- ============================================
-- Cette version utilise les VRAIS noms de colonnes trouvés dans la base de données:
-- - stock_actuel ✓
-- - ventes_jour_ajustees ✓
-- - lead_time_days ✓
-- - moq ✓
-- - point_commande ✓
-- - qte_a_commander ✓ (et NON quantite_a_commander!)
-- - stock_secu_custom_jours ✓ (en jours, pas en unités)

-- ============================================
-- 1. AJOUTER LES COLONNES MANQUANTES SI NÉCESSAIRE
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne stock_securite si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'stock_securite'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN stock_securite INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne stock_securite ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne stock_securite existe déjà';
  END IF;

  -- Ajouter la colonne autonomie_jours si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'autonomie_jours'
  ) THEN
    ALTER TABLE public.produits ADD COLUMN autonomie_jours INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne autonomie_jours ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne autonomie_jours existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. FONCTION DE CALCUL DES MÉTRIQUES PRODUIT
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_product_metrics()
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
  v_buffer_days INTEGER := 7; -- Jours de buffer pour la quantité à commander
BEGIN
  SET search_path = public;

  -- ============================================
  -- RÉCUPÉRATION DES VALEURS (avec les VRAIS noms de colonnes)
  -- ============================================
  v_sales_per_day := COALESCE(NEW.ventes_jour_ajustees, 0);
  v_lead_time := COALESCE(NEW.lead_time_days, 30);
  v_current_stock := COALESCE(NEW.stock_actuel, 0);
  v_moq := COALESCE(NEW.moq, 1);

  -- ============================================
  -- 1. CALCULER LE STOCK DE SÉCURITÉ
  -- ============================================
  -- Formule: 20% du lead time en jours de ventes
  -- Si l'utilisateur a défini un stock de sécurité personnalisé en jours, l'utiliser
  IF NEW.stock_secu_custom_jours IS NOT NULL AND NEW.stock_secu_custom_jours > 0 THEN
    v_security_stock := CEIL(v_sales_per_day * NEW.stock_secu_custom_jours);
  ELSE
    v_security_stock := GREATEST(1, CEIL(v_sales_per_day * v_lead_time * 0.2));
  END IF;
  
  NEW.stock_securite := v_security_stock;

  -- ============================================
  -- 2. CALCULER LE POINT DE COMMANDE (REORDER POINT)
  -- ============================================
  -- Formule: (Ventes/jour × Délai livraison) + Stock de sécurité
  IF v_sales_per_day > 0 THEN
    v_reorder_point := CEIL((v_sales_per_day * v_lead_time) + v_security_stock);
  ELSE
    -- Si pas de ventes, utiliser le MOQ comme minimum
    v_reorder_point := v_moq;
  END IF;
  
  -- S'assurer que le point de commande est au moins égal au MOQ
  v_reorder_point := GREATEST(v_reorder_point, v_moq);
  
  NEW.point_commande := v_reorder_point;

  -- ============================================
  -- 3. CALCULER LA QUANTITÉ À COMMANDER
  -- ============================================
  -- Commande nécessaire si stock actuel ≤ point de commande
  IF v_current_stock <= v_reorder_point THEN
    -- Calculer la quantité pour atteindre: point de commande + buffer (7 jours de ventes)
    v_qty_to_order := v_reorder_point - v_current_stock + CEIL(v_sales_per_day * v_buffer_days);
    
    -- S'assurer que la quantité est positive
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    -- Arrondir au MOQ supérieur si nécessaire
    IF v_moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_moq) * v_moq;
    END IF;
    
    -- S'assurer du MOQ minimum
    IF v_qty_to_order > 0 AND v_qty_to_order < v_moq THEN
      v_qty_to_order := v_moq;
    END IF;
  ELSE
    -- Stock suffisant, pas besoin de commander
    v_qty_to_order := 0;
  END IF;
  
  -- Utiliser le VRAI nom de colonne: qte_a_commander (et NON quantite_a_commander)
  NEW.qte_a_commander := COALESCE(v_qty_to_order, 0);

  -- ============================================
  -- 4. CALCULER L'AUTONOMIE EN JOURS
  -- ============================================
  -- Combien de jours de ventes le stock actuel peut-il couvrir?
  IF v_sales_per_day > 0 THEN
    NEW.autonomie_jours := FLOOR(v_current_stock / v_sales_per_day);
  ELSE
    NEW.autonomie_jours := 999; -- Valeur élevée si pas de ventes (stock théoriquement infini)
  END IF;

  -- Mettre à jour le timestamp
  NEW.updated_at := NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CRÉER LE TRIGGER
-- ============================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_calculate_metrics ON public.produits;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_calculate_metrics
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_metrics();

COMMENT ON TRIGGER trigger_calculate_metrics ON public.produits IS 
'Calcule automatiquement les métriques (stock sécurité, point commande, quantité à commander, autonomie) avant insertion/mise à jour';

-- ============================================
-- 4. FONCTION RPC: Recalculer tous les produits d'une entreprise
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_company_products(p_company_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_product RECORD;
  v_company_id UUID := p_company_id;
BEGIN
  SET search_path = public;

  -- Si company_id n'est pas fourni, utiliser celui de l'utilisateur connecté
  IF v_company_id IS NULL THEN
    SELECT company_id INTO v_company_id 
    FROM public.user_profiles 
    WHERE user_id = auth.uid();
  END IF;

  RAISE NOTICE '🔄 Recalcul des produits pour company_id: %', v_company_id;

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
  
  RAISE NOTICE '✅ % produit(s) recalculé(s)', v_updated_count;

  RETURN json_build_object(
    'success', TRUE,
    'message', format('Recalcul effectué pour %s produit(s)', v_updated_count),
    'updated_count', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.recalculate_company_products(UUID) TO authenticated;

COMMENT ON FUNCTION public.recalculate_company_products(UUID) IS 
'Recalcule toutes les métriques pour tous les produits d''une entreprise';

-- ============================================
-- 5. FONCTION RPC: Recalculer un produit spécifique
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_product(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
BEGIN
  SET search_path = public;

  -- Vérifier que le produit existe
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', format('Produit %s non trouvé', p_sku)
    );
  END IF;

  -- Forcer le trigger
  UPDATE public.produits
  SET updated_at = COALESCE(updated_at, NOW())
  WHERE sku = p_sku;

  -- Récupérer les valeurs mises à jour
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'Produit recalculé avec succès',
    'product', json_build_object(
      'sku', v_product.sku,
      'nom_produit', v_product.nom_produit,
      'stock_actuel', v_product.stock_actuel,
      'ventes_jour_ajustees', v_product.ventes_jour_ajustees,
      'stock_securite', v_product.stock_securite,
      'point_commande', v_product.point_commande,
      'qte_a_commander', v_product.qte_a_commander,
      'autonomie_jours', v_product.autonomie_jours
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.recalculate_product(TEXT) TO authenticated;

COMMENT ON FUNCTION public.recalculate_product(TEXT) IS 
'Recalcule les métriques pour un produit spécifique';

-- ============================================
-- 6. FONCTION RPC: Obtenir les métriques de calcul
-- ============================================

CREATE OR REPLACE FUNCTION public.get_product_calculation_details(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_product RECORD;
  v_security_stock INTEGER;
  v_reorder_point INTEGER;
  v_qty_to_order INTEGER;
  v_buffer_days INTEGER := 7;
BEGIN
  SET search_path = public;

  -- Récupérer le produit
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'message', format('Produit %s non trouvé', p_sku)
    );
  END IF;

  -- Recalculer manuellement pour afficher les détails
  -- 1. Stock de sécurité
  IF v_product.stock_secu_custom_jours IS NOT NULL AND v_product.stock_secu_custom_jours > 0 THEN
    v_security_stock := CEIL(v_product.ventes_jour_ajustees * v_product.stock_secu_custom_jours);
  ELSE
    v_security_stock := GREATEST(1, CEIL(v_product.ventes_jour_ajustees * v_product.lead_time_days * 0.2));
  END IF;

  -- 2. Point de commande
  v_reorder_point := CEIL((v_product.ventes_jour_ajustees * v_product.lead_time_days) + v_security_stock);
  v_reorder_point := GREATEST(v_reorder_point, v_product.moq);

  -- 3. Quantité à commander
  IF v_product.stock_actuel <= v_reorder_point THEN
    v_qty_to_order := v_reorder_point - v_product.stock_actuel + CEIL(v_product.ventes_jour_ajustees * v_buffer_days);
    v_qty_to_order := GREATEST(v_qty_to_order, 0);
    
    IF v_product.moq > 0 AND v_qty_to_order > 0 THEN
      v_qty_to_order := CEIL(v_qty_to_order::NUMERIC / v_product.moq) * v_product.moq;
    END IF;
    
    IF v_qty_to_order > 0 AND v_qty_to_order < v_product.moq THEN
      v_qty_to_order := v_product.moq;
    END IF;
  ELSE
    v_qty_to_order := 0;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'sku', v_product.sku,
    'nom_produit', v_product.nom_produit,
    'donnees_entree', json_build_object(
      'stock_actuel', v_product.stock_actuel,
      'ventes_jour_ajustees', v_product.ventes_jour_ajustees,
      'lead_time_days', v_product.lead_time_days,
      'moq', v_product.moq,
      'stock_secu_custom_jours', v_product.stock_secu_custom_jours
    ),
    'calculs', json_build_object(
      'stock_securite', v_security_stock,
      'formule_stock_securite', 
        CASE 
          WHEN v_product.stock_secu_custom_jours IS NOT NULL AND v_product.stock_secu_custom_jours > 0 
          THEN format('Ventes/jour (%.2f) × Jours custom (%s) = %s', v_product.ventes_jour_ajustees, v_product.stock_secu_custom_jours, v_security_stock)
          ELSE format('Ventes/jour (%.2f) × Lead time (%s) × 20%% = %s', v_product.ventes_jour_ajustees, v_product.lead_time_days, v_security_stock)
        END,
      'point_commande', v_reorder_point,
      'formule_point_commande', format('(Ventes/jour (%.2f) × Lead time (%s)) + Stock sécu (%s) = %s', 
        v_product.ventes_jour_ajustees, v_product.lead_time_days, v_security_stock, v_reorder_point),
      'qte_a_commander', v_qty_to_order,
      'formule_qte_commander', 
        CASE 
          WHEN v_qty_to_order > 0 
          THEN format('Point commande (%s) - Stock (%s) + Buffer %s jours (%.2f) = %s, arrondi au MOQ (%s) = %s',
            v_reorder_point, v_product.stock_actuel, v_buffer_days, 
            CEIL(v_product.ventes_jour_ajustees * v_buffer_days), 
            v_reorder_point - v_product.stock_actuel + CEIL(v_product.ventes_jour_ajustees * v_buffer_days),
            v_product.moq, v_qty_to_order)
          ELSE format('Stock (%s) > Point commande (%s) → Pas besoin de commander', v_product.stock_actuel, v_reorder_point)
        END
    ),
    'valeurs_bdd', json_build_object(
      'stock_securite', v_product.stock_securite,
      'point_commande', v_product.point_commande,
      'qte_a_commander', v_product.qte_a_commander,
      'autonomie_jours', v_product.autonomie_jours
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_product_calculation_details(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_product_calculation_details(TEXT) IS 
'Retourne les détails des calculs pour un produit (pour debug et validation)';

-- ============================================
-- 7. RECALCULER TOUS LES PRODUITS EXISTANTS
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
-- 8. TESTS ET VÉRIFICATIONS
-- ============================================

DO $$
DECLARE
  v_test_result RECORD;
BEGIN
  -- Afficher un exemple de produit après recalcul
  SELECT 
    sku,
    nom_produit,
    stock_actuel,
    ventes_jour_ajustees,
    lead_time_days,
    moq,
    stock_securite,
    point_commande,
    qte_a_commander,
    autonomie_jours
  INTO v_test_result
  FROM public.produits
  WHERE ventes_jour_ajustees > 0
  LIMIT 1;
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '📦 Produit test: %', v_test_result.nom_produit;
    RAISE NOTICE '   SKU: %', v_test_result.sku;
    RAISE NOTICE '   Stock actuel: %', v_test_result.stock_actuel;
    RAISE NOTICE '   Ventes/jour: %', v_test_result.ventes_jour_ajustees;
    RAISE NOTICE '   Lead time: % jours', v_test_result.lead_time_days;
    RAISE NOTICE '   MOQ: %', v_test_result.moq;
    RAISE NOTICE '   ✓ Stock sécurité: %', v_test_result.stock_securite;
    RAISE NOTICE '   ✓ Point de commande: %', v_test_result.point_commande;
    RAISE NOTICE '   ✓ Quantité à commander: %', v_test_result.qte_a_commander;
    RAISE NOTICE '   ✓ Autonomie: % jours', v_test_result.autonomie_jours;
  ELSE
    RAISE NOTICE '⚠️  Aucun produit avec des ventes trouvé pour tester';
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 013 v3
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '🎉 Migration 013 v3 terminée avec succès!';
  RAISE NOTICE '📝 Colonnes utilisées:';
  RAISE NOTICE '   - stock_actuel (stock actuel)';
  RAISE NOTICE '   - ventes_jour_ajustees (ventes/jour)';
  RAISE NOTICE '   - lead_time_days (délai livraison)';
  RAISE NOTICE '   - moq (quantité minimum commande)';
  RAISE NOTICE '   - stock_secu_custom_jours (stock sécurité custom en jours)';
  RAISE NOTICE '   - stock_securite (calculé automatiquement)';
  RAISE NOTICE '   - point_commande (calculé automatiquement)';
  RAISE NOTICE '   - qte_a_commander (calculé automatiquement) ⚠️ NOM CORRECT!';
  RAISE NOTICE '   - autonomie_jours (calculé automatiquement)';
END $$;
