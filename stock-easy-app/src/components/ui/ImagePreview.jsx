import React, { useState } from 'react';
import { Modal } from './Modal';

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
}) {
  const [isOpen, setIsOpen] = useState(false);

  if (!src) {
    return null;
  }

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
        <img
          src={src}
          alt={alt}
          className={thumbClassName}
        />
      </button>

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={alt || 'Image produit'}
        size="large"
      >
        <div className="flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="max-h-[70vh] max-w-full rounded-lg object-contain bg-[#FAFAF7]"
          />
        </div>
      </Modal>
    </>
  );
}


