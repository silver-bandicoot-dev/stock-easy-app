-- ============================================
-- Migration 026: Implémentation complète des fonctions de gestion des entrepôts
-- ============================================
-- Objectif : Corriger les fonctions create_warehouse, update_warehouse et delete_warehouse
--            pour qu'elles fonctionnent correctement avec le système multi-tenant

-- ============================================
-- 1. FONCTION CREATE_WAREHOUSE
-- ============================================

-- Supprimer toutes les versions possibles de l'ancienne fonction
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'create_warehouse'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.create_warehouse(
  p_name TEXT,
  p_location TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT 'France',
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_warehouse_id UUID;
  v_warehouse JSON;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise pour créer un entrepôt'
    );
  END IF;
  
  -- Vérifier que le nom n'est pas déjà utilisé dans cette entreprise
  IF EXISTS (
    SELECT 1 FROM public.warehouses
    WHERE name = p_name
    AND company_id = v_company_id
  ) THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Un entrepôt avec ce nom existe déjà dans votre entreprise'
    );
  END IF;
  
  -- Créer l'entrepôt
  INSERT INTO public.warehouses (
    name,
    location,
    capacity,
    address,
    city,
    postal_code,
    country,
    notes,
    company_id
  )
  VALUES (
    p_name,
    p_location,
    p_capacity,
    p_address,
    p_city,
    p_postal_code,
    p_country,
    p_notes,
    v_company_id
  )
  RETURNING id INTO v_warehouse_id;
  
  -- Récupérer l'entrepôt créé
  SELECT row_to_json(w) INTO v_warehouse
  FROM public.warehouses w
  WHERE w.id = v_warehouse_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'data', v_warehouse
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 2. FONCTION UPDATE_WAREHOUSE
-- ============================================

-- Supprimer toutes les versions possibles de l'ancienne fonction
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'update_warehouse'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.update_warehouse(
  p_warehouse_id TEXT,
  p_name TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_postal_code TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_warehouse_id_uuid UUID;
  v_warehouse JSON;
  v_warehouse_name TEXT;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise pour modifier un entrepôt'
    );
  END IF;
  
  -- Essayer de convertir p_warehouse_id en UUID, sinon utiliser comme nom
  BEGIN
    v_warehouse_id_uuid := p_warehouse_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_warehouse_id_uuid := NULL;
    v_warehouse_name := p_warehouse_id;
  END;
  
  -- Trouver l'entrepôt par ID ou nom
  IF v_warehouse_id_uuid IS NOT NULL THEN
    -- Recherche par ID UUID
    SELECT id, name INTO v_warehouse_id_uuid, v_warehouse_name
    FROM public.warehouses
    WHERE id = v_warehouse_id_uuid
    AND company_id = v_company_id;
  ELSE
    -- Recherche par nom
    SELECT id, name INTO v_warehouse_id_uuid, v_warehouse_name
    FROM public.warehouses
    WHERE name = v_warehouse_name
    AND company_id = v_company_id;
  END IF;
  
  IF v_warehouse_id_uuid IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Entrepôt non trouvé ou vous n''avez pas la permission de le modifier'
    );
  END IF;
  
  -- Vérifier que le nouveau nom n'est pas déjà utilisé (si le nom change)
  IF p_name IS NOT NULL AND p_name != v_warehouse_name THEN
    IF EXISTS (
      SELECT 1 FROM public.warehouses
      WHERE name = p_name
      AND company_id = v_company_id
      AND id != v_warehouse_id_uuid
    ) THEN
      RETURN json_build_object(
        'success', FALSE,
        'error', 'Un entrepôt avec ce nom existe déjà dans votre entreprise'
      );
    END IF;
  END IF;
  
  -- Mettre à jour l'entrepôt
  UPDATE public.warehouses
  SET 
    name = COALESCE(p_name, name),
    location = COALESCE(p_location, location),
    capacity = COALESCE(p_capacity, capacity),
    address = COALESCE(p_address, address),
    city = COALESCE(p_city, city),
    postal_code = COALESCE(p_postal_code, postal_code),
    country = COALESCE(p_country, country),
    notes = COALESCE(p_notes, notes),
    updated_at = NOW()
  WHERE id = v_warehouse_id_uuid
  AND company_id = v_company_id;
  
  -- Récupérer l'entrepôt mis à jour
  SELECT row_to_json(w) INTO v_warehouse
  FROM public.warehouses w
  WHERE w.id = v_warehouse_id_uuid;
  
  RETURN json_build_object(
    'success', TRUE,
    'data', v_warehouse
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. FONCTION DELETE_WAREHOUSE
-- ============================================

-- Supprimer toutes les versions possibles de l'ancienne fonction
-- PostgreSQL ne peut pas changer le nom d'un paramètre avec CREATE OR REPLACE
-- Il faut donc supprimer d'abord toutes les surcharges possibles
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid::regprocedure as func_signature
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'delete_warehouse'
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || r.func_signature || ' CASCADE';
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.delete_warehouse(p_warehouse_id TEXT)
RETURNS JSON AS $$
DECLARE
  v_company_id UUID;
  v_warehouse_id_uuid UUID;
  v_warehouse_name TEXT;
  v_deleted_warehouse JSON;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Vous devez appartenir à une entreprise pour supprimer un entrepôt'
    );
  END IF;
  
  -- Essayer de convertir p_warehouse_id en UUID, sinon utiliser comme nom
  BEGIN
    v_warehouse_id_uuid := p_warehouse_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_warehouse_id_uuid := NULL;
    v_warehouse_name := p_warehouse_id;
  END;
  
  -- Trouver l'entrepôt par ID ou nom
  IF v_warehouse_id_uuid IS NOT NULL THEN
    -- Recherche par ID UUID
    SELECT id, name INTO v_warehouse_id_uuid, v_warehouse_name
    FROM public.warehouses
    WHERE id = v_warehouse_id_uuid
    AND company_id = v_company_id;
  ELSE
    -- Recherche par nom
    SELECT id, name INTO v_warehouse_id_uuid, v_warehouse_name
    FROM public.warehouses
    WHERE name = v_warehouse_name
    AND company_id = v_company_id;
  END IF;
  
  IF v_warehouse_id_uuid IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Entrepôt non trouvé ou vous n''avez pas la permission de le supprimer'
    );
  END IF;
  
  -- Sauvegarder les informations de l'entrepôt avant suppression
  SELECT row_to_json(w) INTO v_deleted_warehouse
  FROM public.warehouses w
  WHERE w.id = v_warehouse_id_uuid;
  
  -- Supprimer l'entrepôt
  DELETE FROM public.warehouses
  WHERE id = v_warehouse_id_uuid
  AND company_id = v_company_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'data', v_deleted_warehouse
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. COMMENTAIRES
-- ============================================

COMMENT ON FUNCTION public.create_warehouse IS 'Crée un nouvel entrepôt pour l''entreprise de l''utilisateur actuel';
COMMENT ON FUNCTION public.update_warehouse IS 'Met à jour un entrepôt existant (recherche par ID UUID ou nom)';
COMMENT ON FUNCTION public.delete_warehouse IS 'Supprime un entrepôt (recherche par ID UUID ou nom)';

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

