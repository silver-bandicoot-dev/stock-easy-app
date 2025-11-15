-- ============================================
-- Migration 028: Mise à jour en masse des multiplicateurs
-- ============================================
-- Cette migration ajoute une fonction RPC pour mettre à jour
-- plusieurs multiplicateurs en une seule requête (plus efficace)

-- ============================================
-- FONCTION RPC POUR METTRE À JOUR PLUSIEURS MULTIPLICATEURS
-- ============================================

CREATE OR REPLACE FUNCTION public.bulk_update_product_multipliers(
  p_updates JSONB
)
RETURNS JSON AS $$
DECLARE
  v_update_item JSONB;
  v_sku TEXT;
  v_multiplier NUMERIC;
  v_updated_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
  v_results JSONB := '[]'::JSONB;
BEGIN
  SET search_path = public;
  
  -- Valider que p_updates est un tableau
  IF jsonb_typeof(p_updates) != 'array' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Le paramètre doit être un tableau JSON'
    );
  END IF;
  
  -- Parcourir chaque élément du tableau
  FOR v_update_item IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      -- Extraire SKU et multiplicateur
      v_sku := v_update_item->>'sku';
      v_multiplier := (v_update_item->>'multiplier')::NUMERIC;
      
      -- Valider les paramètres
      IF v_sku IS NULL OR v_sku = '' THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, 'SKU manquant dans un élément');
        CONTINUE;
      END IF;
      
      IF v_multiplier IS NULL THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, format('Multiplicateur manquant pour %s', v_sku));
        CONTINUE;
      END IF;
      
      -- Valider la valeur du multiplicateur (entre 0.1 et 10)
      IF v_multiplier < 0.1 OR v_multiplier > 10 THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, format('Multiplicateur invalide pour %s (doit être entre 0.1 et 10)', v_sku));
        CONTINUE;
      END IF;
      
      -- Vérifier que le produit existe
      IF NOT EXISTS (SELECT 1 FROM public.produits WHERE sku = v_sku) THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, format('Produit %s non trouvé', v_sku));
        CONTINUE;
      END IF;
      
      -- Mettre à jour le multiplicateur
      UPDATE public.produits
      SET 
        multiplicateur_prevision = v_multiplier,
        updated_at = NOW()
      WHERE sku = v_sku;
      
      -- Compter les mises à jour réussies
      IF FOUND THEN
        v_updated_count := v_updated_count + 1;
        v_results := v_results || jsonb_build_object(
          'sku', v_sku,
          'success', TRUE,
          'multiplier', v_multiplier
        );
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_error_count := v_error_count + 1;
        v_errors := array_append(v_errors, format('Erreur pour %s: %s', v_sku, SQLERRM));
    END;
  END LOOP;
  
  -- Retourner le résultat
  RETURN json_build_object(
    'success', v_error_count = 0,
    'updated_count', v_updated_count,
    'error_count', v_error_count,
    'errors', v_errors,
    'results', v_results,
    'message', format('%s produit(s) mis à jour, %s erreur(s)', v_updated_count, v_error_count)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.bulk_update_product_multipliers(JSONB) TO authenticated;

COMMENT ON FUNCTION public.bulk_update_product_multipliers(JSONB) IS 
'Met à jour les multiplicateurs_prevision de plusieurs produits en une seule requête. Accepte un tableau JSON de format: [{"sku": "SKU-001", "multiplier": 1.5}, ...]';

-- ============================================
-- FONCTION RPC POUR RÉINITIALISER PLUSIEURS MULTIPLICATEURS
-- ============================================

CREATE OR REPLACE FUNCTION public.bulk_reset_product_multipliers(
  p_skus TEXT[]
)
RETURNS JSON AS $$
DECLARE
  v_multiplicateur_defaut NUMERIC;
  v_updated_count INTEGER;
  v_sku TEXT;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  SET search_path = public;
  
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
  
  -- Mettre à jour tous les produits
  UPDATE public.produits
  SET 
    multiplicateur_prevision = v_multiplicateur_defaut,
    updated_at = NOW()
  WHERE sku = ANY(p_skus);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Vérifier les SKU qui n'existent pas
  FOR v_sku IN SELECT unnest(p_skus)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.produits WHERE sku = v_sku) THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, format('Produit %s non trouvé', v_sku));
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'success', v_error_count = 0,
    'updated_count', v_updated_count,
    'error_count', v_error_count,
    'errors', v_errors,
    'default_multiplier', v_multiplicateur_defaut,
    'message', format('%s produit(s) réinitialisé(s) à %s', v_updated_count, v_multiplicateur_defaut)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.bulk_reset_product_multipliers(TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.bulk_reset_product_multipliers(TEXT[]) IS 
'Réinitialise les multiplicateurs_prevision de plusieurs produits au paramètre par défaut. Accepte un tableau de SKU.';

-- ============================================
-- FIN DE LA MIGRATION 028
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 028 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Fonction bulk_update_product_multipliers() créée';
  RAISE NOTICE '   ✅ Fonction bulk_reset_product_multipliers() créée';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Fonctionnalités:';
  RAISE NOTICE '   - Mise à jour en masse de plusieurs multiplicateurs en une requête';
  RAISE NOTICE '   - Réinitialisation en masse au paramètre par défaut';
END $$;

