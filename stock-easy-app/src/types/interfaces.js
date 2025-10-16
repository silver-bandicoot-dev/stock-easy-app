/**
 * @typedef {Object} Supplier
 * @property {string} name - Nom du fournisseur
 * @property {string} email - Email du fournisseur
 * @property {number} leadTimeDays - Délai de livraison en jours (PAS "delay")
 * @property {number} moq - Quantité minimum de commande
 * @property {string} notes - Notes
 */

/**
 * @typedef {Object} Product
 * @property {string} sku - SKU du produit
 * @property {string} name - Nom du produit
 * @property {number} stock - Stock actuel
 * @property {number} sales30d - Ventes sur 30 jours
 * @property {number} salesPerDay - Ventes par jour
 * @property {number} multiplier - Multiplicateur de sécurité
 * @property {number|null} customSecurityStock - Stock de sécurité personnalisé
 * @property {number} adjustedSales - Ventes ajustées
 * @property {string} supplier - Nom du fournisseur
 * @property {number} leadTimeDays - Délai de livraison en jours (PAS "delay")
 * @property {number} moq - Quantité minimum de commande
 * @property {number} buyPrice - Prix d'achat
 * @property {number} sellPrice - Prix de vente
 * @property {number} margin - Marge
 * @property {number} securityStock - Stock de sécurité
 * @property {number} reorderPoint - Point de réapprovisionnement
 * @property {number} qtyToOrder - Quantité à commander
 * @property {string} status - Statut du produit
 * @property {number} investment - Investissement
 * @property {number} potentialRevenue - Revenu potentiel
 * @property {number} grossMargin - Marge brute
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} sku - SKU du produit
 * @property {number} quantity - Quantité commandée
 * @property {number} pricePerUnit - Prix unitaire
 * @property {number|null} receivedQuantity - Quantité reçue
 * @property {'none'|'missing'|'damaged'|'excess'} discrepancyType - Type d'écart (NOUVEAU)
 * @property {string} discrepancyNotes - Notes sur l'écart (NOUVEAU)
 */

/**
 * @typedef {Object} Order
 * @property {string} id - ID de la commande
 * @property {string} supplier - Nom du fournisseur
 * @property {string} status - Statut de la commande
 * @property {number} total - Montant total
 * @property {string} createdAt - Date de création
 * @property {string|null} eta - Date estimée de livraison
 * @property {string|null} confirmedAt - Date de confirmation (NOUVEAU)
 * @property {string|null} shippedAt - Date d'expédition
 * @property {string|null} receivedAt - Date de réception
 * @property {string|null} completedAt - Date de complétion
 * @property {string} trackingNumber - Numéro de suivi
 * @property {boolean} hasDiscrepancy - Présence d'écarts
 * @property {boolean} damageReport - Rapport de dommages (NOUVEAU)
 * @property {string} notes - Notes
 * @property {OrderItem[]} items - Liste des articles
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Succès de la requête
 * @property {string} [error] - Message d'erreur si échec
 * @property {*} [data] - Données retournées
 */

/**
 * @typedef {Object} AllData
 * @property {Product[]} products - Liste des produits
 * @property {Supplier[]} suppliers - Liste des fournisseurs
 * @property {Order[]} orders - Liste des commandes
 */

export {};
