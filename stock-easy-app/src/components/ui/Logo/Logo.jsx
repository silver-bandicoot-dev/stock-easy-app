/**
 * Logo stockeasy avec cube 3D
 * @module components/ui/Logo
 */

import React from 'react';

export function Logo({ size = 'normal', showText = true, theme = 'dark' }) {
  const dimensions = {
    small: { cube: 30, text: 'text-lg' },
    normal: { cube: 48, text: 'text-2xl' },
    large: { cube: 76, text: 'text-4xl' }
  };

  const { cube, text } = dimensions[size] || dimensions.normal;
  
  // Couleurs selon le thème
  const colors = theme === 'dark' 
    ? { text: 'text-white', stroke: 'white', separator: 'bg-white' }
    : { text: 'text-[#191919]', stroke: '#191919', separator: 'bg-[#191919]' };

  return (
    <div className="flex items-center justify-center gap-2">
      {/* Cube 3D SVG (retourné verticalement) */}
      <div style={{ width: cube, height: cube }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
          style={{ transform: 'scaleY(-1)' }}
        >
          {/* Face avant */}
          <path
            d="M50 15 L85 35 L85 65 L50 85 L15 65 L15 35 Z"
            fill="rgba(0, 0, 0, 0.8)"
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          
          {/* Face gauche (plus sombre) */}
          <path
            d="M50 15 L15 35 L15 65 L50 45 Z"
            fill="rgba(0, 0, 0, 0.6)"
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          
          {/* Face droite */}
          <path
            d="M50 15 L85 35 L85 65 L50 45 Z"
            fill="rgba(0, 0, 0, 0.9)"
            stroke={colors.stroke}
            strokeWidth="1.5"
          />
          
          {/* Arêtes internes pour effet 3D */}
          <line x1="50" y1="15" x2="50" y2="45" stroke={colors.stroke} strokeWidth="1" opacity="0.5" />
          <line x1="15" y1="35" x2="50" y2="45" stroke={colors.stroke} strokeWidth="1" opacity="0.5" />
          <line x1="85" y1="35" x2="50" y2="45" stroke={colors.stroke} strokeWidth="1" opacity="0.5" />
        </svg>
      </div>

      {/* Séparateur vertical fin */}
      {showText && (
        <>
          <div className={`w-px h-8 ${colors.separator} opacity-30`} />
          
          {/* Texte de marque */}
          <h1 className={`${text} brand-font font-bold ${colors.text} -translate-y-0.5`}>
            stockeasy
          </h1>
        </>
      )}
    </div>
  );
}

export default Logo;

