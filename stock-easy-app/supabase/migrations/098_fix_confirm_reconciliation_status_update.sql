-- ============================================
-- Migration 098: Corriger confirm_order_reconciliation pour mettre à jour le statut
-- ============================================
-- PROBLÈME IDENTIFIÉ: La RPC retourne {success: true} mais ne met pas à jour le statut
-- de la commande à 'completed', donc les commandes restent bloquées en 'reconciliation'
--
-- SOLUTION: Mettre à jour la fonction pour qu'elle change correctement le statut
-- ============================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS public.confirm_order_reconciliation(TEXT);

-- Recréer la fonction avec la logique correcte
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
  v_rows_updated INTEGER;
BEGIN
  SET search_path = public;
  
  -- Vérifier que la commande existe
  SELECT * INTO v_order
  FROM public.commandes
  WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Commande introuvable',
      'order_id', p_order_id
    );
  END IF;
  
  -- Vérifier que la commande est en réconciliation
  IF v_order.status != 'reconciliation' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', format('La commande n''est pas en état de réconciliation (statut actuel: %s)', v_order.status),
      'order_id', p_order_id,
      'current_status', v_order.status
    );
  END IF;
  
  -- Récupérer le company_id de la commande
  v_company_id := v_order.company_id;
  
  RAISE NOTICE '🔄 Confirmation réconciliation pour commande % (company: %)', p_order_id, v_company_id;
  
  -- ============================================
  -- METTRE À JOUR LE STOCK AVEC LES QUANTITÉS MANQUANTES
  -- ============================================
  -- Quand on confirme une réconciliation (bouton "Compléter"),
  -- c'est que les quantités MANQUANTES sont finalement arrivées.
  -- On ajoute donc UNIQUEMENT les quantités manquantes, pas les reçues.
  
  IF v_order.items IS NOT NULL AND jsonb_array_length(v_order.items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      -- Extraire le SKU
      v_sku := v_item.value->>'sku';
      
      -- Vérifier que le SKU est valide
      IF v_sku IS NOT NULL AND v_sku != '' THEN
        -- Obtenir les quantités MANQUANTES pour ce SKU
        -- C'est ce qu'on doit ajouter car ces produits viennent d'arriver
        v_missing_qty := COALESCE((v_order.missing_quantities_by_sku->>(v_sku))::INTEGER, 0);
        
        RAISE NOTICE '📦 SKU %: quantités manquantes à ajouter = %', v_sku, v_missing_qty;
        
        -- Ajouter uniquement si des quantités étaient manquantes
        IF v_missing_qty > 0 THEN
          -- Récupérer le stock actuel du produit
          SELECT stock_actuel INTO v_current_stock
          FROM public.produits
          WHERE LOWER(sku) = LOWER(v_sku) AND company_id = v_company_id;
          
          IF v_current_stock IS NOT NULL THEN
            -- Calculer le nouveau stock: actuel + manquants (qui viennent d'arriver)
            v_new_stock := v_current_stock + v_missing_qty;
            
            -- Mettre à jour le stock du produit
            UPDATE public.produits
            SET 
              stock_actuel = v_new_stock,
              updated_at = NOW()
            WHERE LOWER(sku) = LOWER(v_sku) AND company_id = v_company_id;
            
            v_updates_count := v_updates_count + 1;
            
            RAISE NOTICE '✅ Stock mis à jour pour SKU %: % -> % (+% manquants)', 
              v_sku, v_current_stock, v_new_stock, v_missing_qty;
          ELSE
            RAISE NOTICE '⚠️ Produit non trouvé pour SKU: %', v_sku;
          END IF;
        ELSE
          RAISE NOTICE '⏭️ Aucune quantité manquante pour SKU %', v_sku;
        END IF;
      END IF;
    END LOOP;
  ELSE
    RAISE NOTICE '⚠️ Pas d''items dans la commande';
  END IF;
  
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
  
  -- Vérifier que la mise à jour a fonctionné
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated = 0 THEN
    RAISE NOTICE '❌ Aucune ligne mise à jour pour commande %', p_order_id;
    RETURN json_build_object(
      'success', FALSE,
      'error', 'La mise à jour du statut a échoué',
      'order_id', p_order_id
    );
  END IF;
  
  RAISE NOTICE '✅ Commande % mise à jour: status = completed, %s lignes affectées', p_order_id, v_rows_updated;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Réconciliation confirmée avec succès et stock mis à jour',
    'order_id', p_order_id,
    'updates_count', v_updates_count,
    'new_status', 'completed'
  );

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Erreur lors de la confirmation: %', SQLERRM;
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'order_id', p_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commenter la fonction
COMMENT ON FUNCTION public.confirm_order_reconciliation(TEXT) IS 
  'Confirme la réconciliation: ajoute les quantités MANQUANTES au stock (celles qui viennent d''arriver) et marque la commande comme terminée (status = completed)';

-- ============================================
-- FIN DE LA MIGRATION 098
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 098 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CORRECTIONS:';
  RAISE NOTICE '   ✅ Mise à jour du statut de la commande à "completed"';
  RAISE NOTICE '   ✅ Ajout des quantités manquantes au stock';
  RAISE NOTICE '   ✅ Matching SKU case-insensitive';
  RAISE NOTICE '   ✅ Meilleure gestion des erreurs';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ IMPORTANT:';
  RAISE NOTICE '   Si cette migration ne s''applique pas automatiquement,';
  RAISE NOTICE '   copiez ce SQL dans le Dashboard Supabase > SQL Editor';
  RAISE NOTICE '';
END $$;
