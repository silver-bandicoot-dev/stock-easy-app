-- ============================================
-- Migration 030: Calcul automatique de ventes_jour_ajustees
-- ============================================
-- Cette migration crée un trigger qui calcule automatiquement
-- ventes_jour_ajustees = ventes_jour_moy_30j × multiplicateur_prevision
-- 
-- Option 2: Recalcul uniquement si:
--   - ventes_jour_ajustees est NULL
--   - OU si ventes_jour_moy_30j ou multiplicateur_prevision changent (UPDATE)
--   - Respecte les valeurs manuelles si elles existent et que les valeurs de base n'ont pas changé

-- ============================================
-- 1. FONCTION POUR CALCULER ventes_jour_ajustees
-- ============================================

CREATE OR REPLACE FUNCTION public.calculate_ventes_jour_ajustees()
RETURNS TRIGGER AS $$
DECLARE
  v_multiplicateur_defaut NUMERIC;
  v_should_recalculate BOOLEAN := FALSE;
BEGIN
  SET search_path = public;
  
  -- ============================================
  -- DÉCISION: Faut-il recalculer ?
  -- ============================================
  
  IF TG_OP = 'INSERT' THEN
    -- Pour un INSERT, recalculer si ventes_jour_ajustees est NULL
    v_should_recalculate := (NEW.ventes_jour_ajustees IS NULL);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Pour un UPDATE, recalculer si:
    -- 1. ventes_jour_ajustees est NULL
    -- 2. OU si ventes_jour_moy_30j a changé
    -- 3. OU si multiplicateur_prevision a changé
    v_should_recalculate := (
      NEW.ventes_jour_ajustees IS NULL
      OR (COALESCE(NEW.ventes_jour_moy_30j, 0) != COALESCE(OLD.ventes_jour_moy_30j, 0))
      OR (COALESCE(NEW.multiplicateur_prevision, 0) != COALESCE(OLD.multiplicateur_prevision, 0))
    );
  END IF;
  
  -- Si on ne doit pas recalculer, retourner NEW tel quel
  IF NOT v_should_recalculate THEN
    RETURN NEW;
  END IF;
  
  -- ============================================
  -- RÉCUPÉRATION DU MULTIPLICATEUR
  -- ============================================
  
  -- Si multiplicateur_prevision est NULL, utiliser le paramètre par défaut
  IF NEW.multiplicateur_prevision IS NULL THEN
    SELECT 
      CASE 
        WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
        ELSE 1.2
      END
    INTO v_multiplicateur_defaut
    FROM public.parametres
    WHERE param_name = 'MultiplicateurDefaut'
    LIMIT 1;
    
    -- Si le paramètre n'existe pas, utiliser 1.2 par défaut
    IF v_multiplicateur_defaut IS NULL THEN
      v_multiplicateur_defaut := 1.2;
    END IF;
  ELSE
    v_multiplicateur_defaut := NEW.multiplicateur_prevision;
  END IF;
  
  -- ============================================
  -- CALCUL DE ventes_jour_ajustees
  -- ============================================
  
  -- Formule: ventes_jour_ajustees = ventes_jour_moy_30j × multiplicateur_prevision
  IF NEW.ventes_jour_moy_30j IS NOT NULL AND NEW.ventes_jour_moy_30j > 0 THEN
    NEW.ventes_jour_ajustees := NEW.ventes_jour_moy_30j * v_multiplicateur_defaut;
  ELSE
    -- Si ventes_jour_moy_30j est NULL ou 0, alors ventes_jour_ajustees = 0
    NEW.ventes_jour_ajustees := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.calculate_ventes_jour_ajustees() IS 
'Calcule automatiquement ventes_jour_ajustees = ventes_jour_moy_30j × multiplicateur_prevision.
Recalcul uniquement si ventes_jour_ajustees est NULL ou si ventes_jour_moy_30j/multiplicateur_prevision changent.
Respecte les valeurs manuelles si elles existent et que les valeurs de base n''ont pas changé.';

-- ============================================
-- 2. CRÉER LE TRIGGER
-- ============================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_calculate_ventes_jour_ajustees ON public.produits;

-- Créer le nouveau trigger (INSERT et UPDATE)
-- IMPORTANT: Ce trigger doit s'exécuter AVANT les autres triggers qui utilisent ventes_jour_ajustees
-- pour s'assurer que la valeur est toujours à jour
CREATE TRIGGER trigger_calculate_ventes_jour_ajustees
  BEFORE INSERT OR UPDATE ON public.produits
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_ventes_jour_ajustees();

COMMENT ON TRIGGER trigger_calculate_ventes_jour_ajustees ON public.produits IS 
'Calcule automatiquement ventes_jour_ajustees avant INSERT/UPDATE.
S''exécute avant les autres triggers pour garantir que ventes_jour_ajustees est toujours à jour.';

-- ============================================
-- 3. METTRE À JOUR LES PRODUITS EXISTANTS
-- ============================================

DO $$
DECLARE
  v_updated_count INTEGER;
  v_multiplicateur_defaut NUMERIC;
BEGIN
  -- Récupérer la valeur du paramètre MultiplicateurDefaut
  SELECT 
    CASE 
      WHEN value ~ '^[0-9]+\.?[0-9]*$' THEN value::NUMERIC
      ELSE 1.2
    END
  INTO v_multiplicateur_defaut
  FROM public.parametres
  WHERE param_name = 'MultiplicateurDefaut'
  LIMIT 1;
  
  -- Si le paramètre n'existe pas, utiliser 1.2 par défaut
  IF v_multiplicateur_defaut IS NULL THEN
    v_multiplicateur_defaut := 1.2;
  END IF;
  
  -- Mettre à jour les produits existants où ventes_jour_ajustees est NULL
  -- ou ne correspond pas au calcul attendu
  UPDATE public.produits
  SET ventes_jour_ajustees = CASE
    WHEN ventes_jour_moy_30j IS NOT NULL AND ventes_jour_moy_30j > 0 THEN
      ventes_jour_moy_30j * COALESCE(multiplicateur_prevision, v_multiplicateur_defaut)
    ELSE 0
  END
  WHERE ventes_jour_ajustees IS NULL
     OR ABS(ventes_jour_ajustees - (ventes_jour_moy_30j * COALESCE(multiplicateur_prevision, v_multiplicateur_defaut))) > 0.01;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) existant(s) mis à jour avec ventes_jour_ajustees recalculé', v_updated_count;
END $$;

-- ============================================
-- 4. TEST ET VÉRIFICATION
-- ============================================

DO $$
DECLARE
  v_test_result RECORD;
  v_multiplicateur_defaut NUMERIC;
  v_calcul_attendu NUMERIC;
  v_test_count INTEGER := 0;
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
  
  -- Afficher quelques exemples de produits
  RAISE NOTICE '';
  RAISE NOTICE '📊 EXEMPLES DE PRODUITS (après calcul):';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
  
  FOR v_test_result IN 
    SELECT 
      sku,
      nom_produit,
      ventes_jour_moy_30j,
      multiplicateur_prevision,
      ventes_jour_ajustees,
      CASE 
        WHEN ventes_jour_moy_30j IS NOT NULL AND ventes_jour_moy_30j > 0 THEN
          ROUND(ventes_jour_moy_30j * COALESCE(multiplicateur_prevision, v_multiplicateur_defaut), 4)
        ELSE 0
      END as calcul_attendu
    FROM public.produits
    WHERE ventes_jour_moy_30j IS NOT NULL
    LIMIT 5
  LOOP
    v_test_count := v_test_count + 1;
    RAISE NOTICE '';
    RAISE NOTICE 'Produit #%:', v_test_count;
    RAISE NOTICE '  SKU: %', v_test_result.sku;
    RAISE NOTICE '  Nom: %', v_test_result.nom_produit;
    RAISE NOTICE '  ventes_jour_moy_30j: %', v_test_result.ventes_jour_moy_30j;
    RAISE NOTICE '  multiplicateur_prevision: %', COALESCE(v_test_result.multiplicateur_prevision, v_multiplicateur_defaut);
    RAISE NOTICE '  Calcul attendu: % × % = %', 
      v_test_result.ventes_jour_moy_30j, 
      COALESCE(v_test_result.multiplicateur_prevision, v_multiplicateur_defaut),
      v_test_result.calcul_attendu;
    RAISE NOTICE '  ventes_jour_ajustees (actuel): %', v_test_result.ventes_jour_ajustees;
    
    -- Vérifier si le calcul est correct
    IF ABS(v_test_result.ventes_jour_ajustees - v_test_result.calcul_attendu) < 0.01 THEN
      RAISE NOTICE '  ✅ Calcul correct';
    ELSE
      RAISE NOTICE '  ⚠️  Écart détecté: %', ABS(v_test_result.ventes_jour_ajustees - v_test_result.calcul_attendu);
    END IF;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════════════════════';
  
  -- Statistiques
  RAISE NOTICE '';
  RAISE NOTICE '📈 STATISTIQUES:';
  RAISE NOTICE '   - Produits avec ventes_jour_ajustees calculé: %', 
    (SELECT COUNT(*) FROM public.produits WHERE ventes_jour_ajustees IS NOT NULL);
  RAISE NOTICE '   - Produits avec ventes_jour_moy_30j > 0: %', 
    (SELECT COUNT(*) FROM public.produits WHERE ventes_jour_moy_30j > 0);
  RAISE NOTICE '   - Produits avec ventes_jour_ajustees = 0: %', 
    (SELECT COUNT(*) FROM public.produits WHERE ventes_jour_ajustees = 0);
END $$;

-- ============================================
-- FIN DE LA MIGRATION 030
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 030 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Fonction calculate_ventes_jour_ajustees() créée';
  RAISE NOTICE '   ✅ Trigger trigger_calculate_ventes_jour_ajustees créé (INSERT + UPDATE)';
  RAISE NOTICE '   ✅ Produits existants mis à jour';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Fonctionnalités:';
  RAISE NOTICE '   - Calcul automatique: ventes_jour_ajustees = ventes_jour_moy_30j × multiplicateur_prevision';
  RAISE NOTICE '   - Recalcul uniquement si ventes_jour_ajustees est NULL';
  RAISE NOTICE '   - Recalcul si ventes_jour_moy_30j ou multiplicateur_prevision changent (UPDATE)';
  RAISE NOTICE '   - Respecte les valeurs manuelles si les valeurs de base n''ont pas changé';
  RAISE NOTICE '   - Utilise le paramètre MultiplicateurDefaut si multiplicateur_prevision est NULL';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Formule:';
  RAISE NOTICE '   ventes_jour_ajustees = ventes_jour_moy_30j × COALESCE(multiplicateur_prevision, MultiplicateurDefaut, 1.2)';
  RAISE NOTICE '   Si ventes_jour_moy_30j est NULL ou 0 → ventes_jour_ajustees = 0';
END $$;

