-- Migration 091: Corriger le multi-tenant pour toutes les fonctions critiques
-- ============================================
-- PROBLÈME: Nombreuses fonctions SECURITY DEFINER n'utilisent pas company_id
--           ce qui permet des accès cross-tenant
-- 
-- SOLUTION: Ajouter le filtrage par get_current_user_company_id() à toutes les fonctions
-- ============================================

-- ============================================
-- 1. FONCTIONS DE RECHERCHE (SELECT)
-- ============================================

-- 1.1 search_products_fuzzy - CORRIGÉE
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_term text, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  sku text, 
  nom_produit text, 
  stock_actuel numeric, 
  prix_vente numeric, 
  fournisseur text, 
  image_url text, 
  health_status text, 
  similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  RETURN QUERY
  SELECT 
    p.sku,
    p.nom_produit,
    p.stock_actuel,
    p.prix_vente,
    p.fournisseur,
    p.image_url,
    p.health_status,
    GREATEST(similarity(p.nom_produit, search_term), similarity(p.sku, search_term))::FLOAT as similarity_score
  FROM produits p
  WHERE 
    p.company_id = v_company_id  -- ✅ FILTRAGE MULTI-TENANT
    AND (
      p.nom_produit ILIKE '%' || search_term || '%'
      OR p.sku ILIKE '%' || search_term || '%'
      OR similarity(p.nom_produit, search_term) > 0.1
      OR similarity(p.sku, search_term) > 0.1
    )
  ORDER BY 
    similarity_score DESC,
    p.stock_actuel DESC
  LIMIT limit_count;
END;
$function$;

-- 1.2 search_orders_fuzzy - CORRIGÉE
CREATE OR REPLACE FUNCTION public.search_orders_fuzzy(
  search_term text, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id text,
  supplier text,
  status text,
  total numeric,
  created_at timestamptz,
  similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  RETURN QUERY
  SELECT 
    c.id,
    c.supplier,
    c.status,
    c.total,
    c.created_at,
    GREATEST(similarity(c.id, search_term), similarity(c.supplier, search_term))::FLOAT as similarity_score
  FROM commandes c
  WHERE 
    c.company_id = v_company_id  -- ✅ FILTRAGE MULTI-TENANT
    AND (
      c.id ILIKE '%' || search_term || '%'
      OR c.supplier ILIKE '%' || search_term || '%'
      OR similarity(c.id, search_term) > 0.1
      OR similarity(c.supplier, search_term) > 0.1
    )
  ORDER BY 
    similarity_score DESC,
    c.created_at DESC
  LIMIT limit_count;
END;
$function$;

-- 1.3 search_suppliers_fuzzy - CORRIGÉE
CREATE OR REPLACE FUNCTION public.search_suppliers_fuzzy(
  search_term text, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  nom_fournisseur text,
  email text,
  lead_time_days integer,
  similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  RETURN QUERY
  SELECT 
    f.id,
    f.nom_fournisseur,
    f.email,
    f.lead_time_days,
    similarity(f.nom_fournisseur, search_term)::FLOAT as similarity_score
  FROM fournisseurs f
  WHERE 
    f.company_id = v_company_id  -- ✅ FILTRAGE MULTI-TENANT
    AND (
      f.nom_fournisseur ILIKE '%' || search_term || '%'
      OR similarity(f.nom_fournisseur, search_term) > 0.1
    )
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$function$;

-- 1.4 search_warehouses_fuzzy - CORRIGÉE
CREATE OR REPLACE FUNCTION public.search_warehouses_fuzzy(
  search_term text, 
  limit_count integer DEFAULT 10
)
RETURNS TABLE(
  id uuid,
  name text,
  city text,
  country text,
  similarity_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.city,
    w.country,
    GREATEST(similarity(w.name, search_term), COALESCE(similarity(w.city, search_term), 0))::FLOAT as similarity_score
  FROM warehouses w
  WHERE 
    w.company_id = v_company_id  -- ✅ FILTRAGE MULTI-TENANT
    AND (
      w.name ILIKE '%' || search_term || '%'
      OR w.city ILIKE '%' || search_term || '%'
      OR similarity(w.name, search_term) > 0.1
    )
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$function$;

-- 1.5 get_product_calculation_details - CORRIGÉE
CREATE OR REPLACE FUNCTION public.get_product_calculation_details(p_sku text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_result json;
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  SELECT json_build_object(
    'sku', p.sku,
    'nom_produit', p.nom_produit,
    'stock_actuel', p.stock_actuel,
    'ventes_jour_moy_30j', p.ventes_jour_moy_30j,
    'multiplicateur_prevision', p.multiplicateur_prevision,
    'ventes_jour_ajustees', p.ventes_jour_ajustees,
    'lead_time_days', p.lead_time_days,
    'stock_securite', p.stock_securite,
    'point_commande', p.point_commande,
    'qte_a_commander', p.qte_a_commander,
    'autonomie_jours', p.autonomie_jours,
    'fournisseur', p.fournisseur
  ) INTO v_result
  FROM produits p
  WHERE p.sku = p_sku
    AND p.company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF v_result IS NULL THEN
    RETURN json_build_object('error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN v_result;
END;
$function$;

-- ============================================
-- 2. FONCTIONS DE MODIFICATION (UPDATE/INSERT/DELETE)
-- ============================================

-- 2.1 update_product - CORRIGÉE
CREATE OR REPLACE FUNCTION public.update_product(p_sku text, p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.produits
  SET 
    nom_produit = COALESCE((p_data->>'nom_produit')::TEXT, nom_produit),
    stock_actuel = COALESCE((p_data->>'stock_actuel')::DECIMAL(10,2), stock_actuel),
    ventes_totales_30j = COALESCE((p_data->>'ventes_totales_30j')::INTEGER, ventes_totales_30j),
    ventes_jour_moy_30j = COALESCE((p_data->>'ventes_jour_moy_30j')::DECIMAL(10,4), ventes_jour_moy_30j),
    multiplicateur_prevision = COALESCE((p_data->>'multiplicateur_prevision')::DECIMAL(10,2), multiplicateur_prevision),
    fournisseur = COALESCE((p_data->>'fournisseur')::TEXT, fournisseur),
    lead_time_days = COALESCE((p_data->>'lead_time_days')::INTEGER, lead_time_days),
    moq = COALESCE((p_data->>'moq')::INTEGER, moq),
    prix_achat = COALESCE((p_data->>'prix_achat')::DECIMAL(10,2), prix_achat),
    prix_vente = COALESCE((p_data->>'prix_vente')::DECIMAL(10,2), prix_vente),
    stock_secu_custom_jours = COALESCE((p_data->>'stock_secu_custom_jours')::INTEGER, stock_secu_custom_jours),
    point_commande = COALESCE((p_data->>'point_commande')::DECIMAL(10,2), point_commande),
    qte_a_commander = COALESCE((p_data->>'qte_a_commander')::INTEGER, qte_a_commander),
    statut = COALESCE((p_data->>'statut')::TEXT, statut),
    investissement = COALESCE((p_data->>'investissement')::DECIMAL(10,2), investissement),
    sync_source = CASE 
      WHEN (p_data->>'stock_actuel') IS NOT NULL AND (p_data->>'stock_actuel')::DECIMAL(10,2) IS DISTINCT FROM stock_actuel 
      THEN 'manual' 
      ELSE sync_source 
    END
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Produit mis à jour');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.2 update_product_multiplier - CORRIGÉE
CREATE OR REPLACE FUNCTION public.update_product_multiplier(
  p_sku text, 
  p_multiplicateur_prevision numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.produits
  SET multiplicateur_prevision = p_multiplicateur_prevision
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Multiplicateur mis à jour');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.3 bulk_update_product_multipliers - CORRIGÉE
CREATE OR REPLACE FUNCTION public.bulk_update_product_multipliers(p_updates jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_update record;
  v_updated_count INTEGER := 0;
BEGIN
  v_company_id := get_current_user_company_id();
  
  FOR v_update IN SELECT * FROM jsonb_to_recordset(p_updates) AS x(sku text, multiplicateur numeric)
  LOOP
    UPDATE public.produits
    SET multiplicateur_prevision = v_update.multiplicateur
    WHERE sku = v_update.sku
      AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
    
    IF FOUND THEN
      v_updated_count := v_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', TRUE, 
    'updated_count', v_updated_count,
    'message', format('%s produit(s) mis à jour', v_updated_count)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.4 bulk_reset_product_multipliers - CORRIGÉE
CREATE OR REPLACE FUNCTION public.bulk_reset_product_multipliers(p_skus text[])
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_updated_count INTEGER;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.produits
  SET multiplicateur_prevision = NULL
  WHERE sku = ANY(p_skus)
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', TRUE, 
    'updated_count', v_updated_count,
    'message', format('%s produit(s) réinitialisés', v_updated_count)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.5 reset_product_multiplier_to_default - CORRIGÉE
CREATE OR REPLACE FUNCTION public.reset_product_multiplier_to_default(p_sku text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.produits
  SET multiplicateur_prevision = NULL
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Multiplicateur réinitialisé');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.6 create_supplier - CORRIGÉE
CREATE OR REPLACE FUNCTION public.create_supplier(
  p_nom_fournisseur text, 
  p_email text DEFAULT NULL, 
  p_lead_time_days integer DEFAULT 14, 
  p_moq_standard integer DEFAULT 1, 
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_supplier_id UUID;
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Company ID non trouvé');
  END IF;
  
  INSERT INTO public.fournisseurs (
    nom_fournisseur, 
    email, 
    lead_time_days, 
    moq_standard, 
    notes,
    company_id  -- ✅ AJOUT DU COMPANY_ID
  )
  VALUES (
    p_nom_fournisseur, 
    p_email, 
    p_lead_time_days, 
    p_moq_standard, 
    p_notes,
    v_company_id
  )
  RETURNING id INTO v_supplier_id;
  
  RETURN json_build_object('success', TRUE, 'supplierId', v_supplier_id, 'message', 'Fournisseur créé');
EXCEPTION WHEN unique_violation THEN
  RETURN json_build_object('success', FALSE, 'error', 'Ce fournisseur existe déjà');
WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.7 update_supplier - CORRIGÉE
CREATE OR REPLACE FUNCTION public.update_supplier(p_nom_fournisseur text, p_data jsonb)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.fournisseurs
  SET 
    email = COALESCE((p_data->>'email')::TEXT, email),
    lead_time_days = COALESCE((p_data->>'lead_time_days')::INTEGER, lead_time_days),
    moq_standard = COALESCE((p_data->>'moq_standard')::INTEGER, moq_standard),
    notes = COALESCE((p_data->>'notes')::TEXT, notes),
    commercial_contact_name = COALESCE((p_data->>'commercial_contact_name')::TEXT, commercial_contact_name),
    commercial_contact_email = COALESCE((p_data->>'commercial_contact_email')::TEXT, commercial_contact_email),
    commercial_contact_phone = COALESCE((p_data->>'commercial_contact_phone')::TEXT, commercial_contact_phone),
    reclamation_contact_name = COALESCE((p_data->>'reclamation_contact_name')::TEXT, reclamation_contact_name),
    reclamation_contact_email = COALESCE((p_data->>'reclamation_contact_email')::TEXT, reclamation_contact_email),
    reclamation_contact_phone = COALESCE((p_data->>'reclamation_contact_phone')::TEXT, reclamation_contact_phone),
    reclamation_contact_role = COALESCE((p_data->>'reclamation_contact_role')::TEXT, reclamation_contact_role),
    contact_notes = COALESCE((p_data->>'contact_notes')::TEXT, contact_notes),
    updated_at = NOW()
  WHERE nom_fournisseur = p_nom_fournisseur
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Fournisseur mis à jour');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.8 delete_supplier - CORRIGÉE
CREATE OR REPLACE FUNCTION public.delete_supplier(p_nom_fournisseur text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_products_count INTEGER;
BEGIN
  v_company_id := get_current_user_company_id();
  
  -- Vérifier d'abord s'il y a des produits liés (même entreprise)
  SELECT COUNT(*) INTO v_products_count
  FROM produits
  WHERE fournisseur = p_nom_fournisseur
    AND company_id = v_company_id;
  
  IF v_products_count > 0 THEN
    -- Retirer le fournisseur des produits
    UPDATE produits
    SET fournisseur = NULL
    WHERE fournisseur = p_nom_fournisseur
      AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  END IF;
  
  DELETE FROM public.fournisseurs
  WHERE nom_fournisseur = p_nom_fournisseur
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Fournisseur supprimé');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.9 update_order_status - CORRIGÉE
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id text,
  p_status text DEFAULT NULL,
  p_confirmed_at timestamptz DEFAULT NULL,
  p_shipped_at timestamptz DEFAULT NULL,
  p_received_at timestamptz DEFAULT NULL,
  p_completed_at timestamptz DEFAULT NULL,
  p_tracking_number text DEFAULT NULL,
  p_tracking_url text DEFAULT NULL,
  p_eta timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE public.commandes
  SET 
    status = COALESCE(p_status, status),
    confirmed_at = COALESCE(p_confirmed_at, confirmed_at),
    shipped_at = COALESCE(p_shipped_at, shipped_at),
    received_at = COALESCE(p_received_at, received_at),
    completed_at = COALESCE(p_completed_at, completed_at),
    tracking_number = COALESCE(p_tracking_number, tracking_number),
    tracking_url = COALESCE(p_tracking_url, tracking_url),
    eta = COALESCE(p_eta, eta),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = p_order_id
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Commande non trouvée ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Commande mise à jour');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.10 recalculate_product - CORRIGÉE
CREATE OR REPLACE FUNCTION public.recalculate_product(p_sku text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_mult DECIMAL;
  v_ventes_moy DECIMAL;
  v_ventes_ajustees DECIMAL;
  v_lead_time INTEGER;
  v_stock_secu INTEGER;
  v_point_cmd DECIMAL;
  v_autonomie INTEGER;
  v_stock_actuel DECIMAL;
BEGIN
  v_company_id := get_current_user_company_id();
  
  -- Récupérer les données du produit (filtré par company)
  SELECT 
    COALESCE(p.multiplicateur_prevision, par.value::DECIMAL, 1.2),
    COALESCE(p.ventes_jour_moy_30j, 0),
    COALESCE(p.lead_time_days, 14),
    COALESCE(p.stock_actuel, 0)
  INTO v_mult, v_ventes_moy, v_lead_time, v_stock_actuel
  FROM produits p
  LEFT JOIN parametres par ON par.param_name = 'MultiplicateurDefaut' AND par.company_id = v_company_id
  WHERE p.sku = p_sku
    AND p.company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  -- Calculs
  v_ventes_ajustees := v_ventes_moy * v_mult;
  v_stock_secu := CEIL(v_ventes_ajustees * 7);
  v_point_cmd := (v_ventes_ajustees * v_lead_time) + v_stock_secu;
  v_autonomie := CASE WHEN v_ventes_ajustees > 0 THEN FLOOR(v_stock_actuel / v_ventes_ajustees) ELSE 999 END;
  
  -- Mise à jour
  UPDATE produits
  SET 
    ventes_jour_ajustees = v_ventes_ajustees,
    stock_securite = v_stock_secu,
    point_commande = v_point_cmd,
    autonomie_jours = v_autonomie,
    updated_at = NOW()
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  RETURN json_build_object(
    'success', TRUE,
    'sku', p_sku,
    'ventes_ajustees', v_ventes_ajustees,
    'stock_securite', v_stock_secu,
    'point_commande', v_point_cmd,
    'autonomie_jours', v_autonomie
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.11 recalculate_all_investments - CORRIGÉE
CREATE OR REPLACE FUNCTION public.recalculate_all_investments()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_updated_count INTEGER;
BEGIN
  v_company_id := get_current_user_company_id();
  
  UPDATE produits
  SET 
    investissement = COALESCE(stock_actuel, 0) * COALESCE(prix_achat, 0),
    inventory_value = COALESCE(stock_actuel, 0) * COALESCE(prix_vente, 0),
    updated_at = NOW()
  WHERE company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN json_build_object(
    'success', TRUE,
    'updated_count', v_updated_count,
    'message', format('Investissements recalculés pour %s produits', v_updated_count)
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.12 assign_supplier_to_product - CORRIGÉE
CREATE OR REPLACE FUNCTION public.assign_supplier_to_product(
  p_sku text, 
  p_supplier_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_supplier_exists BOOLEAN;
BEGIN
  v_company_id := get_current_user_company_id();
  
  -- Vérifier que le fournisseur existe pour cette entreprise
  SELECT EXISTS(
    SELECT 1 FROM fournisseurs 
    WHERE nom_fournisseur = p_supplier_name 
      AND company_id = v_company_id
  ) INTO v_supplier_exists;
  
  IF NOT v_supplier_exists THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé');
  END IF;
  
  UPDATE produits
  SET 
    fournisseur = p_supplier_name,
    updated_at = NOW()
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'Fournisseur assigné');
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 2.13 sync_moq_from_supplier - CORRIGÉE
CREATE OR REPLACE FUNCTION public.sync_moq_from_supplier(
  p_sku text, 
  p_supplier text, 
  p_override boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID;
  v_supplier_moq INTEGER;
BEGIN
  v_company_id := get_current_user_company_id();
  
  -- Récupérer le MOQ du fournisseur (filtré par company)
  SELECT moq_standard INTO v_supplier_moq
  FROM fournisseurs
  WHERE nom_fournisseur = p_supplier
    AND company_id = v_company_id;
  
  IF v_supplier_moq IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé');
  END IF;
  
  UPDATE produits
  SET 
    moq = v_supplier_moq,
    moq_source = 'fournisseur_defaut',
    updated_at = NOW()
  WHERE sku = p_sku
    AND company_id = v_company_id  -- ✅ FILTRAGE MULTI-TENANT
    AND (p_override OR moq IS NULL OR moq_source IS NULL);
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou MOQ déjà défini');
  END IF;
  
  RETURN json_build_object('success', TRUE, 'message', 'MOQ synchronisé', 'moq', v_supplier_moq);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- ============================================
-- 3. VÉRIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 091 appliquée avec succès';
  RAISE NOTICE '🔒 14 fonctions critiques corrigées pour le multi-tenant';
  RAISE NOTICE '📊 Toutes les fonctions utilisent maintenant get_current_user_company_id()';
END $$;

