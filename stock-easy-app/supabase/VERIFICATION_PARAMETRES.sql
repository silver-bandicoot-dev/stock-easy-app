-- ========================================
-- Script de vérification rapide
-- À exécuter dans Supabase SQL Editor
-- ========================================

-- 1. Vérifier que la table parametres existe
SELECT 
  EXISTS(
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'parametres'
  ) AS table_exists;

-- 2. Voir la structure de la table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'parametres'
ORDER BY ordinal_position;

-- 3. Vérifier que la fonction update_parameter existe
SELECT 
  proname AS function_name,
  pg_get_function_arguments(oid) AS arguments,
  pg_get_functiondef(oid) AS definition
FROM pg_proc
WHERE proname = 'update_parameter'
  AND pronamespace = 'public'::regnamespace;

-- 4. Voir tous les paramètres actuels
SELECT 
  nom_parametre,
  valeur,
  created_at,
  updated_at
FROM public.parametres
ORDER BY nom_parametre;

-- 5. Vérifier les policies RLS sur la table parametres
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'parametres';

-- 6. Tester la fonction update_parameter
SELECT public.update_parameter('DeviseDefaut', 'EUR') AS test_devise;
SELECT public.update_parameter('SeuilSurstockProfond', '90') AS test_seuil;
SELECT public.update_parameter('MultiplicateurDefaut', '1.2') AS test_multiplicateur;

-- 7. Vérifier que les mises à jour ont fonctionné
SELECT 
  nom_parametre,
  valeur,
  updated_at
FROM public.parametres
WHERE nom_parametre IN ('DeviseDefaut', 'SeuilSurstockProfond', 'MultiplicateurDefaut')
ORDER BY nom_parametre;

-- 8. Statistiques finales
SELECT 
  COUNT(*) AS total_parametres,
  COUNT(CASE WHEN valeur IS NOT NULL THEN 1 END) AS parametres_avec_valeur,
  COUNT(CASE WHEN updated_at > NOW() - INTERVAL '1 hour' THEN 1 END) AS mis_a_jour_recemment
FROM public.parametres;

-- ========================================
-- Résultats attendus :
-- ========================================
-- 1. table_exists = TRUE
-- 2. Colonnes : id, nom_parametre, valeur, description, created_at, updated_at
-- 3. Fonction update_parameter existe et a du code (pas juste un commentaire)
-- 4. Au moins 3 paramètres : DeviseDefaut, SeuilSurstockProfond, MultiplicateurDefaut
-- 5. Policy auth_parameters_all ou auth_parameters_select + auth_parameters_update
-- 6. Tous les tests retournent {"success": true, ...}
-- 7. Valeurs correctes : EUR, 90, 1.2
-- 8. Total = 3+, tous avec valeur, au moins 1 récent

