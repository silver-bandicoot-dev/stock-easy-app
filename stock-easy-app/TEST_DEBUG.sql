-- Test 1: Vérifier si les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'commandes' 
AND column_name IN ('missing_quantity_total', 'damaged_quantity_total', 'missing_quantities_by_sku', 'damaged_quantities_by_sku')
ORDER BY column_name;

-- Test 2: Voir une commande en réconciliation
SELECT 
  id,
  status,
  missing_quantity_total,
  damaged_quantity_total,
  missing_quantities_by_sku,
  damaged_quantities_by_sku
FROM commandes 
WHERE status = 'reconciliation'
LIMIT 1;

-- Test 3: Voir toutes les commandes
SELECT id, status, missing_quantity_total, damaged_quantity_total
FROM commandes
ORDER BY created_at DESC
LIMIT 5;

-- Test 4: Tester get_all_data()
SELECT jsonb_pretty((get_all_data()::jsonb -> 'orders' -> 0));




