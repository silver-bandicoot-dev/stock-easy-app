-- ============================================
-- Migration 044: Recentralisation des MOQ au niveau produit
-- ============================================
-- Objectifs :
-- - Garder produits.moq comme source unique de vérité pour les calculs
-- - Ajouter produits.moq_source pour tracer l'origine du MOQ
--   ('manuel', 'fournisseur_defaut', 'specifique')
-- - Ajouter une fonction utilitaire pour synchroniser le MOQ depuis un fournisseur
-- - Pré-remplir produits.moq à partir de fournisseurs.moq_standard quand c'est pertinent
--
-- IMPORTANT :
-- - Les fonctions de calcul existantes utilisent déjà produits.moq
-- - Aucun changement de logique de calcul n'est introduit ici
-- - fournisseurs.moq_standard reste en lecture/écriture pour l'instant,
--   mais son rôle devient "valeur par défaut / suggestion"

-- ============================================
-- 1. AJOUT DE LA COLONNE moq_source SUR produits
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne moq_source si elle n'existe pas déjà
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'produits'
      AND column_name = 'moq_source'
  ) THEN
    ALTER TABLE public.produits
      ADD COLUMN moq_source text
        CHECK (moq_source IN ('manuel', 'fournisseur_defaut', 'specifique') OR moq_source IS NULL);

    COMMENT ON COLUMN public.produits.moq_source IS
      'Origine du MOQ: ''manuel'' (saisi sur le produit), ''fournisseur_defaut'' (copié de fournisseurs.moq_standard), ''specifique'' (défini par un mapping SKU↔fournisseur).';

    RAISE NOTICE '✅ Colonne produits.moq_source ajoutée';
  ELSE
    RAISE NOTICE '⚠️ Colonne produits.moq_source existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. FONCTION UTILITAIRE sync_moq_from_supplier
-- ============================================
-- Permet de copier le MOQ depuis le fournisseur principal vers un produit.
-- Paramètres :
--   p_sku          : SKU du produit
--   p_supplier     : nom du fournisseur (nom_fournisseur)
--   p_override     : si TRUE, remplace un MOQ déjà présent sur le produit
--
-- Retourne :
--   JSON: { success, message, sku, old_moq, new_moq, moq_source }

CREATE OR REPLACE FUNCTION public.sync_moq_from_supplier(
  p_sku text,
  p_supplier text,
  p_override boolean DEFAULT false
)
RETURNS json AS $$
DECLARE
  v_product record;
  v_supplier record;
  v_old_moq integer;
  v_new_moq integer;
BEGIN
  SET search_path = public;

  IF p_sku IS NULL OR trim(p_sku) = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'SKU manquant',
      'sku', p_sku
    );
  END IF;

  IF p_supplier IS NULL OR trim(p_supplier) = '' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Fournisseur principal manquant',
      'sku', p_sku
    );
  END IF;

  -- Récupérer le produit
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Produit %s non trouvé', p_sku),
      'sku', p_sku
    );
  END IF;

  -- Vérifier la cohérence du fournisseur
  IF v_product.fournisseur IS NULL OR v_product.fournisseur <> p_supplier THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Le produit %s n''est pas associé au fournisseur %s', p_sku, p_supplier),
      'sku', p_sku,
      'current_supplier', v_product.fournisseur,
      'expected_supplier', p_supplier
    );
  END IF;

  -- Récupérer le fournisseur
  SELECT * INTO v_supplier
  FROM public.fournisseurs
  WHERE nom_fournisseur = p_supplier;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Fournisseur %s non trouvé', p_supplier),
      'sku', p_sku
    );
  END IF;

  IF v_supplier.moq_standard IS NULL OR v_supplier.moq_standard <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', format('Le fournisseur %s n''a pas de moq_standard valide', p_supplier),
      'sku', p_sku
    );
  END IF;

  v_old_moq := v_product.moq;

  -- Ne pas écraser un MOQ existant si p_override = FALSE
  IF NOT p_override AND v_product.moq IS NOT NULL AND v_product.moq > 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'MOQ déjà défini sur le produit et override désactivé',
      'sku', p_sku,
      'old_moq', v_old_moq
    );
  END IF;

  v_new_moq := v_supplier.moq_standard;

  UPDATE public.produits
  SET
    moq = v_new_moq,
    moq_source = 'fournisseur_defaut',
    updated_at = NOW()
  WHERE sku = p_sku;

  RETURN json_build_object(
    'success', true,
    'message', format('MOQ synchronisé depuis le fournisseur %s', p_supplier),
    'sku', p_sku,
    'old_moq', v_old_moq,
    'new_moq', v_new_moq,
    'moq_source', 'fournisseur_defaut'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_moq_from_supplier(text, text, boolean) IS
'Copie le MOQ du fournisseur principal (fournisseurs.moq_standard) vers produits.moq pour un SKU. Utilisé pour les actions de masse et la migration initiale.';

GRANT EXECUTE ON FUNCTION public.sync_moq_from_supplier(text, text, boolean) TO authenticated;

-- ============================================
-- 3. MIGRATION DE DONNÉES INITIALE
-- ============================================
-- Objectif : pré-remplir produits.moq à partir de fournisseurs.moq_standard
-- pour les produits qui n''ont pas encore de MOQ défini.
--
-- Règles :
-- - Uniquement si produits.moq IS NULL ou <= 0
-- - Uniquement si le produit a un fournisseur lié (produits.fournisseur)
-- - Uniquement si le fournisseur a un moq_standard > 0
-- - moq_source = 'fournisseur_defaut'

DO $$
DECLARE
  v_updated_count integer := 0;
BEGIN
  UPDATE public.produits p
  SET
    moq = f.moq_standard,
    moq_source = 'fournisseur_defaut',
    updated_at = NOW()
  FROM public.fournisseurs f
  WHERE
    p.fournisseur = f.nom_fournisseur
    AND (p.moq IS NULL OR p.moq <= 0)
    AND f.moq_standard IS NOT NULL
    AND f.moq_standard > 0;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE '✅ Migration MOQ: % produit(s) mis à jour depuis les moq_standard fournisseurs', v_updated_count;
END $$;

-- ============================================
-- 4. NOTE SUR LES CALCULS EXISTANTS
-- ============================================
-- Les fonctions calculate_product_metrics / calculate_advanced_product_metrics
-- utilisent déjà NEW.moq comme base pour :
--   - point_commande
--   - qte_a_commander
--   - stock_max
-- Aucun changement n'est effectué ici pour préserver les comportements.
--
-- Le frontend pourra :
--   - afficher moq_source pour expliquer l'origine du MOQ
--   - proposer des actions ("Utiliser MOQ fournisseur") qui appellent
--     la fonction sync_moq_from_supplier ou un RPC dédié.


