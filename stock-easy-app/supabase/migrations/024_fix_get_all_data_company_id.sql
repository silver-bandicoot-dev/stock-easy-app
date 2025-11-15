-- ============================================
-- Migration 024: Correction de get_all_data pour supprimer les références à company_id inexistantes
-- ============================================

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
      -- La table produits n'a pas de colonne company_id, donc on récupère tous les produits
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) 
      FROM public.produits p
    ),
    'suppliers', (
      -- La table fournisseurs n'a pas de colonne company_id, donc on récupère tous les fournisseurs
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f
    ),
    'warehouses', (
      -- La table warehouses n'a pas de colonne company_id, donc on récupère tous les entrepôts
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w
    ),
    'orders', (
      -- La table commandes n'a pas de colonne company_id, donc on récupère toutes les commandes
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
      -- La table parametres n'a pas de colonne company_id, donc on récupère tous les paramètres
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param
    ),
    'skuSuppliers', (
      -- La table sku_fournisseurs n'a pas de colonne company_id, donc on récupère tous les sku_fournisseurs
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_all_data() IS 
  'Récupère toutes les données de l''application, incluant les données de réconciliation';

-- ============================================
-- FIN DE LA MIGRATION 024
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 024 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Fonction get_all_data() corrigée';
  RAISE NOTICE '   ✅ Suppression des références à company_id pour les tables qui ne l''ont pas:';
  RAISE NOTICE '      - produits';
  RAISE NOTICE '      - fournisseurs';
  RAISE NOTICE '      - warehouses';
  RAISE NOTICE '      - commandes';
  RAISE NOTICE '      - parametres';
  RAISE NOTICE '      - sku_fournisseurs';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 La fonction get_all_data fonctionne maintenant correctement!';
END $$;

