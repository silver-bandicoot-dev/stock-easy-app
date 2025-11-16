-- ============================================
-- Migration 042: Affecter des images "réelles" aux produits
-- ============================================
-- Objectif : utiliser un service d'images publiques pour donner
-- à chaque produit une vraie photo (aléatoire mais réaliste),
-- afin de tester le rendu dans l'application.
--
-- Ici on utilise picsum.photos : chaque SKU génère une image unique,
-- stable dans le temps, sans nécessiter de stockage interne.

DO $$
BEGIN
  -- Mettre à jour les produits qui n'ont pas encore d'image
  -- ou qui utilisent encore le placeholder précédent
  UPDATE public.produits
  SET image_url = 'https://picsum.photos/seed/' || encode(digest(sku, 'sha256'), 'hex') || '/400/400'
  WHERE sku IS NOT NULL
    AND (
      image_url IS NULL
      OR image_url LIKE 'https://via.placeholder.com/%'
    );

  RAISE NOTICE '✅ Images réalistes assignées à tous les produits (via picsum.photos)';
END $$;

-- Fin de la migration 042


