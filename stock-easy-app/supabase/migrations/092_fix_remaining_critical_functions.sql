-- Migration 092: Correction des fonctions critiques restantes pour le multi-tenant
-- Date: 2025-12-07
-- Description: Ajoute le filtrage company_id à toutes les fonctions SECURITY DEFINER critiques

SET search_path = public;

-- ============================================================================
-- SECTION 1: COMMENTAIRES DE COMMANDES (order_comments)
-- ============================================================================

-- 1. get_order_comments: Lire les commentaires d'une commande
CREATE OR REPLACE FUNCTION public.get_order_comments(p_order_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
    FROM public.order_comments c
    WHERE c.order_id = p_order_id
      AND c.company_id = v_company_id  -- FILTRAGE AJOUTÉ
    ORDER BY c.created_at DESC
  );
END;
$function$;

-- 2. add_order_comment: Ajouter un commentaire
CREATE OR REPLACE FUNCTION public.add_order_comment(
  p_order_id text, 
  p_content text, 
  p_mentioned_users uuid[] DEFAULT '{}'::uuid[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_comment_id UUID;
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que la commande appartient à la même compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.commandes 
    WHERE id = p_order_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou accès refusé';
  END IF;

  INSERT INTO public.order_comments (order_id, user_id, content, mentioned_users, company_id)
  VALUES (p_order_id, auth.uid(), p_content, p_mentioned_users, v_company_id)
  RETURNING id INTO v_comment_id;
  
  RETURN json_build_object('success', TRUE, 'comment_id', v_comment_id);
END;
$function$;

-- 3. update_order_comment: Modifier un commentaire
CREATE OR REPLACE FUNCTION public.update_order_comment(p_comment_id uuid, p_content text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  UPDATE public.order_comments
  SET content = p_content, updated_at = NOW()
  WHERE id = p_comment_id
    AND company_id = v_company_id  -- FILTRAGE AJOUTÉ
    AND user_id = auth.uid();  -- Seul l'auteur peut modifier
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Commentaire non trouvé ou accès refusé');
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$function$;

-- 4. delete_order_comment: Supprimer un commentaire
CREATE OR REPLACE FUNCTION public.delete_order_comment(p_comment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  DELETE FROM public.order_comments
  WHERE id = p_comment_id
    AND company_id = v_company_id  -- FILTRAGE AJOUTÉ
    AND user_id = auth.uid();  -- Seul l'auteur peut supprimer
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Commentaire non trouvé ou accès refusé');
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$function$;

-- ============================================================================
-- SECTION 2: RÉCONCILIATION DE COMMANDES
-- ============================================================================

-- 5. process_order_reconciliation: Traiter la réconciliation d'une commande
CREATE OR REPLACE FUNCTION public.process_order_reconciliation(
  p_order_id text, 
  p_items jsonb, 
  p_damage_report text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item JSONB;
  v_has_discrepancy BOOLEAN := FALSE;
  v_sku TEXT;
  v_received_qty DECIMAL(10,2);
  v_discrepancy_type TEXT;
  v_discrepancy_qty DECIMAL(10,2);
  v_damaged_qty DECIMAL(10,2);
  v_stock_to_add DECIMAL(10,2);
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que la commande appartient à la compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.commandes 
    WHERE id = p_order_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou accès refusé';
  END IF;

  -- Parcourir tous les articles
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_sku := v_item->>'sku';
    v_received_qty := COALESCE((v_item->>'receivedQuantity')::DECIMAL(10,2), 0);
    v_discrepancy_type := v_item->>'discrepancyType';
    v_discrepancy_qty := COALESCE((v_item->>'discrepancyQuantity')::DECIMAL(10,2), 0);
    v_damaged_qty := COALESCE((v_item->>'damagedQuantity')::DECIMAL(10,2), 0);
    
    -- Vérifier anomalie
    IF v_discrepancy_type IS NOT NULL AND v_discrepancy_type != 'none' THEN
      v_has_discrepancy := TRUE;
    END IF;
    
    -- Stock à ajouter = reçu - endommagé
    v_stock_to_add := v_received_qty - v_damaged_qty;
    
    -- Mettre à jour l'article (avec filtrage company_id)
    UPDATE public.articles_commande
    SET 
      received_quantity = v_received_qty,
      discrepancy_type = v_discrepancy_type,
      discrepancy_quantity = v_discrepancy_qty,
      damaged_quantity = v_damaged_qty,
      discrepancy_notes = v_item->>'discrepancyNotes',
      updated_at = NOW()
    WHERE order_id = p_order_id 
      AND sku = v_sku
      AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
    
    -- Mettre à jour le stock produit (avec filtrage company_id)
    UPDATE public.produits
    SET 
      stock_actuel = stock_actuel + v_stock_to_add,
      sync_source = 'manual'
    WHERE sku = v_sku
      AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  END LOOP;
  
  -- Mettre à jour la commande (avec filtrage company_id)
  UPDATE public.commandes
  SET 
    status = 'completed',
    completed_at = NOW(),
    has_discrepancy = v_has_discrepancy,
    damage_report = p_damage_report
  WHERE id = p_order_id
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  RETURN json_build_object(
    'success', TRUE,
    'hasDiscrepancy', v_has_discrepancy,
    'message', 'Réconciliation terminée'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 6. confirm_order_reconciliation: Confirmer la réconciliation
CREATE OR REPLACE FUNCTION public.confirm_order_reconciliation(p_order_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que la commande appartient à la compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.commandes 
    WHERE id = p_order_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou accès refusé';
  END IF;

  UPDATE public.commandes
  SET 
    reconciliation_confirmed_at = NOW(),
    reconciliation_confirmed_by = auth.uid()
  WHERE id = p_order_id
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  RETURN json_build_object('success', TRUE);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 7. receive_replacement_items: Recevoir des articles de remplacement
CREATE OR REPLACE FUNCTION public.receive_replacement_items(
  p_order_id text, 
  p_replacements jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item JSONB;
  v_sku TEXT;
  v_qty DECIMAL(10,2);
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que la commande appartient à la compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.commandes 
    WHERE id = p_order_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou accès refusé';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_replacements)
  LOOP
    v_sku := v_item->>'sku';
    v_qty := (v_item->>'quantity')::DECIMAL(10,2);
    
    -- Ajouter au stock (avec filtrage company_id)
    UPDATE public.produits
    SET 
      stock_actuel = stock_actuel + v_qty,
      sync_source = 'manual'
    WHERE sku = v_sku
      AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  END LOOP;
  
  RETURN json_build_object('success', TRUE);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- ============================================================================
-- SECTION 3: CALCULS ET SYNCHRONISATIONS PRODUITS
-- ============================================================================

-- 8. recalculate_product: Recalculer les métriques d'un produit
CREATE OR REPLACE FUNCTION public.recalculate_product(p_sku text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que le produit appartient à la compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.produits 
    WHERE sku = p_sku AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Produit non trouvé ou accès refusé';
  END IF;

  -- Appeler la fonction de calcul existante (elle doit déjà filtrer par company_id via RLS)
  PERFORM public.calculate_product_metrics();
  
  RETURN json_build_object('success', TRUE);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 9. get_product_calculation_details: Détails de calcul d'un produit
CREATE OR REPLACE FUNCTION public.get_product_calculation_details(p_sku text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
  v_product RECORD;
BEGIN
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé');
  END IF;
  
  RETURN json_build_object(
    'success', TRUE,
    'product', row_to_json(v_product)
  );
END;
$function$;

-- 10. sync_moq_from_supplier: Synchroniser le MOQ depuis le fournisseur
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
  v_company_id UUID := public.get_current_user_company_id();
  v_moq INTEGER;
BEGIN
  -- Récupérer le MOQ du fournisseur (avec filtrage company_id)
  SELECT moq_standard INTO v_moq
  FROM public.fournisseurs
  WHERE nom_fournisseur = p_supplier
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  IF v_moq IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé');
  END IF;
  
  -- Mettre à jour le produit (avec filtrage company_id)
  UPDATE public.produits
  SET moq = v_moq
  WHERE sku = p_sku
    AND company_id = v_company_id  -- FILTRAGE AJOUTÉ
    AND (p_override OR moq IS NULL);
  
  RETURN json_build_object('success', TRUE, 'moq', v_moq);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 11. remove_supplier_from_product: Retirer un fournisseur d'un produit
CREATE OR REPLACE FUNCTION public.remove_supplier_from_product(
  p_sku text, 
  p_supplier_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Mettre à jour le produit (avec filtrage company_id)
  UPDATE public.produits
  SET fournisseur = NULL
  WHERE sku = p_sku
    AND fournisseur = p_supplier_name
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé');
  END IF;
  
  RETURN json_build_object('success', TRUE);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- ============================================================================
-- SECTION 4: NOTIFICATIONS
-- ============================================================================

-- 12. create_notification: Créer une notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid, 
  p_type text, 
  p_title text, 
  p_message text, 
  p_link text DEFAULT NULL::text, 
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_notification_id UUID;
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que l'utilisateur cible appartient à la même compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = p_user_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Utilisateur non trouvé dans votre organisation';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, link, metadata, company_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata, v_company_id)
  RETURNING id INTO v_notification_id;
  
  RETURN json_build_object('success', TRUE, 'notification_id', v_notification_id);
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

-- 13. mark_notification_as_read: Marquer une notification comme lue
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE id = p_notification_id
    AND user_id = auth.uid()  -- Seul le destinataire peut marquer comme lu
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Notification non trouvée');
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$function$;

-- 14. mark_all_notifications_as_read: Marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
  v_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN json_build_object('success', TRUE, 'count', v_count);
END;
$function$;

-- 15. get_grouped_notifications: Récupérer les notifications groupées
CREATE OR REPLACE FUNCTION public.get_grouped_notifications(p_limit integer DEFAULT 50)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(n)), '[]'::json)
    FROM (
      SELECT *
      FROM public.notifications
      WHERE user_id = auth.uid()
        AND company_id = v_company_id  -- FILTRAGE AJOUTÉ
      ORDER BY created_at DESC
      LIMIT p_limit
    ) n
  );
END;
$function$;

-- ============================================================================
-- SECTION 5: RÉCONCILIATION DES ARTICLES (UUID version)
-- ============================================================================

-- 16. process_order_reconciliation (UUID version): Traiter la réconciliation avec UUID
CREATE OR REPLACE FUNCTION public.process_order_reconciliation(
  p_order_id uuid, 
  p_items jsonb, 
  p_notes text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item JSONB;
  v_has_discrepancy BOOLEAN := FALSE;
  v_sku TEXT;
  v_received_qty DECIMAL(10,2);
  v_discrepancy_type TEXT;
  v_discrepancy_qty DECIMAL(10,2);
  v_damaged_qty DECIMAL(10,2);
  v_stock_to_add DECIMAL(10,2);
  v_company_id UUID := public.get_current_user_company_id();
BEGIN
  -- Vérifier que la commande appartient à la compagnie
  IF NOT EXISTS (
    SELECT 1 FROM public.commandes 
    WHERE id::uuid = p_order_id AND company_id = v_company_id
  ) THEN
    RAISE EXCEPTION 'Commande non trouvée ou accès refusé';
  END IF;

  -- Même logique que la version TEXT
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_sku := v_item->>'sku';
    v_received_qty := COALESCE((v_item->>'receivedQuantity')::DECIMAL(10,2), 0);
    v_discrepancy_type := v_item->>'discrepancyType';
    v_discrepancy_qty := COALESCE((v_item->>'discrepancyQuantity')::DECIMAL(10,2), 0);
    v_damaged_qty := COALESCE((v_item->>'damagedQuantity')::DECIMAL(10,2), 0);
    
    IF v_discrepancy_type IS NOT NULL AND v_discrepancy_type != 'none' THEN
      v_has_discrepancy := TRUE;
    END IF;
    
    v_stock_to_add := v_received_qty - v_damaged_qty;
    
    UPDATE public.articles_commande
    SET 
      received_quantity = v_received_qty,
      discrepancy_type = v_discrepancy_type,
      discrepancy_quantity = v_discrepancy_qty,
      damaged_quantity = v_damaged_qty,
      discrepancy_notes = v_item->>'discrepancyNotes',
      updated_at = NOW()
    WHERE order_id = p_order_id::text
      AND sku = v_sku
      AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
    
    UPDATE public.produits
    SET 
      stock_actuel = stock_actuel + v_stock_to_add,
      sync_source = 'manual'
    WHERE sku = v_sku
      AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  END LOOP;
  
  UPDATE public.commandes
  SET 
    status = 'completed',
    completed_at = NOW(),
    has_discrepancy = v_has_discrepancy,
    notes = p_notes
  WHERE id::uuid = p_order_id
    AND company_id = v_company_id;  -- FILTRAGE AJOUTÉ
  
  RETURN json_build_object(
    'success', TRUE,
    'hasDiscrepancy', v_has_discrepancy,
    'message', 'Réconciliation terminée'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

COMMENT ON FUNCTION public.get_order_comments IS 'Récupère les commentaires d''une commande (multi-tenant)';
COMMENT ON FUNCTION public.add_order_comment IS 'Ajoute un commentaire à une commande (multi-tenant)';
COMMENT ON FUNCTION public.update_order_comment IS 'Modifie un commentaire (multi-tenant)';
COMMENT ON FUNCTION public.delete_order_comment IS 'Supprime un commentaire (multi-tenant)';
COMMENT ON FUNCTION public.process_order_reconciliation(text, jsonb, text) IS 'Traite la réconciliation d''une commande (multi-tenant)';
COMMENT ON FUNCTION public.process_order_reconciliation(uuid, jsonb, text) IS 'Traite la réconciliation d''une commande UUID (multi-tenant)';
COMMENT ON FUNCTION public.confirm_order_reconciliation IS 'Confirme la réconciliation d''une commande (multi-tenant)';
COMMENT ON FUNCTION public.receive_replacement_items IS 'Reçoit des articles de remplacement (multi-tenant)';
COMMENT ON FUNCTION public.recalculate_product IS 'Recalcule les métriques d''un produit (multi-tenant)';
COMMENT ON FUNCTION public.get_product_calculation_details IS 'Récupère les détails de calcul d''un produit (multi-tenant)';
COMMENT ON FUNCTION public.sync_moq_from_supplier IS 'Synchronise le MOQ depuis le fournisseur (multi-tenant)';
COMMENT ON FUNCTION public.remove_supplier_from_product IS 'Retire un fournisseur d''un produit (multi-tenant)';
COMMENT ON FUNCTION public.create_notification IS 'Crée une notification (multi-tenant)';
COMMENT ON FUNCTION public.mark_notification_as_read IS 'Marque une notification comme lue (multi-tenant)';
COMMENT ON FUNCTION public.mark_all_notifications_as_read IS 'Marque toutes les notifications comme lues (multi-tenant)';
COMMENT ON FUNCTION public.get_grouped_notifications IS 'Récupère les notifications groupées (multi-tenant)';

