-- ============================================
-- Migration: Strict Multi-Tenant Isolation
-- ============================================
-- Objectif: S'assurer que chaque entreprise ne voit QUE ses propres données
--           Supprimer la clause "OR company_id IS NULL" qui est un risque de sécurité

BEGIN;

-- ============================================
-- 1. NETTOYER LES DONNÉES ORPHELINES
-- ============================================
-- Les données sans company_id doivent être assignées à une company ou supprimées
-- Pour les données existantes, on les assigne à la company du premier utilisateur
-- (ou vous pouvez les supprimer si elles ne sont plus nécessaires)

-- Note: Cette section est commentée par défaut pour éviter de modifier les données existantes
-- Décommentez et adaptez selon vos besoins

/*
-- Assigner les données orphelines à la première company trouvée
DO $$
DECLARE
  v_default_company_id UUID;
BEGIN
  -- Récupérer la première company
  SELECT id INTO v_default_company_id
  FROM public.companies
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_default_company_id IS NOT NULL THEN
    -- Assigner les données orphelines
    UPDATE public.produits SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.commandes SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.warehouses SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.parametres SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.sku_fournisseurs SET company_id = v_default_company_id WHERE company_id IS NULL;
    UPDATE public.kpi_snapshots SET company_id = v_default_company_id WHERE company_id IS NULL;
  END IF;
END $$;
*/

-- ============================================
-- 2. RENDRE company_id OBLIGATOIRE
-- ============================================
-- S'assurer que company_id ne peut pas être NULL pour les nouvelles données

ALTER TABLE public.produits 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.fournisseurs 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.commandes 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.warehouses 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.parametres 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.sku_fournisseurs 
  ALTER COLUMN company_id SET NOT NULL;

ALTER TABLE public.kpi_snapshots 
  ALTER COLUMN company_id SET NOT NULL;

-- ============================================
-- 3. POLICIES RLS STRICTES (SANS company_id IS NULL)
-- ============================================
-- Supprimer la clause "OR company_id IS NULL" pour une sécurité stricte

-- Products
DROP POLICY IF EXISTS "Users can only see their company's products" ON public.produits;
CREATE POLICY "Users can only see their company's products"
  ON public.produits FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Suppliers
DROP POLICY IF EXISTS "Users can only see their company's suppliers" ON public.fournisseurs;
CREATE POLICY "Users can only see their company's suppliers"
  ON public.fournisseurs FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Orders
DROP POLICY IF EXISTS "Users can only see their company's orders" ON public.commandes;
CREATE POLICY "Users can only see their company's orders"
  ON public.commandes FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Warehouses
DROP POLICY IF EXISTS "Users can only see their company's warehouses" ON public.warehouses;
CREATE POLICY "Users can only see their company's warehouses"
  ON public.warehouses FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Parameters
DROP POLICY IF EXISTS "Users can only see their company's parameters" ON public.parametres;
CREATE POLICY "Users can only see their company's parameters"
  ON public.parametres FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- SKU Suppliers
DROP POLICY IF EXISTS "Users can only see their company's sku_suppliers" ON public.sku_fournisseurs;
CREATE POLICY "Users can only see their company's sku_suppliers"
  ON public.sku_fournisseurs FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- KPI Snapshots
DROP POLICY IF EXISTS "Users can only see their company's kpi_snapshots" ON public.kpi_snapshots;
CREATE POLICY "Users can only see their company's kpi_snapshots"
  ON public.kpi_snapshots FOR ALL
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- ============================================
-- 4. METTRE À JOUR get_all_data() SANS company_id IS NULL
-- ============================================

CREATE OR REPLACE FUNCTION public.get_all_data()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_company_id UUID;
BEGIN
  SET search_path = public;
  
  -- Récupérer le company_id de l'utilisateur actuel
  v_company_id := public.get_current_user_company_id();
  
  -- Si l'utilisateur n'a pas de company_id, retourner des données vides
  IF v_company_id IS NULL THEN
    RETURN json_build_object(
      'products', '[]'::json,
      'suppliers', '[]'::json,
      'warehouses', '[]'::json,
      'orders', '[]'::json,
      'parameters', '[]'::json,
      'skuSuppliers', '[]'::json
    );
  END IF;
  
  SELECT json_build_object(
    'products', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json) 
      FROM public.produits p 
      WHERE p.company_id = v_company_id
    ),
    'suppliers', (
      SELECT COALESCE(json_agg(row_to_json(f)), '[]'::json) 
      FROM public.fournisseurs f 
      WHERE f.company_id = v_company_id
    ),
    'warehouses', (
      SELECT COALESCE(json_agg(row_to_json(w)), '[]'::json) 
      FROM public.warehouses w 
      WHERE w.company_id = v_company_id
    ),
    'orders', (
      SELECT COALESCE(json_agg(
        json_build_object(
          'id', c.id,
          'supplier', c.supplier,
          'warehouseId', c.warehouse_id,
          'status', c.status,
          'total', c.total,
          'createdAt', c.created_at,
          'eta', c.eta,
          'confirmedAt', c.confirmed_at,
          'shippedAt', c.shipped_at,
          'receivedAt', c.received_at,
          'completedAt', c.completed_at,
          'trackingNumber', c.tracking_number,
          'trackingUrl', c.tracking_url,
          'hasDiscrepancy', c.has_discrepancy,
          'damageReport', c.damage_report,
          'notes', c.notes,
          'items', (SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json) FROM public.articles_commande a WHERE a.order_id = c.id)
        )
      ), '[]'::json)
      FROM public.commandes c
      WHERE c.company_id = v_company_id
    ),
    'parameters', (
      SELECT COALESCE(json_agg(row_to_json(param)), '[]'::json) 
      FROM public.parametres param 
      WHERE param.company_id = v_company_id
    ),
    'skuSuppliers', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json) 
      FROM public.sku_fournisseurs s 
      WHERE s.company_id = v_company_id
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. S'ASSURER QUE RLS EST ACTIVÉ SUR TOUTES LES TABLES
-- ============================================

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_fournisseurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. VÉRIFIER QUE LES TRIGGERS FONCTIONNENT
-- ============================================
-- Les triggers auto_set_company_id() doivent être en place pour assigner automatiquement
-- le company_id lors de l'insertion (déjà créés dans la migration 011)

COMMENT ON FUNCTION public.get_all_data IS 
  'Récupère toutes les données de l''entreprise de l''utilisateur actuel. 
   Retourne des données vides si l''utilisateur n''a pas de company_id.';

COMMIT;

