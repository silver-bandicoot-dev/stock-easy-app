DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id
  INTO v_company_id
  FROM public.user_profiles
  WHERE id = auth.uid()
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  SELECT id
  INTO v_company_id
  FROM public.companies
  WHERE owner_id = auth.uid()
  LIMIT 1;

  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  SELECT id
  INTO v_company_id
  FROM public.companies
  ORDER BY created_at
  LIMIT 1;

  RETURN v_company_id;
END;
$$;

CREATE TABLE IF NOT EXISTS public.sales_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku text NOT NULL REFERENCES public.produits(sku) ON DELETE CASCADE,
  sale_date date NOT NULL,
  quantity numeric(12,2) NOT NULL CHECK (quantity >= 0),
  revenue numeric(14,2),
  source text DEFAULT 'manual',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_history
  ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();

CREATE INDEX IF NOT EXISTS sales_history_company_sku_date_idx
  ON public.sales_history (company_id, sku, sale_date);

ALTER TABLE public.sales_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_sales_history_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_sales_history_updated_at ON public.sales_history;
CREATE TRIGGER set_sales_history_updated_at
BEFORE UPDATE ON public.sales_history
FOR EACH ROW
EXECUTE FUNCTION public.update_sales_history_updated_at();

DROP POLICY IF EXISTS "sales_history_select_company" ON public.sales_history;
CREATE POLICY "sales_history_select_company"
ON public.sales_history
FOR SELECT
USING (company_id = public.get_current_user_company_id());

DROP POLICY IF EXISTS "sales_history_insert_company" ON public.sales_history;
CREATE POLICY "sales_history_insert_company"
ON public.sales_history
FOR INSERT
WITH CHECK (company_id = public.get_current_user_company_id());

DROP POLICY IF EXISTS "sales_history_update_company" ON public.sales_history;
CREATE POLICY "sales_history_update_company"
ON public.sales_history
FOR UPDATE USING (company_id = public.get_current_user_company_id())
WITH CHECK (company_id = public.get_current_user_company_id());

DROP POLICY IF EXISTS "sales_history_delete_company" ON public.sales_history;
CREATE POLICY "sales_history_delete_company"
ON public.sales_history
FOR DELETE
USING (company_id = public.get_current_user_company_id());

REVOKE ALL ON public.sales_history FROM public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_history TO authenticated;
GRANT SELECT ON public.sales_history TO anon;

CREATE OR REPLACE FUNCTION public.get_sales_history(
  p_company_id uuid DEFAULT NULL,
  p_sku text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL
)
RETURNS TABLE (
  sku text,
  sale_date date,
  quantity numeric,
  revenue numeric,
  details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  v_company_id := COALESCE(p_company_id, public.get_current_user_company_id());

  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required';
  END IF;

  RETURN QUERY
  SELECT
    sh.sku,
    sh.sale_date,
    SUM(sh.quantity) AS quantity,
    COALESCE(SUM(sh.revenue), 0) AS revenue,
    jsonb_agg(
      jsonb_build_object(
        'source', sh.source,
        'quantity', sh.quantity,
        'revenue', sh.revenue,
        'metadata', sh.metadata,
        'created_at', sh.created_at
      ) ORDER BY sh.created_at
    ) AS details
  FROM public.sales_history sh
  WHERE sh.company_id = v_company_id
    AND (p_sku IS NULL OR sh.sku = p_sku)
    AND (p_start_date IS NULL OR sh.sale_date >= p_start_date)
    AND (p_end_date IS NULL OR sh.sale_date <= p_end_date)
  GROUP BY sh.sku, sh.sale_date
  ORDER BY sh.sku, sh.sale_date;
END;
$$;

COMMENT ON FUNCTION public.get_sales_history(uuid, text, date, date) IS 'Retourne l''historique des ventes agrégé par jour pour une entreprise.';


