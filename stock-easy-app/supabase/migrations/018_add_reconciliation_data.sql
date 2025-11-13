-- ============================================
-- Migration 018: Ajout des données de réconciliation sur les commandes
-- ============================================
-- Cette migration ajoute les colonnes pour stocker les informations
-- de réconciliation (quantités manquantes et quantités endommagées)

-- ============================================
-- 1. AJOUTER LES COLONNES DE RÉCONCILIATION
-- ============================================

DO $$
BEGIN
  -- Quantités manquantes totales sur la commande
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'missing_quantity_total'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN missing_quantity_total INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne missing_quantity_total ajoutée';
  END IF;

  -- Quantités endommagées totales sur la commande
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'damaged_quantity_total'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN damaged_quantity_total INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne damaged_quantity_total ajoutée';
  END IF;

  -- Détails des quantités manquantes par SKU (JSONB)
  -- Format: {"SKU-001": 5, "SKU-002": 3}
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'missing_quantities_by_sku'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN missing_quantities_by_sku JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne missing_quantities_by_sku ajoutée';
  END IF;

  -- Détails des quantités endommagées par SKU (JSONB)
  -- Format: {"SKU-001": 2, "SKU-003": 1}
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'damaged_quantities_by_sku'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN damaged_quantities_by_sku JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ Colonne damaged_quantities_by_sku ajoutée';
  END IF;

  -- Date de confirmation de la réconciliation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'reconciliation_confirmed_at'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN reconciliation_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    RAISE NOTICE '✅ Colonne reconciliation_confirmed_at ajoutée';
  END IF;

  -- Utilisateur qui a confirmé la réconciliation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'commandes' AND column_name = 'reconciliation_confirmed_by'
  ) THEN
    ALTER TABLE public.commandes ADD COLUMN reconciliation_confirmed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Colonne reconciliation_confirmed_by ajoutée';
  END IF;

END $$;

-- ============================================
-- 2. INDEX POUR AMÉLIORER LES PERFORMANCES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_commandes_reconciliation_status 
  ON public.commandes(status) 
  WHERE status = 'reconciliation';

CREATE INDEX IF NOT EXISTS idx_commandes_reconciliation_confirmed 
  ON public.commandes(reconciliation_confirmed_at) 
  WHERE reconciliation_confirmed_at IS NOT NULL;

-- ============================================
-- 3. COMMENTAIRES SUR LES NOUVELLES COLONNES
-- ============================================

COMMENT ON COLUMN public.commandes.missing_quantity_total IS 
  'Total des quantités manquantes sur la commande (somme de toutes les quantités manquantes)';

COMMENT ON COLUMN public.commandes.damaged_quantity_total IS 
  'Total des quantités endommagées sur la commande (somme de toutes les quantités endommagées)';

COMMENT ON COLUMN public.commandes.missing_quantities_by_sku IS 
  'Détails des quantités manquantes par SKU (format JSON: {"SKU-001": 5, "SKU-002": 3})';

COMMENT ON COLUMN public.commandes.damaged_quantities_by_sku IS 
  'Détails des quantités endommagées par SKU (format JSON: {"SKU-001": 2, "SKU-003": 1})';

COMMENT ON COLUMN public.commandes.reconciliation_confirmed_at IS 
  'Date et heure de confirmation de la réconciliation par l''utilisateur';

COMMENT ON COLUMN public.commandes.reconciliation_confirmed_by IS 
  'ID de l''utilisateur qui a confirmé la réconciliation';

-- ============================================
-- 4. FONCTION POUR CALCULER LES TOTAUX
-- ============================================

-- Cette fonction calcule automatiquement les totaux à partir des détails JSONB
CREATE OR REPLACE FUNCTION public.calculate_reconciliation_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_missing_total INTEGER := 0;
  v_damaged_total INTEGER := 0;
  v_key TEXT;
  v_value TEXT;
BEGIN
  SET search_path = public;
  
  -- Calculer le total des quantités manquantes
  IF NEW.missing_quantities_by_sku IS NOT NULL THEN
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(NEW.missing_quantities_by_sku)
    LOOP
      v_missing_total := v_missing_total + COALESCE(v_value::INTEGER, 0);
    END LOOP;
  END IF;
  
  -- Calculer le total des quantités endommagées
  IF NEW.damaged_quantities_by_sku IS NOT NULL THEN
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(NEW.damaged_quantities_by_sku)
    LOOP
      v_damaged_total := v_damaged_total + COALESCE(v_value::INTEGER, 0);
    END LOOP;
  END IF;
  
  -- Mettre à jour les totaux
  NEW.missing_quantity_total := v_missing_total;
  NEW.damaged_quantity_total := v_damaged_total;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_calculate_reconciliation_totals ON public.commandes;
CREATE TRIGGER trigger_calculate_reconciliation_totals
  BEFORE INSERT OR UPDATE OF missing_quantities_by_sku, damaged_quantities_by_sku
  ON public.commandes
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_reconciliation_totals();

COMMENT ON TRIGGER trigger_calculate_reconciliation_totals ON public.commandes IS 
  'Calcule automatiquement les totaux des quantités manquantes et endommagées';

-- ============================================
-- 5. FONCTION RPC POUR CONFIRMER LA RÉCONCILIATION
-- ============================================

CREATE OR REPLACE FUNCTION public.confirm_order_reconciliation(
  p_order_id TEXT
)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
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
  
  -- Mettre à jour le statut de la commande
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
    'order_id', p_order_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.confirm_order_reconciliation(TEXT) IS 
  'Confirme la réconciliation d''une commande et la marque comme terminée';

-- ============================================
-- FIN DE LA MIGRATION 018
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 018 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 COLONNES AJOUTÉES:';
  RAISE NOTICE '   ✅ missing_quantity_total - Total des quantités manquantes';
  RAISE NOTICE '   ✅ damaged_quantity_total - Total des quantités endommagées';
  RAISE NOTICE '   ✅ missing_quantities_by_sku - Détails des quantités manquantes par SKU';
  RAISE NOTICE '   ✅ damaged_quantities_by_sku - Détails des quantités endommagées par SKU';
  RAISE NOTICE '   ✅ reconciliation_confirmed_at - Date de confirmation';
  RAISE NOTICE '   ✅ reconciliation_confirmed_by - Utilisateur ayant confirmé';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ FONCTIONNALITÉS:';
  RAISE NOTICE '   ✅ Trigger de calcul automatique des totaux';
  RAISE NOTICE '   ✅ Fonction RPC confirm_order_reconciliation()';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les commandes en réconciliation peuvent maintenant être confirmées!';
END $$;

