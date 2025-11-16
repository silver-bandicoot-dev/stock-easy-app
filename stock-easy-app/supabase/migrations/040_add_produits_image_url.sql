-- ============================================
-- Migration 040: Ajout de la colonne image_url sur public.produits
-- ============================================
-- Objectif : permettre d'associer une image principale à chaque produit
-- afin de l'afficher rapidement dans l'application (vue liste, tableaux, etc.).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'produits'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.produits
      ADD COLUMN image_url TEXT DEFAULT NULL;

    RAISE NOTICE '✅ Colonne image_url ajoutée à public.produits';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne image_url déjà présente sur public.produits, aucune modification appliquée';
  END IF;
END $$;

-- Fin de la migration 040


