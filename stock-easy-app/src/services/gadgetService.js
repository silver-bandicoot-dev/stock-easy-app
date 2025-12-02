/**
 * Service pour communiquer avec l'API Gadget
 * Utilisé pour synchroniser les données vers Shopify
 * 
 * IMPORTANT: Produits "Untracked" dans Shopify
 * =============================================
 * Certains produits peuvent avoir `inventory_management: null` dans Shopify,
 * ce qui signifie que leur inventaire n'est PAS suivi.
 * 
 * Pour ces produits :
 * - L'API Shopify refuse les mises à jour d'inventaire
 * - Le service retournera une erreur "skipped" pour ces SKUs
 * 
 * Solution: Le marchand doit activer le suivi de l'inventaire dans Shopify Admin:
 * 1. Aller dans Products > [Produit]
 * 2. Cliquer sur "Edit" pour la variante
 * 3. Cocher "Track quantity"
 * 4. Sauvegarder
 */

// URL de l'API Gadget (à configurer dans les variables d'environnement)
const GADGET_API_URL = import.meta.env.VITE_GADGET_API_URL || 'https://stockeasy-app.gadget.app';
const GADGET_API_KEY = import.meta.env.VITE_GADGET_INTERNAL_API_KEY;

/**
 * Met à jour l'inventaire Shopify pour une liste de produits
 * @param {string} companyId - L'ID de la company
 * @param {Array<{sku: string, stock_actuel: number}>} updates - Liste des mises à jour
 * @returns {Promise<{success: boolean, processed?: number, errors?: number, skipped?: number}>}
 */
export async function updateShopifyInventory(companyId, updates) {
  if (!GADGET_API_KEY) {
    console.warn('⚠️ VITE_GADGET_INTERNAL_API_KEY non configurée - mise à jour Shopify ignorée');
    return { 
      success: false, 
      error: 'API key not configured',
      message: 'La clé API Gadget n\'est pas configurée. Configurez VITE_GADGET_INTERNAL_API_KEY.'
    };
  }

  if (!companyId || !updates || updates.length === 0) {
    return { 
      success: false, 
      error: 'Invalid parameters',
      message: 'companyId et updates sont requis'
    };
  }

  try {
    console.log('🔄 Envoi mise à jour inventaire Shopify via Gadget:', {
      companyId,
      updateCount: updates.length,
      skus: updates.map(u => u.sku)
    });

    const response = await fetch(`${GADGET_API_URL}/api/update-shopify-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`
      },
      body: JSON.stringify({
        company_id: companyId,
        updates: updates.map(u => ({
          sku: u.sku,
          stock_actuel: Math.floor(u.stock_actuel || u.newStock || 0)
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Gadget API:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        message: errorText
      };
    }

    const result = await response.json();
    console.log('✅ Résultat mise à jour Shopify:', result);
    
    return {
      success: true,
      processed: result.processed || 0,
      errors: result.errors || 0,
      skipped: result.skipped || 0
    };
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour Shopify:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erreur de connexion à l\'API Gadget'
    };
  }
}

/**
 * Vérifie si un produit est suivi dans Shopify (inventory_management = 'shopify')
 * Les produits "untracked" ne peuvent pas être mis à jour
 * @param {string} sku - Le SKU du produit
 * @returns {Promise<boolean>}
 */
export async function isProductTrackedInShopify(sku) {
  // Cette vérification devrait être faite côté Gadget
  // Pour l'instant, on retourne true et on laisse Gadget gérer les erreurs
  return true;
}

/**
 * Prépare les mises à jour de stock à partir des données de réconciliation
 * @param {Object} order - La commande réconciliée
 * @returns {Array<{sku: string, stock_actuel: number}>}
 */
export function prepareStockUpdatesFromReconciliation(order, currentProducts) {
  if (!order || !order.items) {
    return [];
  }

  const updates = [];

  order.items.forEach(item => {
    const sku = item.sku;
    const orderedQty = item.quantity || 0;
    
    // Obtenir les quantités manquantes et endommagées
    const missingQty = order.missingQuantitiesBySku?.[sku] || 0;
    const damagedQty = order.damagedQuantitiesBySku?.[sku] || 0;
    
    // Calculer la quantité reçue en bon état
    const receivedQty = Math.max(0, orderedQty - missingQty - damagedQty);
    
    if (receivedQty > 0) {
      // Trouver le stock actuel du produit
      const product = currentProducts?.find(p => p.sku === sku);
      const currentStock = product?.stock || 0;
      const newStock = currentStock + receivedQty;
      
      updates.push({
        sku,
        stock_actuel: newStock,
        previousStock: currentStock,
        addedQuantity: receivedQty
      });
    }
  });

  return updates;
}

export default {
  updateShopifyInventory,
  isProductTrackedInShopify,
  prepareStockUpdatesFromReconciliation
};

