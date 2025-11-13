-- ============================================
-- FIX FINAL - Tout corriger en une seule fois
-- ============================================

-- 1. Créer la table des commentaires
CREATE TABLE IF NOT EXISTS public.order_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.commandes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentioned_users UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_user_id ON public.order_comments(user_id);

ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_authenticated_all_comments" ON public.order_comments;
CREATE POLICY "allow_authenticated_all_comments" ON public.order_comments 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. S'assurer que les colonnes de réconciliation existent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'missing_quantity_total') THEN
    ALTER TABLE public.commandes ADD COLUMN missing_quantity_total INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'damaged_quantity_total') THEN
    ALTER TABLE public.commandes ADD COLUMN damaged_quantity_total INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'missing_quantities_by_sku') THEN
    ALTER TABLE public.commandes ADD COLUMN missing_quantities_by_sku JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'damaged_quantities_by_sku') THEN
    ALTER TABLE public.commandes ADD COLUMN damaged_quantities_by_sku JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'reconciliation_confirmed_at') THEN
    ALTER TABLE public.commandes ADD COLUMN reconciliation_confirmed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commandes' AND column_name = 'reconciliation_confirmed_by') THEN
    ALTER TABLE public.commandes ADD COLUMN reconciliation_confirmed_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- 3. Créer le trigger de calcul des totaux
CREATE OR REPLACE FUNCTION public.calculate_reconciliation_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_missing_total INTEGER := 0;
  v_damaged_total INTEGER := 0;
  v_key TEXT;
  v_value TEXT;
BEGIN
  IF NEW.missing_quantities_by_sku IS NOT NULL THEN
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(NEW.missing_quantities_by_sku) LOOP
      v_missing_total := v_missing_total + COALESCE(v_value::INTEGER, 0);
    END LOOP;
  END IF;
  
  IF NEW.damaged_quantities_by_sku IS NOT NULL THEN
    FOR v_key, v_value IN SELECT * FROM jsonb_each_text(NEW.damaged_quantities_by_sku) LOOP
      v_damaged_total := v_damaged_total + COALESCE(v_value::INTEGER, 0);
    END LOOP;
  END IF;
  
  NEW.missing_quantity_total := v_missing_total;
  NEW.damaged_quantity_total := v_damaged_total;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_reconciliation_totals ON public.commandes;
CREATE TRIGGER trigger_calculate_reconciliation_totals
  BEFORE INSERT OR UPDATE OF missing_quantities_by_sku, damaged_quantities_by_sku
  ON public.commandes FOR EACH ROW
  EXECUTE FUNCTION public.calculate_reconciliation_totals();

-- 4. Créer la fonction de confirmation de réconciliation
CREATE OR REPLACE FUNCTION public.confirm_order_reconciliation(p_order_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_order RECORD;
BEGIN
  SELECT * INTO v_order FROM public.commandes WHERE id = p_order_id;
  
  IF v_order IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Commande introuvable');
  END IF;
  
  IF v_order.status != 'reconciliation' THEN
    RETURN json_build_object('success', FALSE, 'error', 'La commande n''est pas en réconciliation');
  END IF;
  
  UPDATE public.commandes
  SET 
    status = 'completed',
    completed_at = NOW(),
    reconciliation_confirmed_at = NOW(),
    reconciliation_confirmed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = p_order_id;
  
  RETURN json_build_object('success', TRUE, 'message', 'Réconciliation confirmée');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Mettre à jour get_all_data() avec les données de réconciliation
CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'products', (SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) FROM public.produits p),
    'suppliers', (SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) FROM public.fournisseurs f),
    'warehouses', (SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) FROM public.warehouses w),
    'orders', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'supplier', c.supplier,
          'warehouseId', c.warehouse_id,
          'status', c.status,
          'total', c.total,
          'createdAt', c.created_at,
          'eta', c.eta,
          'confirmedAt', c.confirmed_at,
          'shippedAt', c.shipped_at,
          'receivedAt', c.received_at,
          'completedAt', c.completed_at,
          'trackingNumber', c.tracking_number,
          'trackingUrl', c.tracking_url,
          'hasDiscrepancy', c.has_discrepancy,
          'damageReport', c.damage_report,
          'notes', c.notes,
          'missingQuantityTotal', c.missing_quantity_total,
          'damagedQuantityTotal', c.damaged_quantity_total,
          'missingQuantitiesBySku', c.missing_quantities_by_sku,
          'damagedQuantitiesBySku', c.damaged_quantities_by_sku,
          'reconciliationConfirmedAt', c.reconciliation_confirmed_at,
          'reconciliationConfirmedBy', c.reconciliation_confirmed_by,
          'items', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM public.articles_commande a WHERE a.order_id = c.id)
        )
      ), '[]'::json)
      FROM public.commandes c
    ),
    'parameters', (SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) FROM public.parametres param),
    'skuSuppliers', (SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) FROM public.sku_fournisseurs s)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonctions RPC pour les commentaires
CREATE OR REPLACE FUNCTION public.add_order_comment(
  p_order_id TEXT,
  p_content TEXT,
  p_mentioned_users UUID[] DEFAULT '{}'
)
RETURNS JSON AS $$
DECLARE
  v_comment_id UUID;
BEGIN
  INSERT INTO public.order_comments (order_id, user_id, content, mentioned_users)
  VALUES (p_order_id, auth.uid(), p_content, p_mentioned_users)
  RETURNING id INTO v_comment_id;
  
  RETURN json_build_object('success', TRUE, 'comment_id', v_comment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_order_comments(p_order_id TEXT)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
    FROM public.order_comments c
    WHERE c.order_id = p_order_id
    ORDER BY c.created_at DESC
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_order_comment(
  p_comment_id UUID,
  p_content TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.order_comments
  SET content = p_content, updated_at = NOW()
  WHERE id = p_comment_id AND user_id = auth.uid();
  
  IF FOUND THEN
    RETURN json_build_object('success', TRUE);
  ELSE
    RETURN json_build_object('success', FALSE, 'error', 'Non autorisé ou commentaire introuvable');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.delete_order_comment(p_comment_id UUID)
RETURNS JSON AS $$
BEGIN
  DELETE FROM public.order_comments
  WHERE id = p_comment_id AND user_id = auth.uid();
  
  IF FOUND THEN
    RETURN json_build_object('success', TRUE);
  ELSE
    RETURN json_build_object('success', FALSE, 'error', 'Non autorisé ou commentaire introuvable');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIN
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ TOUT EST CORRIGÉ !';
  RAISE NOTICE '  - Table order_comments créée';
  RAISE NOTICE '  - Fonctions RPC pour commentaires créées';
  RAISE NOTICE '  - Colonnes de réconciliation ajoutées';
  RAISE NOTICE '  - Trigger de calcul créé';
  RAISE NOTICE '  - Fonction confirm_order_reconciliation créée';
  RAISE NOTICE '  - get_all_data() mise à jour';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Rafraîchissez votre navigateur maintenant !';
END $$;

