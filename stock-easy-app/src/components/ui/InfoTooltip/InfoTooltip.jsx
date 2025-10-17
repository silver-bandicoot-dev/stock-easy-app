import React, { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Composant InfoTooltip - Affiche une info-bulle au survol
 * @param {Object} props
 * @param {string} props.content - Contenu du tooltip
 * @returns {JSX.Element}
 */
export function InfoTooltip({ content }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="ml-1 text-[#666663] hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-black rounded"
        aria-label="Plus d'informations"
      >
        <Info className="w-4 h-4 shrink-0" />
      </button>
      {show && (
        <div className="absolute left-0 top-6 w-72 bg-black text-white text-xs rounded-lg p-3 shadow-2xl border-2 border-black z-[100]">
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-4 border-r-4 border-b-8 border-transparent border-b-black"></div>
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * Textes des tooltips prédéfinis
 */
export const tooltips = {
  toOrder: "Produits dont le stock actuel est en-dessous du point de commande. Il faut passer commande maintenant pour éviter une rupture de stock.",
  watch: "Produits dont le stock approche du point de commande (dans les 20% au-dessus). À surveiller de près pour anticiper la prochaine commande.",
  inTransit: "Commandes déjà passées auprès des fournisseurs et en cours d'acheminement. Le délai estimé est calculé selon les délais habituels du fournisseur.",
  received: "Commandes arrivées à l'entrepôt et en attente de validation. Vérifiez les quantités reçues avant de valider pour mettre à jour le stock.",
  multiplier: "Coefficient pour ajuster les prévisions selon la saisonnalité ou les événements (BFCM, soldes). 1 = normal, 0.5 = hors saison, 5 = pic majeur.",
  securityStock: "Nombre de jours de ventes supplémentaires à garder en stock pour absorber les imprévus (retards fournisseur, pics de ventes). Calculé automatiquement à 20% du délai fournisseur.",
  reorderPoint: "Niveau de stock critique qui déclenche une alerte de commande. Calculé pour couvrir les ventes pendant le délai de réapprovisionnement + stock de sécurité.",
  stockHealth: "Indicateur visuel de la santé du stock. Vert = bon niveau, Orange = surveillance nécessaire, Rouge = urgent à commander.",
  skuAvailability: "Pourcentage de produits disponibles en stock par rapport au total des SKU actifs.",
  salesLost: "Montant estimé des ventes manquées en raison d'une indisponibilité produit.",
  deepOverstock: "Valeur financière des produits dont le stock dépasse largement la demande prévue."
};

