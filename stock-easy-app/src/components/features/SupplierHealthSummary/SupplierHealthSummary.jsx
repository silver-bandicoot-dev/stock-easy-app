import React from 'react';

/**
 * SupplierHealthSummary - Affiche un résumé de la santé des produits d'un fournisseur
 * @param {Object} props
 * @param {number} props.urgentCount - Nombre de produits urgents
 * @param {number} props.warningCount - Nombre de produits à surveiller
 * @param {number} props.healthyCount - Nombre de produits en bonne santé
 * @param {number} props.totalProducts - Total des produits
 * @returns {JSX.Element}
 */
export function SupplierHealthSummary({ urgentCount, warningCount, healthyCount, totalProducts }) {
  return (
    <div className="flex items-center gap-4 mb-4 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
      {/* Urgent */}
      {urgentCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600"></div>
          <span className="text-sm font-semibold text-[#191919]">{urgentCount}</span>
          <span className="text-xs text-[#666663]">urgent{urgentCount > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Warning */}
      {warningCount > 0 && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span className="text-sm font-semibold text-[#191919]">{warningCount}</span>
          <span className="text-xs text-[#666663]">à surveiller</span>
        </div>
      )}
      
      {/* Healthy */}
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-green-600"></div>
        <span className="text-sm font-semibold text-[#191919]">{healthyCount}</span>
        <span className="text-xs text-[#666663]">en bonne santé</span>
      </div>
      
      {/* Total */}
      <div className="ml-auto text-sm text-[#666663]">
        Total: <span className="font-semibold text-[#191919]">{totalProducts}</span> produit{totalProducts > 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default SupplierHealthSummary;

