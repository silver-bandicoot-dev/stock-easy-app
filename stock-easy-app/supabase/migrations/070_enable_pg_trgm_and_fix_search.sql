-- ============================================
-- Migration 070: Activation de pg_trgm et correction de la recherche floue (VERSION ROBUSTE)
-- ============================================

-- 1. S'assurer que le schéma extensions existe
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Activer l'extension pg_trgm dans le schéma extensions (standard Supabase)
-- On essaie dans extensions, sinon public, pour être sûr
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- 3. Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS public.search_products_fuzzy(text, integer);
DROP FUNCTION IF EXISTS public.search_suppliers_fuzzy(text, integer);
DROP FUNCTION IF EXISTS public.search_orders_fuzzy(text, integer);
DROP FUNCTION IF EXISTS public.search_warehouses_fuzzy(text, integer);

-- 4. Fonction de recherche de produits
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  sku TEXT,
  nom_produit TEXT,
  stock_actuel INTEGER,
  prix_vente NUMERIC,
  fournisseur TEXT,
  image_url TEXT,
  health_status TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.sku,
    p.nom_produit,
    p.stock_actuel,
    p.prix_vente,
    p.fournisseur,
    p.image_url,
    p.health_status,
    GREATEST(similarity(p.nom_produit, search_term), similarity(p.sku, search_term))::FLOAT as similarity_score
  FROM products p
  WHERE 
    p.nom_produit ILIKE '%' || search_term || '%'
    OR p.sku ILIKE '%' || search_term || '%'
    OR similarity(p.nom_produit, search_term) > 0.1
    OR similarity(p.sku, search_term) > 0.1
  ORDER BY 
    similarity_score DESC,
    p.stock_actuel DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions; -- IMPORTANT: Inclure 'extensions' dans le path

-- Correction table produits (version française si la table s'appelle 'produits')
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  sku TEXT,
  nom_produit TEXT,
  stock_actuel INTEGER,
  prix_vente NUMERIC,
  fournisseur TEXT,
  image_url TEXT,
  health_status TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.sku,
    p.nom_produit,
    p.stock_actuel,
    p.prix_vente,
    p.fournisseur,
    p.image_url,
    p.health_status,
    GREATEST(similarity(p.nom_produit, search_term), similarity(p.sku, search_term))::FLOAT as similarity_score
  FROM produits p
  WHERE 
    p.nom_produit ILIKE '%' || search_term || '%'
    OR p.sku ILIKE '%' || search_term || '%'
    OR similarity(p.nom_produit, search_term) > 0.1
    OR similarity(p.sku, search_term) > 0.1
  ORDER BY 
    similarity_score DESC,
    p.stock_actuel DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions;


-- 5. Fonction de recherche de fournisseurs
CREATE OR REPLACE FUNCTION public.search_suppliers_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  nom_fournisseur TEXT,
  email TEXT,
  lead_time_days INTEGER,
  commercial_contact_email TEXT,
  commercial_contact_phone TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id,
    f.nom_fournisseur,
    f.email,
    f.lead_time_days,
    f.commercial_contact_email,
    f.commercial_contact_phone,
    similarity(f.nom_fournisseur, search_term)::FLOAT as similarity_score
  FROM fournisseurs f
  WHERE 
    f.nom_fournisseur ILIKE '%' || search_term || '%'
    OR similarity(f.nom_fournisseur, search_term) > 0.1
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions;


-- 6. Fonction de recherche de commandes
CREATE OR REPLACE FUNCTION public.search_orders_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  supplier TEXT,
  status TEXT,
  tracking_number TEXT,
  total NUMERIC,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.supplier,
    c.status,
    c.tracking_number,
    c.total,
    GREATEST(similarity(c.supplier, search_term), similarity(COALESCE(c.tracking_number, ''), search_term))::FLOAT as similarity_score
  FROM commandes c
  WHERE 
    c.supplier ILIKE '%' || search_term || '%'
    OR c.tracking_number ILIKE '%' || search_term || '%'
    OR c.id::TEXT ILIKE search_term || '%'
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions;


-- 7. Fonction de recherche d'entrepôts
CREATE OR REPLACE FUNCTION public.search_warehouses_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  country TEXT,
  similarity_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.city,
    w.address,
    w.postal_code,
    w.country,
    similarity(w.name, search_term)::FLOAT as similarity_score
  FROM warehouses w
  WHERE 
    w.name ILIKE '%' || search_term || '%'
    OR w.city ILIKE '%' || search_term || '%'
    OR similarity(w.name, search_term) > 0.1
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_suppliers_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_orders_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_warehouses_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_suppliers_fuzzy(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_orders_fuzzy(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_warehouses_fuzzy(text, integer) TO anon;
