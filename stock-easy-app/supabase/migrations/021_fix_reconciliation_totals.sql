-- ============================================
-- Migration 021: Correction des totaux de réconciliation
-- ============================================
-- Cette migration recalcule les totaux missing_quantity_total et damaged_quantity_total
-- pour toutes les commandes en réconciliation qui pourraient avoir des totaux incorrects

-- ============================================
-- 1. FONCTION POUR RECALCULER LES TOTAUX
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_reconciliation_totals()
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_missing_total INTEGER;
  v_damaged_total INTEGER;
  v_key TEXT;
  v_value TEXT;
  v_updated_count INTEGER := 0;
BEGIN
  SET search_path = public;
  
  -- Parcourir toutes les commandes en réconciliation
  FOR v_order IN 
    SELECT id, missing_quantities_by_sku, damaged_quantities_by_sku, 
           missing_quantity_total, damaged_quantity_total
    FROM public.commandes
    WHERE status = 'reconciliation'
  LOOP
    -- Réinitialiser les totaux
    v_missing_total := 0;
    v_damaged_total := 0;
    
    -- Calculer le total des quantités manquantes
    IF v_order.missing_quantities_by_sku IS NOT NULL THEN
      FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_order.missing_quantities_by_sku)
      LOOP
        v_missing_total := v_missing_total + COALESCE(v_value::INTEGER, 0);
      END LOOP;
    END IF;
    
    -- Calculer le total des quantités endommagées
    IF v_order.damaged_quantities_by_sku IS NOT NULL THEN
      FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_order.damaged_quantities_by_sku)
      LOOP
        v_damaged_total := v_damaged_total + COALESCE(v_value::INTEGER, 0);
      END LOOP;
    END IF;
    
    -- Mettre à jour uniquement si les totaux sont différents
    IF v_order.missing_quantity_total IS DISTINCT FROM v_missing_total OR
       v_order.damaged_quantity_total IS DISTINCT FROM v_damaged_total THEN
      
      UPDATE public.commandes
      SET 
        missing_quantity_total = v_missing_total,
        damaged_quantity_total = v_damaged_total,
        updated_at = NOW()
      WHERE id = v_order.id;
      
      v_updated_count := v_updated_count + 1;
      
      RAISE NOTICE 'Commande % mise à jour: missing=% (était %), damaged=% (était %)',
        v_order.id, v_missing_total, v_order.missing_quantity_total,
        v_damaged_total, v_order.damaged_quantity_total;
    END IF;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.recalculate_reconciliation_totals() IS 
  'Recalcule les totaux de réconciliation pour toutes les commandes en réconciliation';

-- ============================================
-- 2. EXÉCUTER LA CORRECTION
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Début de la correction des totaux de réconciliation...';
  
  v_count := public.recalculate_reconciliation_totals();
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Correction terminée: % commande(s) mise(s) à jour', v_count;
  RAISE NOTICE '';
END $$;

-- ============================================
-- 3. AMÉLIORER LE TRIGGER EXISTANT
-- ============================================
-- S'assurer que le trigger se déclenche aussi lors de la mise à jour directe des totaux

DROP TRIGGER IF EXISTS trigger_calculate_reconciliation_totals ON public.commandes;

CREATE TRIGGER trigger_calculate_reconciliation_totals
  BEFORE INSERT OR UPDATE OF missing_quantities_by_sku, damaged_quantities_by_sku, missing_quantity_total, damaged_quantity_total
  ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_reconciliation_totals();

COMMENT ON TRIGGER trigger_calculate_reconciliation_totals ON public.commandes IS 
  'Calcule automatiquement les totaux des quantités manquantes et endommagées';

-- ============================================
-- FIN DE LA MIGRATION 021
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 021 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Fonction recalculate_reconciliation_totals() créée';
  RAISE NOTICE '   ✅ Totaux recalculés pour toutes les commandes en réconciliation';
  RAISE NOTICE '   ✅ Trigger amélioré pour garantir le calcul des totaux';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les écarts de livraison devraient maintenant s''afficher correctement!';
END $$;

