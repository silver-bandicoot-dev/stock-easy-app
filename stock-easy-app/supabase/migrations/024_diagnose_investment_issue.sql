-- ============================================
-- Migration 024: Diagnostic du Problème d'Investissement
-- ============================================
-- Cette migration diagnostique pourquoi l'investissement n'est pas calculé

-- ============================================
-- 1. VÉRIFIER SI LA COLONNE EXISTE
-- ============================================

DO $$
DECLARE
  v_column_exists BOOLEAN;
  v_sample_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DIAGNOSTIC: Vérification de la colonne investissement';
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  -- Vérifier si la colonne existe
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'produits' 
      AND column_name = 'investissement'
  ) INTO v_column_exists;
  
  IF v_column_exists THEN
    RAISE NOTICE '✅ La colonne investissement existe';
  ELSE
    RAISE NOTICE '❌ La colonne investissement N''EXISTE PAS - Il faut d''abord exécuter la migration 022';
    RETURN;
  END IF;
  
  -- Compter les produits
  SELECT COUNT(*) INTO v_sample_count FROM public.produits;
  RAISE NOTICE '📊 Nombre total de produits: %', v_sample_count;
  
END $$;

-- ============================================
-- 2. VÉRIFIER LES VALEURS ACTUELLES
-- ============================================

DO $$
DECLARE
  v_sample RECORD;
  v_products_with_qty INTEGER;
  v_products_with_price INTEGER;
  v_products_with_both INTEGER;
  v_products_with_investment INTEGER;
  v_zero_investment INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 DIAGNOSTIC: Analyse des données';
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  -- Compter les produits avec qte_a_commander > 0
  SELECT COUNT(*) INTO v_products_with_qty
  FROM public.produits
  WHERE qte_a_commander IS NOT NULL 
    AND qte_a_commander > 0;
  
  -- Compter les produits avec prix_achat > 0
  SELECT COUNT(*) INTO v_products_with_price
  FROM public.produits
  WHERE prix_achat IS NOT NULL 
    AND prix_achat > 0;
  
  -- Compter les produits avec les deux
  SELECT COUNT(*) INTO v_products_with_both
  FROM public.produits
  WHERE qte_a_commander IS NOT NULL 
    AND qte_a_commander > 0
    AND prix_achat IS NOT NULL 
    AND prix_achat > 0;
  
  -- Compter les produits avec investissement > 0
  SELECT COUNT(*) INTO v_products_with_investment
  FROM public.produits
  WHERE investissement IS NOT NULL 
    AND investissement > 0;
  
  -- Compter les produits avec investissement = 0 mais qui devraient avoir un investissement
  SELECT COUNT(*) INTO v_zero_investment
  FROM public.produits
  WHERE (investissement IS NULL OR investissement = 0)
    AND qte_a_commander IS NOT NULL 
    AND qte_a_commander > 0
    AND prix_achat IS NOT NULL 
    AND prix_achat > 0;
  
  RAISE NOTICE '📊 Produits avec qte_a_commander > 0: %', v_products_with_qty;
  RAISE NOTICE '📊 Produits avec prix_achat > 0: %', v_products_with_price;
  RAISE NOTICE '📊 Produits avec qte_a_commander > 0 ET prix_achat > 0: %', v_products_with_both;
  RAISE NOTICE '📊 Produits avec investissement > 0: %', v_products_with_investment;
  RAISE NOTICE '⚠️  Produits qui DEVRAIENT avoir un investissement > 0 mais l''ont à 0: %', v_zero_investment;
  
  -- Afficher un échantillon de produits problématiques
  IF v_zero_investment > 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '📋 EXEMPLE DE PRODUIT AVEC INVESTISSEMENT MANQUANT:';
    RAISE NOTICE '═══════════════════════════════════════════════';
    
    FOR v_sample IN 
      SELECT sku, nom_produit, qte_a_commander, prix_achat, investissement,
             (qte_a_commander * prix_achat) as investissement_calcule
      FROM public.produits
      WHERE (investissement IS NULL OR investissement = 0)
        AND qte_a_commander IS NOT NULL 
        AND qte_a_commander > 0
        AND prix_achat IS NOT NULL 
        AND prix_achat > 0
      LIMIT 5
    LOOP
      RAISE NOTICE '';
      RAISE NOTICE 'SKU: %', v_sample.sku;
      RAISE NOTICE 'Produit: %', v_sample.nom_produit;
      RAISE NOTICE 'Qté à commander: %', v_sample.qte_a_commander;
      RAISE NOTICE 'Prix d''achat: %', v_sample.prix_achat;
      RAISE NOTICE 'Investissement actuel: %', COALESCE(v_sample.investissement, 0);
      RAISE NOTICE 'Investissement calculé (qte × prix): %', v_sample.investissement_calcule;
      RAISE NOTICE '─────────────────────────────────────';
    END LOOP;
  END IF;
  
END $$;

-- ============================================
-- 3. FORCER LE RECALCUL DIRECT
-- ============================================

DO $$
DECLARE
  v_updated INTEGER;
  v_sample RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CORRECTION: Recalcul direct de l''investissement';
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  -- Mettre à jour directement l'investissement
  UPDATE public.produits
  SET investissement = COALESCE(qte_a_commander, 0) * COALESCE(prix_achat, 0)
  WHERE qte_a_commander IS NOT NULL 
    AND prix_achat IS NOT NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) mis à jour', v_updated;
  
  -- Vérifier le résultat
  SELECT sku, nom_produit, qte_a_commander, prix_achat, investissement
  INTO v_sample
  FROM public.produits
  WHERE qte_a_commander > 0 
    AND prix_achat > 0
    AND investissement > 0
  ORDER BY investissement DESC
  LIMIT 1;
  
  IF v_sample IS NOT NULL THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ VÉRIFICATION: Exemple après mise à jour';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE 'SKU: %', v_sample.sku;
    RAISE NOTICE 'Produit: %', v_sample.nom_produit;
    RAISE NOTICE 'Qté à commander: %', v_sample.qte_a_commander;
    RAISE NOTICE 'Prix d''achat: %', v_sample.prix_achat;
    RAISE NOTICE 'Investissement: %', v_sample.investissement;
    RAISE NOTICE 'Calcul attendu: % × % = %', 
      v_sample.qte_a_commander, 
      v_sample.prix_achat, 
      (v_sample.qte_a_commander * v_sample.prix_achat);
    
    IF v_sample.investissement = (v_sample.qte_a_commander * v_sample.prix_achat) THEN
      RAISE NOTICE '✅ Les valeurs correspondent!';
    ELSE
      RAISE NOTICE '❌ PROBLÈME: Les valeurs ne correspondent pas!';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Aucun produit avec investissement > 0 trouvé';
  END IF;
  
END $$;

-- ============================================
-- 4. STATISTIQUES FINALES
-- ============================================

DO $$
DECLARE
  v_total_investment NUMERIC;
  v_products_with_investment INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES FINALES';
  RAISE NOTICE '═══════════════════════════════════════════════';
  
  -- Calculer l'investissement total
  SELECT COALESCE(SUM(investissement), 0) INTO v_total_investment
  FROM public.produits
  WHERE qte_a_commander > 0;
  
  -- Compter les produits avec investissement > 0
  SELECT COUNT(*) INTO v_products_with_investment
  FROM public.produits
  WHERE investissement IS NOT NULL 
    AND investissement > 0;
  
  RAISE NOTICE '💰 Investissement total nécessaire: % EUR', v_total_investment;
  RAISE NOTICE '📦 Produits avec investissement > 0: %', v_products_with_investment;
  RAISE NOTICE '';
  
  IF v_total_investment > 0 THEN
    RAISE NOTICE '✅ SUCCÈS: L''investissement a été calculé correctement!';
  ELSE
    RAISE NOTICE '⚠️  ATTENTION: L''investissement total est à 0';
    RAISE NOTICE '   Vérifiez que vous avez des produits avec qte_a_commander > 0 et prix_achat > 0';
  END IF;
  
END $$;

-- ============================================
-- FIN DE LA MIGRATION 024
-- ============================================

