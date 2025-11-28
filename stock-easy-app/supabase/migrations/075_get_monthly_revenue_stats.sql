-- ============================================
-- Migration 075: Statistiques mensuelles CA vs Objectifs
-- ============================================
-- Cette fonction retourne le CA réalisé par mois avec les objectifs
-- calculés selon le multiplicateur par défaut et le multiplicateur ML moyen.
--
-- Utilisé pour le graphique "CA vs Objectifs" dans le Dashboard.

-- ============================================
-- 1. FONCTION PRINCIPALE
-- ============================================

CREATE OR REPLACE FUNCTION public.get_monthly_revenue_stats(
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month_date DATE,
  month_label TEXT,
  actual_revenue NUMERIC,
  target_default NUMERIC,
  target_ml NUMERIC,
  default_multiplier NUMERIC,
  avg_ml_multiplier NUMERIC,
  variance_default_pct NUMERIC,
  variance_ml_pct NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
  v_default_multiplier NUMERIC;
  v_start_date DATE;
BEGIN
  -- Récupérer le company_id de l'utilisateur
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required';
  END IF;
  
  -- Récupérer le multiplicateur par défaut depuis les paramètres
  SELECT COALESCE(
    (SELECT value::NUMERIC 
     FROM public.parameters 
     WHERE company_id = v_company_id 
       AND (param_name = 'multiplicateurDefaut' OR param_name = 'MultiplicateurDefaut')
     LIMIT 1),
    1.2
  ) INTO v_default_multiplier;
  
  -- Date de début (X mois en arrière, début du mois)
  v_start_date := DATE_TRUNC('month', CURRENT_DATE - (p_months || ' months')::INTERVAL)::DATE;
  
  RETURN QUERY
  WITH 
  -- Générer la série de mois
  month_series AS (
    SELECT 
      DATE_TRUNC('month', d)::DATE AS month_start,
      TO_CHAR(d, 'Mon YYYY') AS month_label,
      EXTRACT(DAY FROM (DATE_TRUNC('month', d) + INTERVAL '1 month' - INTERVAL '1 day')) AS days_in_month
    FROM generate_series(
      v_start_date,
      DATE_TRUNC('month', CURRENT_DATE)::DATE,
      '1 month'::INTERVAL
    ) AS d
  ),
  
  -- CA réalisé par mois (depuis sales_history)
  monthly_revenue AS (
    SELECT 
      DATE_TRUNC('month', sale_date)::DATE AS month_start,
      COALESCE(SUM(revenue), 0) AS total_revenue
    FROM public.sales_history
    WHERE company_id = v_company_id
      AND sale_date >= v_start_date
    GROUP BY DATE_TRUNC('month', sale_date)::DATE
  ),
  
  -- Statistiques produits pour calcul des objectifs
  -- Calcul de la moyenne des ventes journalières et prix moyen par mois
  product_stats AS (
    SELECT 
      COALESCE(SUM(COALESCE(p.ventes_jour_moy_30j, 0) * COALESCE(p.prix_vente, 0)), 0) AS daily_revenue_potential,
      COALESCE(AVG(NULLIF(p.multiplicateur_prevision, 0)), v_default_multiplier) AS avg_ml_multiplier,
      COUNT(*) AS product_count
    FROM public.produits p
    WHERE p.company_id = v_company_id
      AND p.ventes_jour_moy_30j > 0
      AND p.prix_vente > 0
  )
  
  SELECT 
    ms.month_start AS month_date,
    ms.month_label,
    COALESCE(mr.total_revenue, 0)::NUMERIC AS actual_revenue,
    -- Objectif avec multiplicateur par défaut
    ROUND((ps.daily_revenue_potential * ms.days_in_month * v_default_multiplier), 2)::NUMERIC AS target_default,
    -- Objectif avec multiplicateur ML moyen
    ROUND((ps.daily_revenue_potential * ms.days_in_month * ps.avg_ml_multiplier), 2)::NUMERIC AS target_ml,
    v_default_multiplier AS default_multiplier,
    ROUND(ps.avg_ml_multiplier, 2)::NUMERIC AS avg_ml_multiplier,
    -- Écart en % par rapport à l'objectif défaut
    CASE 
      WHEN ps.daily_revenue_potential * ms.days_in_month * v_default_multiplier > 0 THEN
        ROUND(((COALESCE(mr.total_revenue, 0) - (ps.daily_revenue_potential * ms.days_in_month * v_default_multiplier)) 
          / (ps.daily_revenue_potential * ms.days_in_month * v_default_multiplier) * 100), 1)
      ELSE 0
    END::NUMERIC AS variance_default_pct,
    -- Écart en % par rapport à l'objectif ML
    CASE 
      WHEN ps.daily_revenue_potential * ms.days_in_month * ps.avg_ml_multiplier > 0 THEN
        ROUND(((COALESCE(mr.total_revenue, 0) - (ps.daily_revenue_potential * ms.days_in_month * ps.avg_ml_multiplier)) 
          / (ps.daily_revenue_potential * ms.days_in_month * ps.avg_ml_multiplier) * 100), 1)
      ELSE 0
    END::NUMERIC AS variance_ml_pct
  FROM month_series ms
  CROSS JOIN product_stats ps
  LEFT JOIN monthly_revenue mr ON mr.month_start = ms.month_start
  ORDER BY ms.month_start;
END;
$$;

COMMENT ON FUNCTION public.get_monthly_revenue_stats(INTEGER) IS 
'Retourne les statistiques mensuelles de CA réalisé vs objectifs (défaut et ML).
Paramètres:
  - p_months: Nombre de mois à récupérer (défaut: 12)
Retourne:
  - month_date: Date du début du mois
  - month_label: Label formaté (ex: "Jan 2025")
  - actual_revenue: CA réalisé du mois
  - target_default: Objectif avec multiplicateur par défaut
  - target_ml: Objectif avec multiplicateur ML moyen
  - default_multiplier: Valeur du multiplicateur par défaut
  - avg_ml_multiplier: Moyenne des multiplicateurs ML des produits
  - variance_default_pct: Écart en % vs objectif défaut
  - variance_ml_pct: Écart en % vs objectif ML';

-- ============================================
-- 2. FONCTION RÉSUMÉ ANNUEL
-- ============================================

CREATE OR REPLACE FUNCTION public.get_revenue_summary()
RETURNS TABLE (
  ytd_revenue NUMERIC,
  ytd_target_default NUMERIC,
  ytd_target_ml NUMERIC,
  default_accuracy_pct NUMERIC,
  ml_accuracy_pct NUMERIC,
  months_with_data INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  v_company_id := public.get_current_user_company_id();
  
  IF v_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id is required';
  END IF;
  
  RETURN QUERY
  WITH monthly_data AS (
    SELECT * FROM public.get_monthly_revenue_stats(12)
    WHERE actual_revenue > 0 OR target_default > 0
  )
  SELECT 
    COALESCE(SUM(md.actual_revenue), 0)::NUMERIC AS ytd_revenue,
    COALESCE(SUM(md.target_default), 0)::NUMERIC AS ytd_target_default,
    COALESCE(SUM(md.target_ml), 0)::NUMERIC AS ytd_target_ml,
    -- Précision = 100 - |moyenne des écarts|
    ROUND(100 - COALESCE(AVG(ABS(md.variance_default_pct)), 0), 1)::NUMERIC AS default_accuracy_pct,
    ROUND(100 - COALESCE(AVG(ABS(md.variance_ml_pct)), 0), 1)::NUMERIC AS ml_accuracy_pct,
    COUNT(*)::INTEGER AS months_with_data
  FROM monthly_data md;
END;
$$;

COMMENT ON FUNCTION public.get_revenue_summary() IS 
'Retourne un résumé des performances CA vs objectifs sur les 12 derniers mois.
Inclut la précision moyenne des multiplicateurs défaut et ML.';

-- ============================================
-- 3. PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_monthly_revenue_stats(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_summary() TO authenticated;

-- ============================================
-- FIN DE LA MIGRATION 075
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 075 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSUMÉ:';
  RAISE NOTICE '   ✅ Fonction get_monthly_revenue_stats() créée';
  RAISE NOTICE '   ✅ Fonction get_revenue_summary() créée';
  RAISE NOTICE '   ✅ Permissions accordées';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Utilisation:';
  RAISE NOTICE '   SELECT * FROM get_monthly_revenue_stats(12);';
  RAISE NOTICE '   SELECT * FROM get_revenue_summary();';
END $$;

