-- ============================================
-- Migration 066: Rendre les colonnes de métadonnées company optionnelles
-- ============================================
-- Objectif : Permettre la création de companies Shopify sans ces métadonnées
--            qui ne sont pas disponibles lors de l'installation d'une app Shopify
--
-- Problème : La fonction create_company_for_user() échoue car elle essaie
--            d'insérer des valeurs NULL dans des colonnes avec NOT NULL
--
-- Solution : Rendre ces colonnes optionnelles (permettre NULL)
-- ============================================

BEGIN;

-- Rendre les colonnes optionnelles
ALTER TABLE public.companies
  ALTER COLUMN employee_count_range DROP NOT NULL,
  ALTER COLUMN average_revenue_range DROP NOT NULL,
  ALTER COLUMN average_sku_range DROP NOT NULL;

-- Ajouter des commentaires pour clarifier
COMMENT ON COLUMN public.companies.employee_count_range IS 
'Plage du nombre d''employés. Optionnel, peut être NULL pour les installations Shopify.';

COMMENT ON COLUMN public.companies.average_revenue_range IS 
'Plage de revenus moyens. Optionnel, peut être NULL pour les installations Shopify.';

COMMENT ON COLUMN public.companies.average_sku_range IS 
'Plage du nombre moyen de SKU. Optionnel, peut être NULL pour les installations Shopify.';

COMMIT;

-- ============================================
-- Vérification (à exécuter manuellement dans Supabase si besoin)
-- ============================================
-- 
-- SELECT 
--   column_name,
--   is_nullable,
--   data_type
-- FROM information_schema.columns
-- WHERE table_name = 'companies' 
--   AND table_schema = 'public'
--   AND column_name IN ('employee_count_range', 'average_revenue_range', 'average_sku_range');
--
-- Résultat attendu : Les 3 colonnes doivent avoir is_nullable = 'YES'
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 066: Colonnes de métadonnées company rendues optionnelles';
  RAISE NOTICE '📝 employee_count_range, average_revenue_range, average_sku_range acceptent maintenant NULL';
  RAISE NOTICE '📝 La fonction create_company_for_user() peut maintenant créer des companies Shopify sans ces métadonnées';
END $$;








