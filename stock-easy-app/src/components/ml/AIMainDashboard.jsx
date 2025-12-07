/**
 * AIMainDashboard - Dashboard Principal pour les Prévisions IA
 * 
 * Utilise ForecastDashboard pour afficher les prévisions intelligentes
 * 
 * @module components/ml/AIMainDashboard
 */

import React from 'react';
import { ForecastDashboard } from '../forecast/ForecastDashboard';

/**
 * Composant principal du dashboard IA
 * 
 * @param {Object} props
 * @param {Object} props.product - Objet produit avec id, name, etc.
 * @param {Array} props.salesHistory - Historique des ventes [{date, quantity}]
 * @param {number} props.currentStock - Stock actuel du produit
 * @param {number} props.reorderPoint - Point de réapprovisionnement
 */
function AIMainDashboard({ 
  product, 
  salesHistory, 
  currentStock, 
  reorderPoint 
}) {
  return (
    <ForecastDashboard
      product={product}
      salesHistory={salesHistory}
      currentStock={currentStock}
      reorderPoint={reorderPoint}
    />
  );
}

export default AIMainDashboard;
