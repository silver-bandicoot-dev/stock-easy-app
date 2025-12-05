/**
 * Utilitaires pour la gestion de la synchronisation bidirectionnelle
 * Évite les boucles infinies lors de la synchro Shopify ↔ Stockeasy
 */

/**
 * Fenêtre de temps (en ms) pour détecter une synchro récente
 * Si une synchro a eu lieu dans cette fenêtre, on considère que le changement
 * vient de la source opposée et on skip la synchro inverse
 */
export const SYNC_DEDUPLICATION_WINDOW_MS = 30000; // 30 secondes

/**
 * Directions de synchronisation possibles
 */
export const SyncDirection = {
  SUPABASE_TO_SHOPIFY: "supabase_to_shopify",
  SHOPIFY_TO_SUPABASE: "shopify_to_supabase",
};

/**
 * Vérifie si une synchro récente a eu lieu dans la direction opposée
 * Utilisé pour éviter les boucles infinies
 * 
 * AMÉLIORATION v2: Utilise aussi lastSyncedStockValue pour éviter les faux positifs
 * Si la valeur de stock est DIFFÉRENTE de ce qu'on a envoyé, c'est une vraie action
 * (ex: commande client) et on doit synchroniser même si c'est dans la fenêtre de temps.
 * 
 * @param {object} mapping - Le record productMapping
 * @param {string} currentDirection - La direction actuelle (supabase_to_shopify ou shopify_to_supabase)
 * @param {number|null} incomingStockValue - La valeur de stock entrante (optionnel, pour éviter faux positifs)
 * @returns {{shouldSkip: boolean, reason: string, timeSinceLastSync: number|null}}
 */
export const shouldSkipSync = (mapping, currentDirection, incomingStockValue = null) => {
  if (!mapping) {
    return { shouldSkip: false, reason: "no_mapping", timeSinceLastSync: null };
  }
  
  if (!mapping.lastSyncedAt || !mapping.lastSyncDirection) {
    return { shouldSkip: false, reason: "no_previous_sync", timeSinceLastSync: null };
  }
  
  const timeSinceLastSync = Date.now() - new Date(mapping.lastSyncedAt).getTime();
  const isWithinWindow = timeSinceLastSync < SYNC_DEDUPLICATION_WINDOW_MS;
  
  // Si la dernière synchro était dans la direction opposée ET récente, on vérifie plus en détail
  if (currentDirection === SyncDirection.SHOPIFY_TO_SUPABASE) {
    // On veut synchroniser vers Supabase (webhook Shopify reçu)
    // Si la dernière synchro était de Supabase vers Shopify et récente...
    if (mapping.lastSyncDirection === SyncDirection.SUPABASE_TO_SHOPIFY && isWithinWindow) {
      // AMÉLIORATION: Si la valeur de stock est DIFFÉRENTE de ce qu'on a envoyé,
      // c'est probablement une vraie action (commande, ajustement manuel) → on synchronise
      if (incomingStockValue !== null && mapping.lastSyncedStockValue !== null) {
        if (Number(incomingStockValue) !== Number(mapping.lastSyncedStockValue)) {
          return { 
            shouldSkip: false, 
            reason: "stock_value_changed_real_action", 
            timeSinceLastSync,
            expectedStock: mapping.lastSyncedStockValue,
            actualStock: incomingStockValue
          };
        }
      }
      // Même valeur de stock → c'est le webhook de réponse à notre sync → SKIP
      return { 
        shouldSkip: true, 
        reason: "recent_supabase_to_shopify_sync_same_value", 
        timeSinceLastSync 
      };
    }
  }
  
  if (currentDirection === SyncDirection.SUPABASE_TO_SHOPIFY) {
    // On veut synchroniser vers Shopify (webhook Supabase reçu)
    // Si la dernière synchro était de Shopify vers Supabase et récente...
    if (mapping.lastSyncDirection === SyncDirection.SHOPIFY_TO_SUPABASE && isWithinWindow) {
      // AMÉLIORATION: Si la valeur de stock est DIFFÉRENTE de ce qu'on a envoyé,
      // c'est probablement une vraie action → on synchronise
      if (incomingStockValue !== null && mapping.lastSyncedStockValue !== null) {
        if (Number(incomingStockValue) !== Number(mapping.lastSyncedStockValue)) {
          return { 
            shouldSkip: false, 
            reason: "stock_value_changed_real_action", 
            timeSinceLastSync,
            expectedStock: mapping.lastSyncedStockValue,
            actualStock: incomingStockValue
          };
        }
      }
      // Même valeur de stock → c'est le webhook de réponse à notre sync → SKIP
      return { 
        shouldSkip: true, 
        reason: "recent_shopify_to_supabase_sync_same_value", 
        timeSinceLastSync 
      };
    }
  }
  
  return { shouldSkip: false, reason: "sync_allowed", timeSinceLastSync };
};

/**
 * Met à jour les métadonnées de synchro sur un productMapping
 * 
 * @param {object} api - L'API Gadget
 * @param {string} mappingId - L'ID du productMapping
 * @param {string} direction - La direction de synchro
 * @param {number|null} stockValue - La valeur de stock qu'on synchronise (pour éviter faux positifs)
 * @returns {Promise<void>}
 */
export const updateSyncMetadata = async (api, mappingId, direction, stockValue = null) => {
  const updateData = {
    lastSyncDirection: direction,
    lastSyncedAt: new Date(),
  };
  
  // Stocker la valeur de stock pour pouvoir détecter les vraies actions vs nos syncs
  if (stockValue !== null) {
    updateData.lastSyncedStockValue = Math.floor(Number(stockValue));
  }
  
  await api.productMapping.update(mappingId, updateData);
};

/**
 * Crée un log de décision de synchro pour le debugging
 * 
 * @param {object} logger - Le logger Gadget
 * @param {object} options - Options du log
 */
export const logSyncDecision = (logger, options) => {
  const {
    action,
    sku,
    shopId,
    direction,
    decision,
    reason,
    timeSinceLastSync,
    lastSyncDirection,
    inventoryItemId,
    newStock,
    oldStock,
  } = options;
  
  const logData = {
    action: action || "inventory_sync_decision",
    sku,
    shopId,
    requestedDirection: direction,
    decision, // 'proceed' ou 'skip'
    reason,
    lastSyncDirection,
    timeSinceLastSyncMs: timeSinceLastSync,
    timestamp: new Date().toISOString(),
  };
  
  if (inventoryItemId) logData.inventoryItemId = inventoryItemId;
  if (newStock !== undefined) logData.newStock = newStock;
  if (oldStock !== undefined) logData.oldStock = oldStock;
  
  if (decision === 'skip') {
    logger.info(logData, `🔄 SYNC SKIPPED: ${reason}`);
  } else {
    logger.info(logData, `✅ SYNC PROCEEDING: ${reason}`);
  }
};

/**
 * Vérifie si les valeurs de stock sont identiques (évite updates inutiles)
 * 
 * @param {number} currentStock - Stock actuel
 * @param {number} newStock - Nouveau stock proposé
 * @returns {boolean} - true si les stocks sont identiques
 */
export const stockValuesAreEqual = (currentStock, newStock) => {
  // Gérer les cas null/undefined
  if (currentStock == null && newStock == null) return true;
  if (currentStock == null || newStock == null) return false;
  
  // Comparer en tant que nombres
  return Number(currentStock) === Number(newStock);
};
