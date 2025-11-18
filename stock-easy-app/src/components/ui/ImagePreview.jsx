import React, { useState } from 'react';
import { Modal } from './Modal';
import { generateProductImageSVG, getProductImageUrl } from '../../utils/imageUtils';

/**
 * ImagePreview
 * - Affiche une vignette cliquable
 * - Au clic, ouvre l'image en grand dans un modal
 */
export function ImagePreview({
  src,
  alt,
  thumbClassName = '',
  className = '',
  sku, // SKU du produit pour générer un fallback
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackImage, setFallbackImage] = useState(null);

  // Générer une image SVG de fallback si nécessaire
  const getImageSrc = () => {
    // Si erreur et qu'on a un fallback, l'utiliser
    if (imageError && fallbackImage) {
      console.log('ImagePreview: Utilisation du fallback après erreur', { sku, alt });
      return fallbackImage;
    }
    
    // Si pas de src mais qu'on a un sku ou alt, générer un SVG immédiatement
    if (!src || src.trim() === '') {
      if (sku || alt) {
        const svg = generateProductImageSVG(sku || alt, alt);
        // Stocker le fallback pour éviter de le régénérer
        if (!fallbackImage) {
          setFallbackImage(svg);
          console.log('ImagePreview: Génération d\'un SVG de fallback (pas de src)', { sku, alt });
        }
        return svg;
      }
      console.warn('ImagePreview: Pas de src et pas de sku/alt pour générer un fallback', { src, sku, alt });
      return null;
    }
    
    console.log('ImagePreview: Utilisation de l\'image src', { src: src.substring(0, 50) + '...', sku, alt });
    return src;
  };

  const imageSrc = getImageSrc();

  if (!imageSrc) {
    console.warn('ImagePreview: src est vide et pas de fallback possible', { alt, sku });
    return null;
  }

  const handleImageError = (e) => {
    console.error('ImagePreview: Erreur de chargement de l\'image', { src, alt, error: e });
    
    // Si pas encore de fallback, en générer un
    if (!fallbackImage && (sku || alt)) {
      const svgFallback = generateProductImageSVG(sku || alt, alt);
      setFallbackImage(svgFallback);
      console.log('ImagePreview: Utilisation d\'un fallback SVG', { sku, alt });
    }
    
    setImageError(true);
    
    // Si c'est une URL picsum.photos qui échoue, suggérer une alternative
    if (src && src.includes('picsum.photos')) {
      console.warn('ImagePreview: picsum.photos semble avoir un problème. Utilisation du fallback SVG.');
    }
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`focus:outline-none focus:ring-2 focus:ring-black rounded-md ${className}`}
      >
        {imageError ? (
          <div className={`${thumbClassName} flex items-center justify-center bg-[#E5E4DF] text-[#666663] text-xs`}>
            {alt?.charAt(0) || '?'}
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={alt}
            className={thumbClassName}
            onError={handleImageError}
            onLoad={() => {
              if (!imageError) {
                console.log('ImagePreview: Image chargée avec succès', { src: imageSrc, alt });
              }
            }}
            crossOrigin={imageSrc?.startsWith('data:') ? undefined : "anonymous"}
            referrerPolicy={imageSrc?.startsWith('data:') ? undefined : "no-referrer"}
          />
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={alt || 'Image produit'}
        size="large"
      >
        <div className="flex items-center justify-center">
          {imageError ? (
            <div className="max-h-[70vh] max-w-full rounded-lg bg-[#FAFAF7] p-8 text-center">
              <p className="text-[#666663]">Impossible de charger l'image</p>
              <p className="text-xs text-[#999] mt-2">{src}</p>
            </div>
          ) : (
            <img
              src={imageSrc}
              alt={alt}
              className="max-h-[70vh] max-w-full rounded-lg object-contain bg-[#FAFAF7]"
              onError={handleImageError}
              crossOrigin={imageSrc?.startsWith('data:') ? undefined : "anonymous"}
              referrerPolicy={imageSrc?.startsWith('data:') ? undefined : "no-referrer"}
            />
          )}
        </div>
      </Modal>
    </>
  );
}


