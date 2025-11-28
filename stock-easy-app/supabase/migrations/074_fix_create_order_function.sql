-- Migration 074: Correction de la fonction create_order
-- Objectif: Implémenter correctement la création de commandes avec leurs articles

DROP FUNCTION IF EXISTS public.create_order(text, text, text, jsonb, text);

CREATE OR REPLACE FUNCTION public.create_order(
  p_order_id TEXT,
  p_supplier TEXT,
  p_warehouse_id TEXT,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_warehouse_uuid UUID;
  v_total NUMERIC := 0;
  v_item JSONB;
  v_sku TEXT;
  v_quantity NUMERIC;
  v_price_per_unit NUMERIC;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'User not associated with a company');
  END IF;

  -- Résoudre l'entrepôt : accepter soit UUID soit nom
  BEGIN
    v_warehouse_uuid := p_warehouse_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    SELECT id INTO v_warehouse_uuid
    FROM public.warehouses
    WHERE name = p_warehouse_id AND company_id = v_company_id
    LIMIT 1;
    
    IF v_warehouse_uuid IS NULL THEN
      RETURN json_build_object('success', FALSE, 'error', 'Warehouse not found: ' || p_warehouse_id);
    END IF;
  END;

  -- Calculer le total de la commande
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    v_price_per_unit := COALESCE((v_item->>'pricePerUnit')::NUMERIC, 0);
    v_total := v_total + (v_quantity * v_price_per_unit);
  END LOOP;

  -- Créer la commande
  INSERT INTO public.commandes (
    id,
    company_id,
    supplier,
    warehouse_id,
    status,
    total,
    notes,
    created_at
  ) VALUES (
    p_order_id,
    v_company_id,
    p_supplier,
    v_warehouse_uuid,
    'pending_confirmation',
    v_total,
    p_notes,
    NOW()
  );

  -- Créer les articles de la commande
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_sku := v_item->>'sku';
    v_quantity := COALESCE((v_item->>'quantity')::NUMERIC, 0);
    v_price_per_unit := COALESCE((v_item->>'pricePerUnit')::NUMERIC, 0);

    INSERT INTO public.articles_commande (
      order_id,
      company_id,
      sku,
      quantity,
      price_per_unit,
      received_quantity,
      discrepancy_quantity,
      damaged_quantity
    ) VALUES (
      p_order_id,
      v_company_id,
      v_sku,
      v_quantity,
      v_price_per_unit,
      0,
      0,
      0
    );
  END LOOP;

  RETURN json_build_object(
    'success', TRUE, 
    'orderId', p_order_id,
    'total', v_total,
    'itemCount', jsonb_array_length(p_items)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sécuriser la fonction
ALTER FUNCTION public.create_order(text, text, text, jsonb, text) SET search_path = public;

COMMENT ON FUNCTION public.create_order(text, text, text, jsonb, text) IS 
  'Crée une nouvelle commande fournisseur avec ses articles (accepte nom ou UUID pour warehouse)';
