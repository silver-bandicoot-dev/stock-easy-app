-- Migration 071: Correction des types de retour pour les fonctions de recherche RPC
-- Cette migration corrige les erreurs de typage (code 42804) lors de la recherche

-- DROP des anciennes fonctions pour permettre le changement de type
DROP FUNCTION IF EXISTS public.search_products_fuzzy(text, integer);
DROP FUNCTION IF EXISTS public.search_orders_fuzzy(text, integer);

-- 1. Fonction de recherche de produits (stock_actuel NUMERIC)
CREATE OR REPLACE FUNCTION public.search_products_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  sku TEXT,
  nom_produit TEXT,
  stock_actuel NUMERIC,  -- Changé de INTEGER à NUMERIC pour correspondre à la table produits
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

-- 2. Fonction de recherche de commandes (id TEXT)
CREATE OR REPLACE FUNCTION public.search_orders_fuzzy(
  search_term TEXT,
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id TEXT, -- Changé de UUID à TEXT pour correspondre à la table commandes
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
    OR c.id ILIKE search_term || '%'
  ORDER BY 
    similarity_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public, extensions;

-- Rétablir les permissions
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_orders_fuzzy(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_products_fuzzy(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.search_orders_fuzzy(text, integer) TO anon;
