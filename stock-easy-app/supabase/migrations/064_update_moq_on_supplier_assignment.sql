-- ============================================
-- Migration 064: Mise à jour du MOQ lors de l'assignation d'un fournisseur
-- ============================================
-- Objectif : Quand un produit est assigné à un fournisseur, si le produit n'a pas
-- de MOQ défini (0 ou NULL), le MOQ du produit est automatiquement mis à jour
-- avec le MOQ standard du fournisseur.
--
-- Comportement :
-- - Si le produit a déjà un MOQ > 0, il n'est pas modifié
-- - Si le produit a un MOQ de 0 ou NULL, il prend le MOQ standard du fournisseur
-- - Le moq_source est défini à 'fournisseur_defaut' lors de la mise à jour

-- ============================================
-- MODIFICATION DE LA FONCTION assign_supplier_to_product
-- ============================================

CREATE OR REPLACE FUNCTION public.assign_supplier_to_product(
  p_sku TEXT,
  p_supplier_name TEXT
)
RETURNS JSON AS $$
DECLARE
  v_supplier_exists BOOLEAN;
  v_supplier_moq INTEGER;
  v_current_moq INTEGER;
  v_should_update_moq BOOLEAN := FALSE;
BEGIN
  SET search_path = public;
  
  -- Vérifier que le fournisseur existe et récupérer son MOQ standard
  SELECT EXISTS(
    SELECT 1 FROM public.fournisseurs
    WHERE nom_fournisseur = p_supplier_name
  ) INTO v_supplier_exists;
  
  IF NOT v_supplier_exists THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Fournisseur non trouvé'
    );
  END IF;
  
  -- Récupérer le MOQ standard du fournisseur
  SELECT moq_standard INTO v_supplier_moq
  FROM public.fournisseurs
  WHERE nom_fournisseur = p_supplier_name;
  
  -- Vérifier que le produit existe et récupérer son MOQ actuel
  SELECT moq INTO v_current_moq
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Produit non trouvé'
    );
  END IF;
  
  -- Déterminer si on doit mettre à jour le MOQ
  -- On met à jour si : MOQ est NULL ou <= 0, et le fournisseur a un MOQ valide
  IF (v_current_moq IS NULL OR v_current_moq <= 0) 
     AND v_supplier_moq IS NOT NULL 
     AND v_supplier_moq > 0 THEN
    v_should_update_moq := TRUE;
  END IF;
  
  -- Retirer d'abord le produit de tous les autres fournisseurs (un SKU ne peut avoir qu'un seul fournisseur)
  DELETE FROM public.sku_fournisseurs
  WHERE sku = p_sku;
  
  -- Mettre à jour la colonne fournisseur dans la table produits
  -- Et mettre à jour le MOQ si nécessaire
  IF v_should_update_moq THEN
    UPDATE public.produits
    SET fournisseur = p_supplier_name,
        moq = v_supplier_moq,
        moq_source = 'fournisseur_defaut',
        updated_at = NOW()
    WHERE sku = p_sku;
  ELSE
    UPDATE public.produits
    SET fournisseur = p_supplier_name,
        updated_at = NOW()
    WHERE sku = p_sku;
  END IF;
  
  -- Insérer ou mettre à jour le mapping dans sku_fournisseurs
  INSERT INTO public.sku_fournisseurs (sku, fournisseur)
  VALUES (p_sku, p_supplier_name)
  ON CONFLICT (sku, fournisseur) DO UPDATE
  SET created_at = NOW();
  
  RETURN json_build_object(
    'success', TRUE,
    'moq_updated', v_should_update_moq,
    'new_moq', CASE WHEN v_should_update_moq THEN v_supplier_moq ELSE v_current_moq END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MISE À JOUR DU COMMENTAIRE
-- ============================================

COMMENT ON FUNCTION public.assign_supplier_to_product IS 
  'Assigne un fournisseur à un produit et met à jour automatiquement le MOQ du produit avec le MOQ standard du fournisseur si le produit n''a pas de MOQ défini (0 ou NULL)';

