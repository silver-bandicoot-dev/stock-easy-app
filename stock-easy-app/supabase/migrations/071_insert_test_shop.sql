-- ============================================
-- Migration 071: Insérer le Shop de Test
-- ============================================
-- Objectif : Enregistrer stockeasy-devstore.myshopify.com pour les tests Gadget

DO $$
BEGIN
  -- Appel de la fonction qu'on a créée précédemment
  -- Elle gère déjà la détection de doublons (rien ne se passe si existe déjà)
  PERFORM public.create_shopify_company(
    'stockeasy-devstore.myshopify.com', -- shopify_shop_id (clé de liaison Gadget)
    'StockEasy Dev Store',              -- Nom affiché
    'stockeasy-devstore.myshopify.com'  -- Domaine
  );
  
  RAISE NOTICE '✅ Shop de test inséré/vérifié avec succès';
END $$;




























