-- ============================================
-- Migration 023: Correction du Calcul de l'Investissement
-- ============================================
-- Cette migration force le recalcul de l'investissement pour tous les produits
-- en mettant à jour directement la colonne investissement

-- ============================================
-- 1. RECALCULER DIRECTEMENT L'INVESTISSEMENT POUR TOUS LES PRODUITS
-- ============================================

DO $$
DECLARE
  v_count INTEGER;
  v_updated INTEGER := 0;
BEGIN
  SET search_path = public;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Recalcul de l''investissement pour tous les produits...';
  
  -- Compter les produits à mettre à jour
  SELECT COUNT(*) INTO v_count 
  FROM public.produits
  WHERE qte_a_commander IS NOT NULL 
    AND prix_achat IS NOT NULL
    AND qte_a_commander > 0
    AND prix_achat > 0;
  
  RAISE NOTICE '📊 % produit(s) avec qte_a_commander > 0 et prix_achat > 0', v_count;
  
  -- Mettre à jour directement l'investissement pour tous les produits
  UPDATE public.produits
  SET investissement = COALESCE(qte_a_commander, 0) * COALESCE(prix_achat, 0)
  WHERE qte_a_commander IS NOT NULL 
    AND prix_achat IS NOT NULL;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec l''investissement!', v_updated;
END $$;

-- Vérifier les résultats dans un bloc séparé
DO $$
DECLARE
  v_sample RECORD;
  v_total_investment NUMERIC;
BEGIN
  -- Afficher un échantillon de produits mis à jour
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
    RAISE NOTICE '📊 EXEMPLE DE PRODUIT MIS À JOUR:';
    RAISE NOTICE '═══════════════════════════════════════════════';
    RAISE NOTICE 'SKU: %', v_sample.sku;
    RAISE NOTICE 'Produit: %', v_sample.nom_produit;
    RAISE NOTICE 'Qté à commander: %', v_sample.qte_a_commander;
    RAISE NOTICE 'Prix d''achat: %', v_sample.prix_achat;
    RAISE NOTICE 'Investissement: %', v_sample.investissement;
    RAISE NOTICE '═══════════════════════════════════════════════';
  END IF;
  
  -- Calculer l'investissement total
  SELECT COALESCE(SUM(investissement), 0) INTO v_total_investment
  FROM public.produits
  WHERE qte_a_commander > 0;
  
  RAISE NOTICE '';
  RAISE NOTICE '💰 Investissement total nécessaire: % EUR', v_total_investment;
END $$;

-- ============================================
-- 2. CRÉER/METTRE À JOUR LA FONCTION POUR RECALCULER
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_all_investments()
RETURNS JSON AS $$
DECLARE
  v_count INTEGER := 0;
  v_total_investment NUMERIC := 0;
BEGIN
  SET search_path = public;
  
  RAISE NOTICE '🔄 Recalcul de l''investissement pour tous les produits...';
  
  -- Mettre à jour directement la colonne investissement
  UPDATE public.produits
  SET investissement = COALESCE(qte_a_commander, 0) * COALESCE(prix_achat, 0)
  WHERE qte_a_commander IS NOT NULL 
    AND prix_achat IS NOT NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Calculer l'investissement total
  SELECT COALESCE(SUM(investissement), 0) INTO v_total_investment
  FROM public.produits
  WHERE qte_a_commander > 0;
  
  RAISE NOTICE '✅ % produit(s) mis à jour avec l''investissement!', v_count;
  RAISE NOTICE '💰 Investissement total: % EUR', v_total_investment;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', format('Investissement recalculé pour %s produit(s)', v_count),
    'updated_count', v_count,
    'total_investment', v_total_investment
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.recalculate_all_investments() TO authenticated;

COMMENT ON FUNCTION public.recalculate_all_investments() IS 
'Recalcule l''investissement pour tous les produits : investissement = qte_a_commander * prix_achat';

-- ============================================
-- FIN DE LA MIGRATION 023
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Migration 023 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 MODIFICATIONS:';
  RAISE NOTICE '   ✅ Tous les investissements recalculés directement';
  RAISE NOTICE '   ✅ Fonction recalculate_all_investments() créée/mise à jour';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Vous pouvez appeler recalculate_all_investments() pour recalculer l''investissement à tout moment';
END $$;

