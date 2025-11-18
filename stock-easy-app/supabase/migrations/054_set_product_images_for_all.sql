-- ============================================
-- Migration 054: Assigner des URLs d'images à tous les produits
-- ============================================
-- Objectif: Assigner une URL d'image unique à chaque produit dans la table produits
--           Utilise un service d'images fiable avec des couleurs uniques basées sur le SKU

DO $$
DECLARE
  v_count INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- Mettre à jour tous les produits qui n'ont pas d'image_url
  -- ou qui ont une URL picsum.photos (qui ne fonctionne plus)
  -- Utiliser des images SVG encodées en base64 (data URI) - solution fiable et locale
  UPDATE public.produits
  SET image_url = 
    -- Générer une URL data URI avec un SVG encodé en base64
    'data:image/svg+xml;base64,' || encode(
      ('<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">' ||
       '<rect width="100%" height="100%" fill="#' || substr(encode(digest(sku, 'sha256'), 'hex'), 1, 6) || '"/>' ||
       '<text x="50%" y="50%" font-family="Arial, sans-serif" font-size="48" font-weight="bold" ' ||
       'fill="#' || substr(encode(digest(sku || 'text', 'sha256'), 'hex'), 1, 6) || '" ' ||
       'text-anchor="middle" dominant-baseline="middle">' ||
       COALESCE(LEFT(nom_produit, 10), LEFT(sku, 10)) ||
       '</text></svg>')::bytea,
      'base64'
    )
  WHERE sku IS NOT NULL
    AND (
      image_url IS NULL 
      OR image_url = ''
      OR image_url LIKE 'https://picsum.photos/%'
      OR image_url LIKE 'https://source.unsplash.com/%'
      OR image_url LIKE 'https://via.placeholder.com/%'
      OR image_url LIKE 'https://placehold.co/%'
      OR image_url LIKE 'https://dummyimage.com/%'
    );

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Compter le total de produits
  SELECT COUNT(*) INTO v_count FROM public.produits WHERE sku IS NOT NULL;
  
  -- Compter les produits avec image_url
  SELECT COUNT(*) INTO v_count 
  FROM public.produits 
  WHERE sku IS NOT NULL 
    AND image_url IS NOT NULL 
    AND image_url != '';
  
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 054 terminée avec succès!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 RÉSULTATS:';
  RAISE NOTICE '   - Produits mis à jour : %', v_updated_count;
  RAISE NOTICE '   - Total de produits avec images : %', v_count;
  RAISE NOTICE '';
  RAISE NOTICE '🎨 Format des images:';
  RAISE NOTICE '   - Type: SVG encodé en base64 (data URI)';
  RAISE NOTICE '   - Taille: 400x400 pixels';
  RAISE NOTICE '   - Couleurs: Uniques par SKU (basées sur hash SHA256)';
  RAISE NOTICE '   - Texte: 10 premiers caractères du nom du produit ou SKU';
  RAISE NOTICE '   - Avantage: Fonctionne sans dépendance externe, toujours disponible';
  RAISE NOTICE '';
END $$;

-- Vérification: Afficher quelques exemples d'URLs générées
DO $$
DECLARE
  v_example RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📸 Exemples d''URLs d''images générées:';
  RAISE NOTICE '';
  
  FOR v_example IN 
    SELECT sku, nom_produit, image_url
    FROM public.produits 
    WHERE image_url IS NOT NULL 
      AND image_url != ''
      AND image_url LIKE 'data:image/svg+xml;base64,%'
    ORDER BY sku
    LIMIT 5
  LOOP
    RAISE NOTICE '   SKU: % | Produit: %', v_example.sku, COALESCE(v_example.nom_produit, 'N/A');
    RAISE NOTICE '   URL: data:image/svg+xml;base64:[...% caractères]', length(v_example.image_url);
    RAISE NOTICE '';
  END LOOP;
END $$;

-- ============================================
-- FIN DE LA MIGRATION 054
-- ============================================

