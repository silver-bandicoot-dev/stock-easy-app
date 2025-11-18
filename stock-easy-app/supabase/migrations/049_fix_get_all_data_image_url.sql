-- ============================================
-- Migration 049: Vérification et correction de get_all_data pour image_url
-- ============================================
-- Objectif: Vérifier que la colonne image_url existe et s'assurer qu'elle est retournée

-- Vérifier que la colonne image_url existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'produits'
      AND column_name = 'image_url'
  ) THEN
    RAISE EXCEPTION 'La colonne image_url n''existe pas dans la table produits. Exécutez d''abord la migration 040_add_produits_image_url.sql';
  ELSE
    RAISE NOTICE '✅ La colonne image_url existe dans la table produits';
  END IF;
END $$;

-- Version corrigée : utiliser row_to_json(p.*) pour s'assurer que toutes les colonnes sont incluses
CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel (peut être NULL)
  v_company_id := public.get_current_user_company_id();
  
  SELECT json_build_object(
    'products', (
      -- row_to_json devrait inclure toutes les colonnes y compris image_url
      SELECT COALESCE(json_agg(row_to_json(p.*)), '[]'::json) 
      FROM public.produits p
    ),
    'suppliers', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f
    ),
    'warehouses', (
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w
    ),
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
    'parameters', (
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param
    ),
    'skuSuppliers', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_all_data() IS 
  'Récupère toutes les données de l''application, incluant image_url pour les produits';

-- ============================================
-- FIN DE LA MIGRATION 049
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 049 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Fonction get_all_data() mise à jour';
  RAISE NOTICE '   ✅ Utilisation de row_to_json(p.*) pour s''assurer que toutes les colonnes sont incluses';
  RAISE NOTICE '   ✅ Vérification que la colonne image_url existe dans produits';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les images produits devraient maintenant être retournées correctement!';
END $$;

