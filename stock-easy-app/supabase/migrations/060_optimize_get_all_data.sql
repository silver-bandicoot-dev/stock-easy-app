-- Migration 060: Optimisation de get_all_data et correction sécurité
-- Objectif: 
-- 1. Restaurer le filtrage par company_id (correction régression potentielle)
-- 2. Limiter le chargement des commandes aux actives et récentes (90 jours) pour la performance

CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  -- Si pas de company_id, retourner un objet vide structuré
  IF v_company_id IS NULL THEN
     SELECT json_build_object(
      'products', '[]'::json,
      'suppliers', '[]'::json,
      'warehouses', '[]'::json,
      'orders', '[]'::json,
      'parameters', '[]'::json,
      'skuSuppliers', '[]'::json
    ) INTO result;
    RETURN result;
  END IF;

  SELECT json_build_object(
    'products', (
      SELECT COALESCE(json_agg(row_to_json(p.*)), '[]'::json) 
      FROM public.produits p
      WHERE p.company_id = v_company_id
    ),
    'suppliers', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f
      WHERE f.company_id = v_company_id
    ),
    'warehouses', (
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w
      WHERE w.company_id = v_company_id
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
          'items', (
            SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) 
            FROM public.articles_commande a 
            WHERE a.order_id = c.id
          )
        )
      ), '[]'::json)
      FROM public.commandes c
      WHERE c.company_id = v_company_id
      AND (
        -- Garder toutes les commandes actives
        c.status IN ('pending_confirmation', 'preparing', 'in_transit', 'received', 'reconciliation')
        OR 
        -- Garder les commandes complétées ou annulées des 90 derniers jours seulement
        c.created_at > (NOW() - INTERVAL '90 days')
      )
    ),
    'parameters', (
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param
      WHERE param.company_id = v_company_id
    ),
    'skuSuppliers', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s
      WHERE s.company_id = v_company_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_all_data() IS 
  'Récupère les données (produits, fournisseurs...) et les commandes actives/récentes (90j)';












