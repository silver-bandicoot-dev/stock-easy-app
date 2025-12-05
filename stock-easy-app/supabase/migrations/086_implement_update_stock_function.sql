-- ============================================
-- Migration 086: Implémenter correctement la fonction update_stock
-- ============================================
-- PROBLÈME: La fonction update_stock était un placeholder vide qui ne faisait rien !
-- Le frontend appelait avec p_items mais la fonction attendait p_stock_data
-- et ne mettait pas à jour le stock du tout.
--
-- SOLUTION: Cette migration implémente la vraie logique de mise à jour du stock.
-- ============================================

-- Supprimer l'ancienne fonction placeholder
DROP FUNCTION IF EXISTS public.update_stock(JSON);

-- ============================================
-- NOUVELLE FONCTION update_stock
-- ============================================
-- Accepte un tableau d'items avec { sku, quantityToAdd }
-- quantityToAdd peut être positif (ajout) ou négatif (retrait)

CREATE OR REPLACE FUNCTION public.update_stock(p_items JSONB)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_item JSONB;
  v_sku TEXT;
  v_qty_to_add INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_updated_count INTEGER := 0;
  v_errors TEXT[] := '{}';
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE, 
      'error', 'User not associated with a company'
    );
  END IF;

  -- Vérifier que p_items n'est pas null ou vide
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'No items provided for stock update'
    );
  END IF;

  -- Parcourir chaque item et mettre à jour le stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Extraire SKU et quantité à ajouter
    v_sku := v_item->>'sku';
    v_qty_to_add := COALESCE((v_item->>'quantityToAdd')::INTEGER, 0);
    
    -- Ignorer si SKU vide ou quantité nulle
    IF v_sku IS NULL OR v_sku = '' THEN
      v_errors := array_append(v_errors, 'SKU vide ignoré');
      CONTINUE;
    END IF;
    
    IF v_qty_to_add = 0 THEN
      RAISE NOTICE '⏭️ SKU %: quantité = 0, ignoré', v_sku;
      CONTINUE;
    END IF;

    -- Récupérer le stock actuel
    SELECT stock_actuel INTO v_current_stock
    FROM public.produits
    WHERE sku = v_sku AND company_id = v_company_id;
    
    IF v_current_stock IS NULL THEN
      -- Essayer case-insensitive
      SELECT stock_actuel INTO v_current_stock
      FROM public.produits
      WHERE LOWER(sku) = LOWER(v_sku) AND company_id = v_company_id
      LIMIT 1;
      
      IF v_current_stock IS NULL THEN
        v_errors := array_append(v_errors, format('Produit non trouvé: %s', v_sku));
        RAISE NOTICE '⚠️ Produit non trouvé pour SKU: %', v_sku;
        CONTINUE;
      END IF;
    END IF;
    
    -- Calculer le nouveau stock
    v_new_stock := v_current_stock + v_qty_to_add;
    
    -- Ne pas permettre de stock négatif
    IF v_new_stock < 0 THEN
      v_new_stock := 0;
      RAISE NOTICE '⚠️ SKU %: stock négatif évité, mis à 0', v_sku;
    END IF;
    
    -- Mettre à jour le stock
    UPDATE public.produits
    SET 
      stock_actuel = v_new_stock,
      updated_at = NOW()
    WHERE sku = v_sku AND company_id = v_company_id;
    
    -- Si pas de ligne mise à jour, essayer case-insensitive
    IF NOT FOUND THEN
      UPDATE public.produits
      SET 
        stock_actuel = v_new_stock,
        updated_at = NOW()
      WHERE LOWER(sku) = LOWER(v_sku) AND company_id = v_company_id;
    END IF;
    
    v_updated_count := v_updated_count + 1;
    
    RAISE NOTICE '✅ SKU %: stock mis à jour % -> % (ajouté: %)', 
      v_sku, v_current_stock, v_new_stock, v_qty_to_add;
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'updatedCount', v_updated_count,
    'errors', v_errors
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sécuriser la fonction
ALTER FUNCTION public.update_stock(JSONB) SET search_path = public;

COMMENT ON FUNCTION public.update_stock(JSONB) IS 
  'Met à jour le stock des produits. Accepte un tableau JSON [{sku, quantityToAdd}]. quantityToAdd peut être positif ou négatif.';

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.update_stock(JSONB) TO authenticated;

-- ============================================
-- FIN DE LA MIGRATION 086
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 086 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CORRECTION APPLIQUÉE:';
  RAISE NOTICE '   ❌ AVANT: update_stock était un placeholder vide';
  RAISE NOTICE '   ✅ APRÈS: update_stock met vraiment à jour le stock';
  RAISE NOTICE '';
  RAISE NOTICE '📦 FONCTIONNEMENT:';
  RAISE NOTICE '   - Accepte: [{sku: "SKU-001", quantityToAdd: 12}, ...]';
  RAISE NOTICE '   - quantityToAdd positif = ajoute au stock';
  RAISE NOTICE '   - quantityToAdd négatif = retire du stock';
  RAISE NOTICE '   - Protection contre stock négatif';
  RAISE NOTICE '';
END $$;

