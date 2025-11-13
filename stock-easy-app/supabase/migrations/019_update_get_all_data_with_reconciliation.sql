-- ============================================
-- Migration 019: Mise à jour de get_all_data pour inclure les données de réconciliation
-- ============================================

CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  SELECT json_build_object(
    'products', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) 
      FROM public.produits p 
      WHERE p.company_id = v_company_id OR p.company_id IS NULL
    ),
    'suppliers', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f 
      WHERE f.company_id = v_company_id OR f.company_id IS NULL
    ),
    'warehouses', (
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w 
      WHERE w.company_id = v_company_id OR w.company_id IS NULL
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
      WHERE c.company_id = v_company_id OR c.company_id IS NULL
    ),
    'parameters', (
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param 
      WHERE param.company_id = v_company_id OR param.company_id IS NULL
    ),
    'skuSuppliers', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s 
      WHERE s.company_id = v_company_id OR s.company_id IS NULL
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_all_data() IS 
  'Récupère toutes les données de l''application filtrées par company_id, incluant les données de réconciliation';

-- ============================================
-- FIN DE LA MIGRATION 019
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 019 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Fonction get_all_data() mise à jour';
  RAISE NOTICE '   ✅ Ajout des colonnes de réconciliation dans le retour:';
  RAISE NOTICE '      - missingQuantityTotal';
  RAISE NOTICE '      - damagedQuantityTotal';
  RAISE NOTICE '      - missingQuantitiesBySku';
  RAISE NOTICE '      - damagedQuantitiesBySku';
  RAISE NOTICE '      - reconciliationConfirmedAt';
  RAISE NOTICE '      - reconciliationConfirmedBy';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Les données de réconciliation seront maintenant visibles dans l''interface!';
END $$;

