-- Migration 098: Assigner un entrepôt par défaut aux commandes existantes
-- Problème: Les commandes existantes ont warehouse_id = NULL à cause d'un bug de naming

-- Cette migration assigne le premier entrepôt de la company aux commandes qui n'en ont pas

DO $$
DECLARE
  v_company_record RECORD;
  v_default_warehouse_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- Pour chaque company qui a des commandes sans warehouse_id
  FOR v_company_record IN 
    SELECT DISTINCT company_id 
    FROM commandes 
    WHERE warehouse_id IS NULL AND company_id IS NOT NULL
  LOOP
    -- Trouver le premier entrepôt de cette company
    SELECT id INTO v_default_warehouse_id
    FROM warehouses
    WHERE company_id = v_company_record.company_id
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- Si un entrepôt existe, l'assigner aux commandes
    IF v_default_warehouse_id IS NOT NULL THEN
      UPDATE commandes
      SET warehouse_id = v_default_warehouse_id
      WHERE company_id = v_company_record.company_id
        AND warehouse_id IS NULL;
      
      GET DIAGNOSTICS v_updated_count = ROW_COUNT;
      RAISE NOTICE 'Company %: % commandes mises à jour avec entrepôt %', 
        v_company_record.company_id, v_updated_count, v_default_warehouse_id;
    ELSE
      RAISE NOTICE 'Company %: Pas d''entrepôt trouvé, commandes non modifiées', 
        v_company_record.company_id;
    END IF;
  END LOOP;
END $$;

-- Afficher un résumé
DO $$
DECLARE
  v_total_null INTEGER;
  v_total_set INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_null FROM commandes WHERE warehouse_id IS NULL;
  SELECT COUNT(*) INTO v_total_set FROM commandes WHERE warehouse_id IS NOT NULL;
  
  RAISE NOTICE '=== Résumé ===';
  RAISE NOTICE 'Commandes avec entrepôt: %', v_total_set;
  RAISE NOTICE 'Commandes sans entrepôt: %', v_total_null;
END $$;
















