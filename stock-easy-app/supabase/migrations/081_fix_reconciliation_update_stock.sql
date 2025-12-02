-- ============================================
-- Migration 081: Corriger la réconciliation pour mettre à jour le stock
-- ============================================
-- Cette migration modifie la fonction confirm_order_reconciliation pour :
-- 1. Mettre à jour le stock_actuel des produits avec les quantités reçues
-- 2. Déclencher le webhook vers Gadget pour sync Shopify

-- ============================================
-- 1. NOUVELLE FONCTION DE RÉCONCILIATION AMÉLIORÉE
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
  v_damaged_qty INTEGER;
  v_received_qty INTEGER;
  v_ordered_qty INTEGER;
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
  -- METTRE À JOUR LE STOCK DES PRODUITS
  -- ============================================
  -- Pour chaque item de la commande, calculer les quantités reçues saines
  -- et mettre à jour le stock_actuel dans la table produits
  
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
  LOOP
    -- Extraire le SKU et la quantité commandée
    v_sku := v_item.value->>'sku';
    v_ordered_qty := COALESCE((v_item.value->>'quantity')::INTEGER, 0);
    
    -- Obtenir les quantités manquantes et endommagées pour ce SKU
    v_missing_qty := COALESCE((v_order.missing_quantities_by_sku->>(v_sku))::INTEGER, 0);
    v_damaged_qty := COALESCE((v_order.damaged_quantities_by_sku->>(v_sku))::INTEGER, 0);
    
    -- Calculer la quantité réellement reçue en bon état
    -- = quantité commandée - quantité manquante - quantité endommagée
    v_received_qty := v_ordered_qty - v_missing_qty - v_damaged_qty;
    
    -- Ne pas ajouter de stock négatif
    IF v_received_qty < 0 THEN
      v_received_qty := 0;
    END IF;
    
    -- Vérifier que v_received_qty > 0 avant de mettre à jour
    IF v_received_qty > 0 THEN
      -- Récupérer le stock actuel du produit
      SELECT stock_actuel INTO v_current_stock
      FROM public.produits
      WHERE sku = v_sku AND company_id = v_company_id;
      
      IF v_current_stock IS NOT NULL THEN
        -- Calculer le nouveau stock
        v_new_stock := v_current_stock + v_received_qty;
        
        -- Mettre à jour le stock du produit
        UPDATE public.produits
        SET 
          stock_actuel = v_new_stock,
          updated_at = NOW()
        WHERE sku = v_sku AND company_id = v_company_id;
        
        v_updates_count := v_updates_count + 1;
        
        RAISE NOTICE '✅ Stock mis à jour pour SKU %: % -> % (+%)', 
          v_sku, v_current_stock, v_new_stock, v_received_qty;
      ELSE
        RAISE NOTICE '⚠️ Produit non trouvé pour SKU: %', v_sku;
      END IF;
    ELSE
      RAISE NOTICE '⏭️ Aucun stock à ajouter pour SKU % (reçu: %)', v_sku, v_received_qty;
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
    'message', 'Réconciliation confirmée avec succès',
    'order_id', p_order_id,
    'stock_updates', v_updates_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.confirm_order_reconciliation(TEXT) IS 
  'Confirme la réconciliation d''une commande, met à jour le stock des produits avec les quantités reçues, et marque la commande comme terminée';

-- ============================================
-- 2. FONCTION POUR RECALCULER LE STOCK MANUELLEMENT
-- ============================================
-- Utile si on doit recalculer le stock d'un produit spécifique

CREATE OR REPLACE FUNCTION public.add_stock_from_order(
  p_sku TEXT,
  p_company_id UUID,
  p_quantity INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_current_stock INTEGER;
  v_new_stock INTEGER;
BEGIN
  SET search_path = public;
  
  -- Vérifier les paramètres
  IF p_quantity <= 0 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'La quantité doit être positive'
    );
  END IF;
  
  -- Récupérer le stock actuel
  SELECT stock_actuel INTO v_current_stock
  FROM public.produits
  WHERE sku = p_sku AND company_id = p_company_id;
  
  IF v_current_stock IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Produit non trouvé'
    );
  END IF;
  
  -- Calculer et mettre à jour
  v_new_stock := v_current_stock + p_quantity;
  
  UPDATE public.produits
  SET 
    stock_actuel = v_new_stock,
    updated_at = NOW()
  WHERE sku = p_sku AND company_id = p_company_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'sku', p_sku,
    'previous_stock', v_current_stock,
    'added_quantity', p_quantity,
    'new_stock', v_new_stock
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.add_stock_from_order(TEXT, UUID, INTEGER) IS 
  'Ajoute une quantité au stock d''un produit (utilisé lors de la réception de commandes)';

-- ============================================
-- FIN DE LA MIGRATION 081
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 081 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ confirm_order_reconciliation() mise à jour';
  RAISE NOTICE '   ✅ Met à jour le stock_actuel des produits';
  RAISE NOTICE '   ✅ Calcule: reçu = commandé - manquant - endommagé';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ NOUVEAU:';
  RAISE NOTICE '   ✅ add_stock_from_order() - fonction utilitaire';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Le webhook Supabase → Gadget sera déclenché automatiquement';
  RAISE NOTICE '   quand stock_actuel change, pour sync vers Shopify!';
END $$;

