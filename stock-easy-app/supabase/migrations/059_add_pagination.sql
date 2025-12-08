-- Migration 059: Ajout de la pagination serveur pour les commandes
-- Objectif: Permettre le chargement progressif de l'historique des commandes

CREATE OR REPLACE FUNCTION public.get_orders_paginated(
  p_page INTEGER,
  p_page_size INTEGER,
  p_status TEXT DEFAULT NULL,
  p_supplier TEXT DEFAULT NULL,
  p_start_date TEXT DEFAULT NULL,
  p_end_date TEXT DEFAULT NULL,
  p_search TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_offset INTEGER;
  v_total_count INTEGER;
  v_orders JSON;
  v_aggregates JSON;
  v_result JSON;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id
  v_company_id := public.get_current_user_company_id();
  
  -- Calculer l'offset
  v_offset := (p_page - 1) * p_page_size;

  -- 1. Calculer le nombre total et les agrégats
  SELECT 
    COUNT(*),
    json_build_object(
      'total_count', COUNT(*),
      'total_amount', COALESCE(SUM(c.total), 0),
      'status_counts', (
        SELECT json_object_agg(s.status, s.count)
        FROM (
          SELECT status, COUNT(*) as count
          FROM public.commandes sub
          WHERE sub.company_id = v_company_id
          AND (p_status IS NULL OR p_status = 'all' OR sub.status = p_status)
          AND (p_supplier IS NULL OR p_supplier = 'all' OR sub.supplier = p_supplier)
          AND (p_start_date IS NULL OR sub.created_at >= p_start_date::timestamp)
          AND (p_end_date IS NULL OR sub.created_at <= p_end_date::timestamp)
          AND (p_search IS NULL OR sub.id::text ILIKE '%' || p_search || '%' OR sub.supplier ILIKE '%' || p_search || '%')
          GROUP BY status
        ) s
      )
    )
  INTO v_total_count, v_aggregates
  FROM public.commandes c
  WHERE c.company_id = v_company_id
  AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
  AND (p_supplier IS NULL OR p_supplier = 'all' OR c.supplier = p_supplier)
  AND (p_start_date IS NULL OR c.created_at >= p_start_date::timestamp)
  AND (p_end_date IS NULL OR c.created_at <= p_end_date::timestamp)
  AND (p_search IS NULL OR c.id::text ILIKE '%' || p_search || '%' OR c.supplier ILIKE '%' || p_search || '%');

  -- 2. Récupérer les commandes paginées avec leurs items
  SELECT COALESCE(json_agg(
    json_build_object(
      'id', c.id,
      'supplier', c.supplier,
      'warehouseId', c.warehouse_id,
      'warehouseName', w.name, -- Joindre le nom de l'entrepôt si possible
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
    ) ORDER BY c.created_at DESC
  ), '[]'::json)
  INTO v_orders
  FROM (
    SELECT * FROM public.commandes c
    WHERE c.company_id = v_company_id
    AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
    AND (p_supplier IS NULL OR p_supplier = 'all' OR c.supplier = p_supplier)
    AND (p_start_date IS NULL OR c.created_at >= p_start_date::timestamp)
    AND (p_end_date IS NULL OR c.created_at <= p_end_date::timestamp)
    AND (p_search IS NULL OR c.id::text ILIKE '%' || p_search || '%' OR c.supplier ILIKE '%' || p_search || '%')
    ORDER BY c.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset
  ) c
  LEFT JOIN public.warehouses w ON c.warehouse_id = w.id;

  -- 3. Construire le résultat final
  SELECT json_build_object(
    'data', v_orders,
    'meta', json_build_object(
      'page', p_page,
      'pageSize', p_page_size,
      'totalCount', v_total_count,
      'totalPages', CEIL(v_total_count::numeric / p_page_size)
    ),
    'aggregates', v_aggregates
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_orders_paginated IS 'Récupère les commandes avec pagination, filtres et agrégats';




















