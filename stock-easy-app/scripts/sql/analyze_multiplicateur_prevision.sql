-- ============================================
-- Analyse de la colonne multiplicateur_prevision
-- ============================================

-- 1. Vérifier la définition de la colonne
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public'
  AND table_name = 'produits' 
  AND column_name LIKE '%multiplicateur%'
ORDER BY column_name;

-- 2. Voir la distribution des valeurs
SELECT 
    multiplicateur_prevision,
    COUNT(*) as nombre_produits,
    MIN(multiplicateur_prevision) as valeur_min,
    MAX(multiplicateur_prevision) as valeur_max,
    AVG(multiplicateur_prevision) as valeur_moyenne
FROM produits
WHERE multiplicateur_prevision IS NOT NULL
GROUP BY multiplicateur_prevision
ORDER BY multiplicateur_prevision;

-- 3. Comparer avec le paramètre MultiplicateurDefaut
SELECT 
    p.sku,
    p.nom_produit,
    p.multiplicateur_prevision,
    param.valeur as multiplicateur_defaut_parametre,
    CASE 
        WHEN p.multiplicateur_prevision::text = param.valeur THEN 'Égal au paramètre'
        ELSE 'Différent du paramètre'
    END as comparaison
FROM produits p
CROSS JOIN (
    SELECT valeur 
    FROM parametres 
    WHERE nom_parametre = 'MultiplicateurDefaut'
    LIMIT 1
) param
WHERE p.multiplicateur_prevision IS NOT NULL
LIMIT 10;

-- 4. Vérifier s'il y a un trigger qui modifie cette colonne
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'produits'
ORDER BY trigger_name;

-- 5. Vérifier les fonctions qui pourraient modifier cette colonne
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND (
      routine_definition ILIKE '%multiplicateur_prevision%'
      OR routine_definition ILIKE '%MultiplicateurDefaut%'
  );

