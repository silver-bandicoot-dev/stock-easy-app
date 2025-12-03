-- ============================================
-- Migration 082: Corriger confirm_order_reconciliation pour n'ajouter QUE les quantités manquantes
-- ============================================
-- PROBLÈME: Le RPC ajoutait les quantités REÇUES (12-2=10) au lieu des MANQUANTES (2)
-- quand on cliquait sur "Compléter" pour finaliser une réconciliation.
--
-- CORRECTION: Ajouter uniquement les quantités MANQUANTES (qui viennent d'arriver)
-- ============================================

CREATE OR REPLACE FUNCTION public.confirm_order_reconciliation(
  p_order_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_item RECORD;
  v_company_id UUID;
  v_missing_qty INTEGER;
  v_current_stock INTEGER;
  v_new_stock INTEGER;
  v_updates_count INTEGER := 0;
  v_sku TEXT;
BEGIN
  SET search_path = public;
  
  -- Vérifier que la commande existe et est en réconciliation
  SELECT * INTO v_order
  FROM public.commandes
  WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Commande introuvable'
    );
  END IF;
  
  IF v_order.status != 'reconciliation' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'La commande n''est pas en état de réconciliation'
    );
  END IF;
  
  -- Récupérer le company_id de la commande
  v_company_id := v_order.company_id;
  
  -- ============================================
  -- METTRE À JOUR LE STOCK AVEC LES QUANTITÉS MANQUANTES
  -- ============================================
  -- Quand on confirme une réconciliation (bouton "Compléter"),
  -- c'est que les quantités MANQUANTES sont finalement arrivées.
  -- On ajoute donc UNIQUEMENT les quantités manquantes, pas les reçues.
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    -- Extraire le SKU
    v_sku := v_item.value->>'sku';
    
    -- Obtenir les quantités MANQUANTES pour ce SKU
    -- C'est ce qu'on doit ajouter car ces produits viennent d'arriver
    v_missing_qty := COALESCE((v_order.missing_quantities_by_sku->>(v_sku))::INTEGER, 0);
    
    RAISE NOTICE '📦 SKU %: quantités manquantes à ajouter = %', v_sku, v_missing_qty;
    
    -- Ajouter uniquement si des quantités étaient manquantes
    IF v_missing_qty > 0 THEN
      -- Récupérer le stock actuel du produit
      SELECT stock_actuel INTO v_current_stock
      FROM public.produits
      WHERE sku = v_sku AND company_id = v_company_id;
      
      IF v_current_stock IS NOT NULL THEN
        -- Calculer le nouveau stock: actuel + manquants (qui viennent d'arriver)
        v_new_stock := v_current_stock + v_missing_qty;
        
        -- Mettre à jour le stock du produit
        UPDATE public.produits
        SET 
          stock_actuel = v_new_stock,
          updated_at = NOW()
        WHERE sku = v_sku AND company_id = v_company_id;
        
        v_updates_count := v_updates_count + 1;
        
        RAISE NOTICE '✅ Stock mis à jour pour SKU %: % -> % (+% manquants)', 
          v_sku, v_current_stock, v_new_stock, v_missing_qty;
      ELSE
        RAISE NOTICE '⚠️ Produit non trouvé pour SKU: %', v_sku;
      END IF;
    ELSE
      RAISE NOTICE '⏭️ Aucune quantité manquante pour SKU %', v_sku;
    END IF;
  END LOOP;
  
  -- ============================================
  -- METTRE À JOUR LE STATUT DE LA COMMANDE
  -- ============================================
  UPDATE public.commandes
  SET 
    status = 'completed',
    completed_at = NOW(),
    reconciliation_confirmed_at = NOW(),
    reconciliation_confirmed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Réconciliation confirmée avec succès et stock mis à jour',
    'order_id', p_order_id,
    'updates_count', v_updates_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.confirm_order_reconciliation(TEXT) IS 
  'Confirme la réconciliation: ajoute les quantités MANQUANTES au stock (celles qui viennent d''arriver) et marque la commande comme terminée';

-- ============================================
-- FIN DE LA MIGRATION 082
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 082 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CORRECTION:';
  RAISE NOTICE '   ❌ AVANT: ajoutait les quantités REÇUES (commandé - manquant)';
  RAISE NOTICE '   ✅ APRÈS: ajoute les quantités MANQUANTES uniquement';
  RAISE NOTICE '';
  RAISE NOTICE '📦 EXEMPLE:';
  RAISE NOTICE '   Commandé: 12, Reçu: 10, Manquant: 2';
  RAISE NOTICE '   ❌ AVANT: stock + 10 (incorrect!)';
  RAISE NOTICE '   ✅ APRÈS: stock + 2 (les manquants qui arrivent)';
  RAISE NOTICE '';
END $$;

