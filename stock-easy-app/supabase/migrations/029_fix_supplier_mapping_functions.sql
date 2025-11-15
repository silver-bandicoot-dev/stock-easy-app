-- ============================================
-- Migration 029: Correction des fonctions de mapping produits-fournisseurs
-- ============================================
-- Cette migration corrige les fonctions RPC assign_supplier_to_product
-- et remove_supplier_from_product qui étaient des stubs ne faisant rien.
-- Le problème était que remove_supplier_from_product ne mettait pas à jour
-- la base de données, donc les produits revenaient automatiquement après sauvegarde.

-- ============================================
-- FONCTION RPC POUR ASSIGNER UN FOURNISSEUR À UN PRODUIT
-- ============================================

-- Supprimer les anciennes versions de la fonction avec différentes signatures
DROP FUNCTION IF EXISTS public.assign_supplier_to_product(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.assign_supplier_to_product(TEXT, TEXT, NUMERIC, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION public.assign_supplier_to_product(
  p_sku TEXT,
  p_supplier_name TEXT
)
RETURNS JSON AS $$
DECLARE
  v_supplier_exists BOOLEAN;
BEGIN
  SET search_path = public;
  
  -- Note: On ne vérifie plus company_id car les tables produits et sku_fournisseurs
  -- n'ont pas de colonne company_id dans cette version de la base de données
  
  -- Vérifier que le fournisseur existe
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
  
  -- Vérifier que le produit existe
  IF NOT EXISTS(
    SELECT 1 FROM public.produits
    WHERE sku = p_sku
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Produit non trouvé'
    );
  END IF;
  
  -- Retirer d'abord le produit de tous les autres fournisseurs (un SKU ne peut avoir qu'un seul fournisseur)
  DELETE FROM public.sku_fournisseurs
  WHERE sku = p_sku;
  
  -- Mettre à jour aussi la colonne fournisseur dans la table produits
  UPDATE public.produits
  SET fournisseur = p_supplier_name,
      updated_at = NOW()
  WHERE sku = p_sku;
  
  -- Insérer ou mettre à jour le mapping dans sku_fournisseurs
  INSERT INTO public.sku_fournisseurs (sku, fournisseur)
  VALUES (p_sku, p_supplier_name)
  ON CONFLICT (sku, fournisseur) DO UPDATE
  SET created_at = NOW();
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FONCTION RPC POUR RETIRER UN FOURNISSEUR D'UN PRODUIT
-- ============================================

-- Supprimer les anciennes versions de la fonction avec différentes signatures
DROP FUNCTION IF EXISTS public.remove_supplier_from_product(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.remove_supplier_from_product(
  p_sku TEXT,
  p_supplier_name TEXT
)
RETURNS JSON AS $$
DECLARE
  v_found_in_produits BOOLEAN := FALSE;
  v_found_in_sku_fournisseurs BOOLEAN := FALSE;
BEGIN
  SET search_path = public;
  
  -- Note: On ne vérifie plus company_id car les tables produits et sku_fournisseurs
  -- n'ont pas de colonne company_id dans cette version de la base de données
  
  -- Vérifier que le produit existe
  IF NOT EXISTS(
    SELECT 1 FROM public.produits
    WHERE sku = p_sku
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Produit non trouvé'
    );
  END IF;
  
  -- Vérifier si le produit a ce fournisseur dans produits.fournisseur OU dans sku_fournisseurs
  -- On accepte de retirer si le fournisseur est présent dans l'un ou l'autre
  -- Vérifier dans produits
  SELECT EXISTS(
    SELECT 1 FROM public.produits 
    WHERE sku = p_sku AND fournisseur = p_supplier_name
  ) INTO v_found_in_produits;
  
  -- Vérifier dans sku_fournisseurs
  SELECT EXISTS(
    SELECT 1 FROM public.sku_fournisseurs 
    WHERE sku = p_sku AND fournisseur = p_supplier_name
  ) INTO v_found_in_sku_fournisseurs;
  
  -- Si le fournisseur n'est présent ni dans produits ni dans sku_fournisseurs
  IF NOT v_found_in_produits AND NOT v_found_in_sku_fournisseurs THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Le produit n''est pas assigné à ce fournisseur'
    );
  END IF;
  
  -- Retirer le fournisseur de sku_fournisseurs (si présent)
  IF v_found_in_sku_fournisseurs THEN
    DELETE FROM public.sku_fournisseurs
    WHERE sku = p_sku AND fournisseur = p_supplier_name;
  END IF;
  
  -- Retirer le fournisseur de produits (si présent)
  IF v_found_in_produits THEN
    UPDATE public.produits
    SET fournisseur = NULL,
        updated_at = NOW()
    WHERE sku = p_sku AND fournisseur = p_supplier_name;
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.assign_supplier_to_product IS 
  'Assigne un fournisseur à un produit en créant/mettant à jour une entrée dans la table sku_fournisseurs';

COMMENT ON FUNCTION public.remove_supplier_from_product IS 
  'Retire un fournisseur d''un produit en supprimant l''entrée correspondante dans la table sku_fournisseurs';

