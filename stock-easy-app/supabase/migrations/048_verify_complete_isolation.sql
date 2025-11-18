-- ============================================
-- Migration: Vérification Complète de l'Isolation
-- ============================================
-- Objectif: Vérifier que 100% des tables métier sont isolées par company_id
--           Ce script ne modifie rien, il vérifie seulement

-- ============================================
-- 1. LISTER TOUTES LES TABLES PUBLIQUES
-- ============================================

DO $$
DECLARE
  v_table_name TEXT;
  v_has_company_id BOOLEAN;
  v_has_rls BOOLEAN;
  v_has_policy BOOLEAN;
  v_tables_without_isolation TEXT[] := ARRAY[]::TEXT[];
  v_tables_isolated TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION DE L''ISOLATION COMPLÈTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Parcourir toutes les tables publiques (sauf les tables système)
  FOR v_table_name IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
      AND tablename NOT IN (
        'schema_migrations',
        '_prisma_migrations',
        'pg_stat_statements'
      )
    ORDER BY tablename
  LOOP
    -- Vérifier si la table a company_id
    SELECT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = v_table_name 
        AND column_name = 'company_id'
    ) INTO v_has_company_id;
    
    -- Vérifier si RLS est activé
    SELECT rowsecurity 
    INTO v_has_rls
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename = v_table_name;
    
    -- Vérifier si une policy RLS existe
    SELECT EXISTS (
      SELECT 1 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = v_table_name
    ) INTO v_has_policy;
    
    -- Déterminer si la table doit être isolée
    -- Les tables système (companies, user_profiles, invitations) sont gérées différemment
    IF v_table_name IN ('companies', 'user_profiles', 'invitations') THEN
      -- Ces tables sont gérées par des policies spéciales
      IF v_has_rls THEN
        v_tables_isolated := array_append(v_tables_isolated, v_table_name || ' (système)');
      ELSE
        v_tables_without_isolation := array_append(v_tables_without_isolation, v_table_name || ' (RLS manquant)');
      END IF;
    ELSIF v_table_name IN ('auth.users', 'auth.sessions') THEN
      -- Tables Supabase Auth, ignorées
      CONTINUE;
    ELSE
      -- Tables métier : doivent avoir company_id, RLS et policies
      IF v_has_company_id AND v_has_rls AND v_has_policy THEN
        v_tables_isolated := array_append(v_tables_isolated, v_table_name);
      ELSE
        v_tables_without_isolation := array_append(
          v_tables_without_isolation, 
          v_table_name || CASE 
            WHEN NOT v_has_company_id THEN ' (pas de company_id)'
            WHEN NOT v_has_rls THEN ' (RLS désactivé)'
            WHEN NOT v_has_policy THEN ' (pas de policy RLS)'
            ELSE ' (problème inconnu)'
          END
        );
      END IF;
    END IF;
  END LOOP;
  
  -- Afficher les résultats
  RAISE NOTICE '✅ TABLES ISOLÉES (%):', array_length(v_tables_isolated, 1);
  FOREACH v_table_name IN ARRAY v_tables_isolated
  LOOP
    RAISE NOTICE '   - %', v_table_name;
  END LOOP;
  
  RAISE NOTICE '';
  
  IF array_length(v_tables_without_isolation, 1) > 0 THEN
    RAISE WARNING '❌ TABLES NON ISOLÉES (%):', array_length(v_tables_without_isolation, 1);
    FOREACH v_table_name IN ARRAY v_tables_without_isolation
    LOOP
      RAISE WARNING '   - %', v_table_name;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ TOUTES LES TABLES SONT ISOLÉES !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- 2. VÉRIFIER LES POLICIES RLS
-- ============================================

DO $$
DECLARE
  v_policy RECORD;
  v_has_company_check BOOLEAN;
  v_policies_without_isolation TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'VÉRIFICATION DES POLICIES RLS';
  RAISE NOTICE '========================================';
  
  FOR v_policy IN 
    SELECT 
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename NOT IN ('companies', 'user_profiles', 'invitations')
    ORDER BY tablename, policyname
  LOOP
    -- Vérifier si la policy utilise get_current_user_company_id()
    v_has_company_check := (
      (v_policy.qual IS NOT NULL AND v_policy.qual LIKE '%get_current_user_company_id%')
      OR (v_policy.with_check IS NOT NULL AND v_policy.with_check LIKE '%get_current_user_company_id%')
    );
    
    -- Vérifier qu'elle n'a PAS "company_id IS NULL"
    IF v_has_company_check AND (
      (v_policy.qual IS NOT NULL AND v_policy.qual LIKE '%company_id IS NULL%')
      OR (v_policy.with_check IS NOT NULL AND v_policy.with_check LIKE '%company_id IS NULL%')
    ) THEN
      v_policies_without_isolation := array_append(
        v_policies_without_isolation,
        v_policy.tablename || '.' || v_policy.policyname || ' (contient "company_id IS NULL")'
      );
    ELSIF NOT v_has_company_check THEN
      v_policies_without_isolation := array_append(
        v_policies_without_isolation,
        v_policy.tablename || '.' || v_policy.policyname || ' (n''utilise pas get_current_user_company_id)'
      );
    END IF;
  END LOOP;
  
  IF array_length(v_policies_without_isolation, 1) > 0 THEN
    RAISE WARNING '❌ POLICIES AVEC PROBLÈMES (%):', array_length(v_policies_without_isolation, 1);
    FOREACH v_policy.policyname IN ARRAY v_policies_without_isolation
    LOOP
      RAISE WARNING '   - %', v_policy.policyname;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ TOUTES LES POLICIES SONT CORRECTES !';
  END IF;
  
  RAISE NOTICE '';
END $$;

-- ============================================
-- 3. VÉRIFIER LES TRIGGERS
-- ============================================

DO $$
DECLARE
  v_trigger RECORD;
  v_tables_without_trigger TEXT[] := ARRAY[]::TEXT[];
  v_expected_tables TEXT[] := ARRAY[
    'produits',
    'fournisseurs',
    'commandes',
    'warehouses',
    'parametres',
    'sku_fournisseurs',
    'kpi_snapshots',
    'order_comments',
    'notifications',
    'articles_commande',
    'sales_history'
  ];
  v_table_name TEXT;
  v_has_trigger BOOLEAN;
BEGIN
  RAISE NOTICE 'VÉRIFICATION DES TRIGGERS';
  RAISE NOTICE '========================================';
  
  FOREACH v_table_name IN ARRAY v_expected_tables
  LOOP
    -- Vérifier si la table existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = v_table_name
    ) THEN
      -- Vérifier si un trigger auto_set_company_id existe
      SELECT EXISTS (
        SELECT 1 
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = v_table_name
          AND t.tgname LIKE 'set_company_id%'
      ) INTO v_has_trigger;
      
      IF NOT v_has_trigger THEN
        v_tables_without_trigger := array_append(v_tables_without_trigger, v_table_name);
      END IF;
    END IF;
  END LOOP;
  
  IF array_length(v_tables_without_trigger, 1) > 0 THEN
    RAISE WARNING '❌ TABLES SANS TRIGGER (%):', array_length(v_tables_without_trigger, 1);
    FOREACH v_table_name IN ARRAY v_tables_without_trigger
    LOOP
      RAISE WARNING '   - %', v_table_name;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ TOUS LES TRIGGERS SONT EN PLACE !';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VÉRIFICATION TERMINÉE';
  RAISE NOTICE '========================================';
END $$;

