import React from 'react';

/**
 * Composant HealthBar - Barre de progression visuelle pour la santé du stock
 * @param {Object} props
 * @param {number} props.percentage - Pourcentage de remplissage (0-100)
 * @param {'healthy'|'warning'|'urgent'} props.status - Statut de santé
 * @returns {JSX.Element}
 */
export function HealthBar({ percentage, status }) {
  const colors = {
    healthy: 'bg-green-600',
    warning: 'bg-orange-500',
    urgent: 'bg-red-600'
  };
  
  return (
    <div className="w-full bg-[#E5E4DF] rounded-full h-3 overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-300 ${colors[status]}`}
        style={{ width: `${Math.max(5, Math.min(percentage, 100))}%` }}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
}

