-- ============================================
-- Migration 094: Propager lead_time_days du fournisseur vers les produits
-- ============================================
-- PROBLÈME: Quand un produit est assigné à un fournisseur, le lead_time_days
--           n'est PAS copié vers le produit. Résultat : tous les produits ont NULL.
--
-- SOLUTION:
-- 1. Corriger la fonction assign_supplier_to_product pour propager lead_time_days ET moq
-- 2. Synchroniser tous les produits existants qui ont un fournisseur
-- ============================================

-- ============================================
-- 1. CORRIGER LA FONCTION assign_supplier_to_product
-- ============================================

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
  v_supplier_lead_time INTEGER;
  v_supplier_moq INTEGER;
  v_current_moq INTEGER;
  v_current_lead_time INTEGER;
  v_should_update_moq BOOLEAN := FALSE;
  v_should_update_lead_time BOOLEAN := FALSE;
BEGIN
  v_company_id := get_current_user_company_id();
  
  -- Vérifier que le fournisseur existe pour cette entreprise et récupérer ses valeurs
  SELECT 
    TRUE,
    f.lead_time_days,
    f.moq_standard
  INTO 
    v_supplier_exists,
    v_supplier_lead_time,
    v_supplier_moq
  FROM fournisseurs f
  WHERE f.nom_fournisseur = p_supplier_name 
    AND f.company_id = v_company_id;
  
  IF NOT v_supplier_exists OR v_supplier_exists IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Fournisseur non trouvé');
  END IF;
  
  -- Récupérer les valeurs actuelles du produit
  SELECT moq, lead_time_days 
  INTO v_current_moq, v_current_lead_time
  FROM produits
  WHERE sku = p_sku
    AND company_id = v_company_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Produit non trouvé ou accès non autorisé');
  END IF;
  
  -- Déterminer si on doit mettre à jour le MOQ
  -- On met à jour si : MOQ produit est NULL ou <= 0, et le fournisseur a un MOQ valide
  IF (v_current_moq IS NULL OR v_current_moq <= 0) 
     AND v_supplier_moq IS NOT NULL 
     AND v_supplier_moq > 0 THEN
    v_should_update_moq := TRUE;
  END IF;
  
  -- ✅ CORRECTION CRITIQUE: Toujours propager le lead_time_days du fournisseur
  -- On met à jour si : lead_time du produit est NULL ou <= 0, et le fournisseur a un lead_time valide
  IF (v_current_lead_time IS NULL OR v_current_lead_time <= 0) 
     AND v_supplier_lead_time IS NOT NULL 
     AND v_supplier_lead_time > 0 THEN
    v_should_update_lead_time := TRUE;
  END IF;
  
  -- Mise à jour du produit avec fournisseur, MOQ et lead_time_days
  UPDATE produits
  SET 
    fournisseur = p_supplier_name,
    moq = CASE 
      WHEN v_should_update_moq THEN v_supplier_moq 
      ELSE moq 
    END,
    moq_source = CASE 
      WHEN v_should_update_moq THEN 'fournisseur_defaut' 
      ELSE moq_source 
    END,
    lead_time_days = CASE 
      WHEN v_should_update_lead_time THEN v_supplier_lead_time 
      ELSE lead_time_days 
    END,
    updated_at = NOW()
  WHERE sku = p_sku
    AND company_id = v_company_id;  -- ✅ FILTRAGE MULTI-TENANT
  
  RETURN json_build_object(
    'success', TRUE, 
    'message', 'Fournisseur assigné',
    'moq_updated', v_should_update_moq,
    'lead_time_updated', v_should_update_lead_time,
    'new_moq', CASE WHEN v_should_update_moq THEN v_supplier_moq ELSE v_current_moq END,
    'new_lead_time', CASE WHEN v_should_update_lead_time THEN v_supplier_lead_time ELSE v_current_lead_time END
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$function$;

COMMENT ON FUNCTION public.assign_supplier_to_product IS 
'Assigne un fournisseur à un produit et propage automatiquement le lead_time_days et MOQ du fournisseur si le produit n''a pas de valeurs définies.';

-- ============================================
-- 2. SYNCHRONISER TOUS LES PRODUITS EXISTANTS
-- ============================================
-- Pour chaque produit qui a un fournisseur mais pas de lead_time_days,
-- copier le lead_time_days du fournisseur

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Synchronisation du lead_time_days des produits existants...';
  
  -- Mettre à jour les produits qui ont un fournisseur mais pas de lead_time_days
  UPDATE produits p
  SET 
    lead_time_days = f.lead_time_days,
    updated_at = NOW()
  FROM fournisseurs f
  WHERE p.fournisseur = f.nom_fournisseur
    AND p.company_id = f.company_id
    AND (p.lead_time_days IS NULL OR p.lead_time_days <= 0)
    AND f.lead_time_days IS NOT NULL 
    AND f.lead_time_days > 0;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec le lead_time_days de leur fournisseur', v_updated_count;
END $$;

-- ============================================
-- 3. SYNCHRONISER AUSSI LE MOQ (si manquant)
-- ============================================

DO $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Synchronisation du MOQ des produits existants...';
  
  -- Mettre à jour les produits qui ont un fournisseur mais pas de MOQ
  UPDATE produits p
  SET 
    moq = f.moq_standard,
    moq_source = 'fournisseur_defaut',
    updated_at = NOW()
  FROM fournisseurs f
  WHERE p.fournisseur = f.nom_fournisseur
    AND p.company_id = f.company_id
    AND (p.moq IS NULL OR p.moq <= 0)
    AND f.moq_standard IS NOT NULL 
    AND f.moq_standard > 0;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec le MOQ de leur fournisseur', v_updated_count;
END $$;

-- ============================================
-- 4. CRÉER UN TRIGGER POUR PROPAGER LES CHANGEMENTS AUTOMATIQUEMENT
-- ============================================
-- Quand un fournisseur change son lead_time_days, mettre à jour tous ses produits

CREATE OR REPLACE FUNCTION public.propagate_supplier_changes_to_products()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Si le lead_time_days du fournisseur change
  IF OLD.lead_time_days IS DISTINCT FROM NEW.lead_time_days THEN
    -- Mettre à jour tous les produits qui utilisent ce fournisseur
    -- et qui n'ont pas de valeur personnalisée (lead_time_days NULL ou égal à l'ancienne valeur)
    UPDATE produits
    SET 
      lead_time_days = NEW.lead_time_days,
      updated_at = NOW()
    WHERE fournisseur = NEW.nom_fournisseur
      AND company_id = NEW.company_id
      AND (lead_time_days IS NULL OR lead_time_days = OLD.lead_time_days);
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
      RAISE NOTICE '📦 Propagé lead_time_days (% → %) à % produit(s) du fournisseur %',
        OLD.lead_time_days, NEW.lead_time_days, v_updated_count, NEW.nom_fournisseur;
    END IF;
  END IF;
  
  -- Si le MOQ standard du fournisseur change
  IF OLD.moq_standard IS DISTINCT FROM NEW.moq_standard THEN
    -- Mettre à jour les produits qui utilisent le MOQ par défaut du fournisseur
    UPDATE produits
    SET 
      moq = NEW.moq_standard,
      updated_at = NOW()
    WHERE fournisseur = NEW.nom_fournisseur
      AND company_id = NEW.company_id
      AND moq_source = 'fournisseur_defaut';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
      RAISE NOTICE '📦 Propagé MOQ (% → %) à % produit(s) du fournisseur %',
        OLD.moq_standard, NEW.moq_standard, v_updated_count, NEW.nom_fournisseur;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_propagate_supplier_changes ON fournisseurs;

-- Créer le trigger
CREATE TRIGGER trigger_propagate_supplier_changes
  AFTER UPDATE ON fournisseurs
  FOR EACH ROW
  EXECUTE FUNCTION propagate_supplier_changes_to_products();

COMMENT ON FUNCTION public.propagate_supplier_changes_to_products IS
'Propage automatiquement les changements de lead_time_days et MOQ d''un fournisseur vers tous ses produits.';

-- ============================================
-- 5. VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_products_without_lead_time INTEGER;
  v_products_with_supplier INTEGER;
BEGIN
  -- Compter les produits avec fournisseur mais sans lead_time
  SELECT COUNT(*) INTO v_products_without_lead_time
  FROM produits
  WHERE fournisseur IS NOT NULL 
    AND fournisseur != ''
    AND (lead_time_days IS NULL OR lead_time_days <= 0);
  
  SELECT COUNT(*) INTO v_products_with_supplier
  FROM produits
  WHERE fournisseur IS NOT NULL AND fournisseur != '';
  
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Migration 094 appliquée avec succès';
  RAISE NOTICE '============================================';
  RAISE NOTICE '📊 Statistiques:';
  RAISE NOTICE '   - Produits avec fournisseur: %', v_products_with_supplier;
  RAISE NOTICE '   - Produits encore sans lead_time_days: %', v_products_without_lead_time;
  
  IF v_products_without_lead_time > 0 THEN
    RAISE NOTICE '⚠️ % produits ont un fournisseur mais pas de lead_time_days car leur fournisseur n''a probablement pas de délai défini', v_products_without_lead_time;
  ELSE
    RAISE NOTICE '🎉 Tous les produits avec fournisseur ont maintenant un lead_time_days!';
  END IF;
  RAISE NOTICE '============================================';
END $$;

