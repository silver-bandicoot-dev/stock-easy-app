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
  deepOverstock: "Valeur financière des produits dont le stock dépasse largement la demande prévue.",
  
  // Métriques ML
  mlPrecision: "Pourcentage de prévisions dont l'erreur est inférieure à 20%. Score de 80%+ = Excellent, 60-80% = Bon, <60% = À améliorer. Indique la fiabilité globale du modèle.",
  mlMAE: "Mean Absolute Error (Erreur Moyenne Absolue) : En moyenne, de combien d'unités le modèle se trompe par jour. Exemple : MAE = 2.5 signifie que le modèle se trompe en moyenne de 2-3 unités par jour. Plus c'est faible, mieux c'est. Bon score : <2.0",
  mlRMSE: "Root Mean Square Error (Erreur Quadratique) : Similaire au MAE mais pénalise davantage les grosses erreurs. Si RMSE >> MAE, cela signifie qu'il y a des pics d'erreur importants. Aide à détecter les anomalies. Bon score : <3.0",
  mlR2: "Coefficient de Détermination (R²) : Score de 0 à 1 mesurant si le modèle fait mieux que de dire 'la moyenne'. R² = 0.9 signifie que le modèle explique 90% de la variabilité des ventes. R² > 0.8 = Excellent, 0.5-0.8 = Bon, <0.5 = Faible. Un R² négatif signifie que le modèle est pire que la moyenne.",
  mlConfidence: "Score de confiance du modèle basé sur la variance des prévisions. Plus les prévisions sont cohérentes entre elles, plus le score est élevé. 80%+ = Haute confiance, 60-80% = Moyenne, <60% = Faible confiance.",
  mlTrend: "Tendance détectée par le modèle en comparant les prévisions du premier et dernier jour. Hausse = demande croissante (augmenter stock), Baisse = demande décroissante (risque surstock).",
  mlRecommendedOrder: "Quantité recommandée calculée selon : Demande pendant délai fournisseur + Stock de sécurité (20%) - Stock actuel. Tient compte des prévisions ML pour optimiser vos commandes."
};

