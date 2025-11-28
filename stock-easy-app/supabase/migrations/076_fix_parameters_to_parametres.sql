-- ============================================
-- Migration 076: Correction référence table parametres
-- ============================================
-- Cette migration corrige une erreur dans la migration 075 où 
-- la table était référencée comme "parameters" (anglais) au lieu de "parametres" (français)

-- ============================================
-- 1. CORRIGER LA FONCTION get_monthly_revenue_stats
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
  -- CORRECTION: utiliser "parametres" (français) au lieu de "parameters" (anglais)
  SELECT COALESCE(
    (SELECT value::NUMERIC 
     FROM public.parametres 
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
[Migration 076] - Corrigé pour utiliser la table "parametres" au lieu de "parameters".
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
-- FIN DE LA MIGRATION 076
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 076 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CORRECTION APPLIQUÉE:';
  RAISE NOTICE '   ✅ get_monthly_revenue_stats() corrigée';
  RAISE NOTICE '   ✅ Référence "parameters" → "parametres" corrigée';
  RAISE NOTICE '';
END $$;

