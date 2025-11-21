-- ============================================
-- Migration 055: Ajout des KPIs Supplémentaires à kpi_history
-- ============================================
-- Cette migration ajoute les colonnes pour stocker les KPIs supplémentaires
-- dans l'historique afin d'avoir des comparaisons réelles au lieu de valeurs simulées

DO $$
BEGIN
  -- Mapping Produits ↔ Fournisseurs (pourcentage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'mapping_percentage'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN mapping_percentage NUMERIC(5,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne mapping_percentage ajoutée';
  END IF;

  -- Total Produits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'total_products'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN total_products INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne total_products ajoutée';
  END IF;

  -- En Bonne Santé (pourcentage)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'healthy_percentage'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN healthy_percentage NUMERIC(5,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne healthy_percentage ajoutée';
  END IF;

  -- Marge Brute Totale
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'total_gross_margin'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN total_gross_margin NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne total_gross_margin ajoutée';
  END IF;

  -- Revenu Potentiel (ML)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'total_potential_revenue'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN total_potential_revenue NUMERIC(12,2) DEFAULT 0;
    RAISE NOTICE '✅ Colonne total_potential_revenue ajoutée';
  END IF;

  -- Rotation Rapide (nombre de produits)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kpi_history' AND column_name = 'fast_rotating_products'
  ) THEN
    ALTER TABLE public.kpi_history ADD COLUMN fast_rotating_products INTEGER DEFAULT 0;
    RAISE NOTICE '✅ Colonne fast_rotating_products ajoutée';
  END IF;

  RAISE NOTICE '✅ Migration 055 terminée : Toutes les colonnes KPIs supplémentaires ont été ajoutées';
END $$;




