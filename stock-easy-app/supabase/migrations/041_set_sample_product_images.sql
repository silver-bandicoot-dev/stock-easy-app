-- ============================================
-- Migration 041: Définir des URLs d'image de test pour les produits
-- ============================================
-- Objectif : pré-remplir la colonne image_url afin de tester rapidement
-- l'affichage des images produits dans l'application.
-- 
-- Ici, on utilise des images publiques de placeholder (via.placeholder.com)
-- basées sur le SKU, ce qui donne une image distincte par produit sans
-- dépendre d'un stockage interne.

DO $$
BEGIN
  -- Ne pas écraser les images déjà renseignées manuellement
  UPDATE public.produits
  SET image_url = 'https://via.placeholder.com/80x80.png?text=' || sku
  WHERE image_url IS NULL
    AND sku IS NOT NULL;

  RAISE NOTICE '✅ URLs d''image de test définies pour les produits sans image_url';
END $$;

-- Fin de la migration 041


