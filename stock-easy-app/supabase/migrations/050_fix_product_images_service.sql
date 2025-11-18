-- ============================================
-- Migration 050: Correction du service d'images produits
-- ============================================
-- Objectif: Remplacer picsum.photos (qui retourne des erreurs 500) par un service plus fiable
--           Utiliser placeholder.com qui est plus stable, ou unsplash source

-- Solution: Utiliser placeholder.com qui est fiable et gratuit
-- Format: https://via.placeholder.com/400x400/COLOR_BG/COLOR_TEXT?text=TEXT
-- Nous utilisons un hash du SKU pour générer des couleurs uniques par produit

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Mettre à jour les images picsum.photos vers placeholder.com
  -- Générer une couleur de fond basée sur le hash du SKU pour avoir des images variées
  UPDATE public.produits
  SET image_url = 'https://via.placeholder.com/400x400/' || 
      -- Couleur de fond (hex sans #) basée sur le hash du SKU
      substr(encode(digest(sku, 'sha256'), 'hex'), 1, 6) || '/' ||
      -- Couleur de texte (contraste) basée sur une autre partie du hash
      substr(encode(digest(sku || 'text', 'sha256'), 'hex'), 1, 6) ||
      '?text=' || encode(sku::bytea, 'base64')
  WHERE sku IS NOT NULL
    AND (
      image_url LIKE 'https://picsum.photos/%'
      OR image_url IS NULL
      OR image_url = ''
    );

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RAISE NOTICE '✅ Images produits mises à jour vers placeholder.com';
  RAISE NOTICE '   Nombre de produits mis à jour: %', v_count;
  
  -- Vérifier qu'il reste des produits sans image
  SELECT COUNT(*) INTO v_count
  FROM public.produits
  WHERE image_url IS NULL OR image_url = '';
  
  IF v_count > 0 THEN
    RAISE NOTICE '⚠️  Il reste % produits sans image_url', v_count;
  END IF;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 050
-- ============================================

