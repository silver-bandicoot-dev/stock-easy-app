-- ============================================
-- Migration 027: Initialisation automatique de multiplicateur_prevision
-- ============================================
-- Cette migration crée un trigger qui initialise automatiquement
-- la colonne multiplicateur_prevision à partir du paramètre MultiplicateurDefaut
-- lors de la création d'un nouveau produit.

-- ============================================
-- 1. VÉRIFIER/CREER LA COLONNE SI NÉCESSAIRE
-- ============================================

DO $$
BEGIN
  -- Ajouter la colonne multiplicateur_prevision si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'produits' AND column_name = 'multiplicateur_prevision'
  ) THEN
    ALTER TABLE public.produits 
    ADD COLUMN multiplicateur_prevision NUMERIC(10,2) DEFAULT NULL;
    
    RAISE NOTICE '✅ Colonne multiplicateur_prevision ajoutée';
  ELSE
    RAISE NOTICE '⚠️  Colonne multiplicateur_prevision existe déjà';
  END IF;
END $$;

-- ============================================
-- 2. FONCTION POUR INITIALISER multiplicateur_prevision
-- ============================================

CREATE OR REPLACE FUNCTION public.initialize_multiplicateur_prevision()
RETURNS TRIGGER AS $$
DECLARE
  v_multiplicateur_defaut NUMERIC;
BEGIN
  SET search_path = public;
  
  -- Si multiplicateur_prevision est déjà défini (INSERT ou UPDATE avec valeur), ne pas le modifier
  -- Cela permet à l'utilisateur de définir manuellement la valeur
  IF NEW.multiplicateur_prevision IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Si c'est un UPDATE et que l'ancienne valeur existe, ne pas la modifier
  -- (on ne modifie que si la valeur est NULL)
  IF TG_OP = 'UPDATE' AND OLD.multiplicateur_prevision IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer la valeur du paramètre MultiplicateurDefaut
  SELECT 
    CASE 
      WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
      ELSE NULL
    END
  INTO v_multiplicateur_defaut
  FROM public.parametres
  WHERE param_name = 'MultiplicateurDefaut'
  LIMIT 1;
  
  -- Si le paramètre existe, utiliser sa valeur
  -- Sinon, utiliser la valeur par défaut 1.2
  IF v_multiplicateur_defaut IS NOT NULL THEN
    NEW.multiplicateur_prevision := v_multiplicateur_defaut;
  ELSE
    -- Valeur par défaut si le paramètre n'existe pas
    NEW.multiplicateur_prevision := 1.2;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.initialize_multiplicateur_prevision() IS 
'Initialise automatiquement multiplicateur_prevision à partir du paramètre MultiplicateurDefaut lors de la création ou mise à jour d''un produit (seulement si la valeur est NULL)';

-- ============================================
-- 3. CRÉER LE TRIGGER
-- ============================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_initialize_multiplicateur_prevision ON public.produits;

-- Créer le nouveau trigger (INSERT et UPDATE)
CREATE TRIGGER trigger_initialize_multiplicateur_prevision
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_multiplicateur_prevision();

COMMENT ON TRIGGER trigger_initialize_multiplicateur_prevision ON public.produits IS 
'Initialise automatiquement multiplicateur_prevision à partir du paramètre MultiplicateurDefaut lors de la création ou mise à jour d''un produit (seulement si la valeur est NULL)';

-- ============================================
-- 3.1. FONCTION RPC POUR METTRE À JOUR LE MULTIPLICATEUR D'UN PRODUIT
-- ============================================

CREATE OR REPLACE FUNCTION public.update_product_multiplier(
  p_sku TEXT,
  p_multiplicateur_prevision NUMERIC
)
RETURNS JSON AS $$
DECLARE
  v_updated_count INTEGER;
  v_product RECORD;
BEGIN
  SET search_path = public;
  
  -- Vérifier que le produit existe
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', format('Produit %s non trouvé', p_sku)
    );
  END IF;
  
  -- Valider la valeur du multiplicateur (entre 0.1 et 10)
  IF p_multiplicateur_prevision < 0.1 OR p_multiplicateur_prevision > 10 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Le multiplicateur doit être entre 0.1 et 10'
    );
  END IF;
  
  -- Mettre à jour le multiplicateur
  UPDATE public.produits
  SET 
    multiplicateur_prevision = p_multiplicateur_prevision,
    updated_at = NOW()
  WHERE sku = p_sku;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Récupérer le produit mis à jour
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Multiplicateur mis à jour avec succès',
    'product', json_build_object(
      'sku', v_product.sku,
      'nom_produit', v_product.nom_produit,
      'multiplicateur_prevision', v_product.multiplicateur_prevision
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.update_product_multiplier(TEXT, NUMERIC) TO authenticated;

COMMENT ON FUNCTION public.update_product_multiplier(TEXT, NUMERIC) IS 
'Met à jour le multiplicateur_prevision d''un produit spécifique. Permet de personnaliser le multiplicateur par produit.';

-- ============================================
-- 3.2. FONCTION RPC POUR RÉINITIALISER LE MULTIPLICATEUR AU PARAMÈTRE PAR DÉFAUT
-- ============================================

CREATE OR REPLACE FUNCTION public.reset_product_multiplier_to_default(p_sku TEXT)
RETURNS JSON AS $$
DECLARE
  v_multiplicateur_defaut NUMERIC;
  v_updated_count INTEGER;
  v_product RECORD;
BEGIN
  SET search_path = public;
  
  -- Vérifier que le produit existe
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', format('Produit %s non trouvé', p_sku)
    );
  END IF;
  
  -- Récupérer la valeur du paramètre MultiplicateurDefaut
  SELECT 
    CASE 
      WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
      ELSE NULL
    END
  INTO v_multiplicateur_defaut
  FROM public.parametres
  WHERE param_name = 'MultiplicateurDefaut'
  LIMIT 1;
  
  -- Si le paramètre n'existe pas, utiliser 1.2 par défaut
  IF v_multiplicateur_defaut IS NULL THEN
    v_multiplicateur_defaut := 1.2;
  END IF;
  
  -- Mettre à jour le multiplicateur
  UPDATE public.produits
  SET 
    multiplicateur_prevision = v_multiplicateur_defaut,
    updated_at = NOW()
  WHERE sku = p_sku;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Récupérer le produit mis à jour
  SELECT * INTO v_product
  FROM public.produits
  WHERE sku = p_sku;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', format('Multiplicateur réinitialisé à %s (valeur par défaut)', v_multiplicateur_defaut),
    'product', json_build_object(
      'sku', v_product.sku,
      'nom_produit', v_product.nom_produit,
      'multiplicateur_prevision', v_product.multiplicateur_prevision
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reset_product_multiplier_to_default(TEXT) TO authenticated;

COMMENT ON FUNCTION public.reset_product_multiplier_to_default(TEXT) IS 
'Réinitialise le multiplicateur_prevision d''un produit à la valeur du paramètre MultiplicateurDefaut.';

-- ============================================
-- 4. INITIALISER LES PRODUITS EXISTANTS SANS VALEUR
-- ============================================

DO $$
DECLARE
  v_multiplicateur_defaut NUMERIC;
  v_updated_count INTEGER;
BEGIN
  -- Récupérer la valeur du paramètre MultiplicateurDefaut
  SELECT 
    CASE 
      WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
      ELSE NULL
    END
  INTO v_multiplicateur_defaut
  FROM public.parametres
  WHERE param_name = 'MultiplicateurDefaut'
  LIMIT 1;
  
  -- Si le paramètre n'existe pas, utiliser 1.2 par défaut
  IF v_multiplicateur_defaut IS NULL THEN
    v_multiplicateur_defaut := 1.2;
  END IF;
  
  -- Mettre à jour les produits existants qui n'ont pas de valeur
  UPDATE public.produits
  SET multiplicateur_prevision = v_multiplicateur_defaut
  WHERE multiplicateur_prevision IS NULL;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) existant(s) mis à jour avec multiplicateur_prevision = %', 
    v_updated_count, v_multiplicateur_defaut;
END $$;

-- ============================================
-- 5. TEST ET VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_test_result RECORD;
  v_multiplicateur_defaut NUMERIC;
BEGIN
  -- Récupérer la valeur du paramètre
  SELECT 
    CASE 
      WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
      ELSE 1.2
    END
  INTO v_multiplicateur_defaut
  FROM public.parametres
  WHERE param_name = 'MultiplicateurDefaut'
  LIMIT 1;
  
  IF v_multiplicateur_defaut IS NULL THEN
    v_multiplicateur_defaut := 1.2;
  END IF;
  
  -- Afficher un exemple de produit
  SELECT 
    sku,
    nom_produit,
    multiplicateur_prevision
  INTO v_test_result
  FROM public.produits
  WHERE multiplicateur_prevision IS NOT NULL
  LIMIT 1;
  
  IF v_test_result IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '📊 EXEMPLE DE PRODUIT:';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE 'SKU: %', v_test_result.sku;
    RAISE NOTICE 'Produit: %', v_test_result.nom_produit;
    RAISE NOTICE 'Multiplicateur prévision: %', v_test_result.multiplicateur_prevision;
    RAISE NOTICE 'Paramètre MultiplicateurDefaut: %', v_multiplicateur_defaut;
    RAISE NOTICE '═══════════════════════════════════════════════';
  END IF;
  
  -- Statistiques
  RAISE NOTICE '';
  RAISE NOTICE '📈 STATISTIQUES:';
  RAISE NOTICE '   - Produits avec multiplicateur_prevision défini: %', 
    (SELECT COUNT(*) FROM public.produits WHERE multiplicateur_prevision IS NOT NULL);
  RAISE NOTICE '   - Produits sans multiplicateur_prevision: %', 
    (SELECT COUNT(*) FROM public.produits WHERE multiplicateur_prevision IS NULL);
END $$;

-- ============================================
-- FIN DE LA MIGRATION 027
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 027 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Colonne multiplicateur_prevision vérifiée/créée';
  RAISE NOTICE '   ✅ Fonction initialize_multiplicateur_prevision() créée';
  RAISE NOTICE '   ✅ Trigger trigger_initialize_multiplicateur_prevision créé (INSERT + UPDATE)';
  RAISE NOTICE '   ✅ Fonction update_product_multiplier() créée (mise à jour manuelle)';
  RAISE NOTICE '   ✅ Fonction reset_product_multiplier_to_default() créée (réinitialisation)';
  RAISE NOTICE '   ✅ Produits existants initialisés';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Fonctionnalités:';
  RAISE NOTICE '   - Les nouveaux produits auront automatiquement multiplicateur_prevision';
  RAISE NOTICE '     initialisé à partir du paramètre MultiplicateurDefaut';
  RAISE NOTICE '   - Vous pouvez modifier manuellement le multiplicateur d''un produit';
  RAISE NOTICE '   - Vous pouvez réinitialiser un produit au paramètre par défaut';
END $$;

