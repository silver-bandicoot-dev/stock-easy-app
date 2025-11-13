-- ============================================
-- Migration 014: Fonction pour inspecter le schéma de la table produits
-- ============================================

CREATE OR REPLACE FUNCTION public.get_produits_schema()
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT
) AS $$
BEGIN
  SET search_path = public;
  
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT
  FROM 
    information_schema.columns c
  WHERE 
    c.table_schema = 'public' 
    AND c.table_name = 'produits'
  ORDER BY 
    c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions appropriées
GRANT EXECUTE ON FUNCTION public.get_produits_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_produits_schema() TO anon;

