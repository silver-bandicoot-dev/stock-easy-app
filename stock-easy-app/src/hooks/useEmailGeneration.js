import { useState } from 'react';
import { toast } from 'sonner';

/**
 * Hook pour la génération d'emails (commandes et réclamations)
 */
export const useEmailGeneration = (suppliers, warehouses, products) => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Génère un brouillon d'email de commande
   * @param {string} supplierName - Nom du fournisseur
   * @param {Array} products - Produits à commander
   * @param {string} warehouse - Entrepôt de destination
   * @param {Object} orderQuantities - Quantités commandées
   * @param {string} userSignature - Signature de l'utilisateur
   * @returns {string} - Contenu de l'email
   */
  const generateOrderEmailDraft = (supplierName, products, warehouse, orderQuantities, userSignature) => {
    if (!supplierName || !products || !warehouse) {
      return '';
    }

    const supplier = suppliers.find(s => s.name === supplierName);
    const warehouseInfo = warehouses.find(w => w.name === warehouse);
    
    const orderItems = products
      .filter(product => orderQuantities[product.sku] > 0)
      .map(product => {
        const quantity = orderQuantities[product.sku];
        const unitPrice = product.supplierPrice || product.price || 0;
        const totalPrice = quantity * unitPrice;
        
        return {
          sku: product.sku,
          name: product.name,
          quantity,
          unitPrice,
          totalPrice
        };
      });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
    const poNumber = `PO-${Date.now()}`;

    const emailContent = `
Objet: Commande ${poNumber} - ${supplierName}

Bonjour,

Je vous contacte pour passer une nouvelle commande pour notre entrepôt ${warehouse}.

Détails de la commande:
- Numéro de commande: ${poNumber}
- Entrepôt de livraison: ${warehouse}
${warehouseInfo ? `- Adresse: ${warehouseInfo.address}, ${warehouseInfo.city} ${warehouseInfo.postalCode}` : ''}

Articles commandés:
${orderItems.map(item => 
  `- ${item.sku} - ${item.name}: ${item.quantity} unités (${item.unitPrice.toFixed(2)}€/unité) = ${item.totalPrice.toFixed(2)}€`
).join('\n')}

Total de la commande: ${totalAmount.toFixed(2)}€

Pourriez-vous confirmer la réception de cette commande et me donner un délai de livraison estimé?

Merci pour votre collaboration.

Cordialement,
${userSignature}
    `.trim();

    return emailContent;
  };

  /**
   * Génère un email de réclamation
   * @param {Object} order - Commande concernée
   * @param {Object} discrepancies - Écarts constatés
   * @param {Object} damages - Articles endommagés
   * @param {string} userSignature - Signature de l'utilisateur
   * @returns {string} - Contenu de l'email de réclamation
   */
  const generateReclamationEmail = (order, discrepancies = {}, damages = {}, userSignature) => {
    if (!order) {
      return '';
    }

    const discrepancyItems = Object.entries(discrepancies).filter(([_, qty]) => qty !== 0);
    const damageItems = Object.entries(damages).filter(([_, qty]) => qty > 0);

    if (discrepancyItems.length === 0 && damageItems.length === 0) {
      return '';
    }

    const emailContent = `
Objet: Réclamation - Commande ${order.poNumber || order.id}

Bonjour,

Je vous contacte concernant la livraison de la commande ${order.poNumber || order.id} reçue le ${new Date().toLocaleDateString('fr-FR')}.

Nous avons constaté les écarts suivants lors de la réception:

${discrepancyItems.length > 0 ? `
ÉCARTS DE QUANTITÉ:
${discrepancyItems.map(([sku, qty]) => 
  `- ${sku}: ${qty > 0 ? `+${qty}` : qty} unités`
).join('\n')}
` : ''}

${damageItems.length > 0 ? `
ARTICLES ENDOMMAGÉS:
${damageItems.map(([sku, qty]) => 
  `- ${sku}: ${qty} unités endommagées`
).join('\n')}
` : ''}

Pourriez-vous nous contacter dans les plus brefs délais pour organiser le retour ou le remplacement de ces articles?

Nous restons à votre disposition pour tout complément d'information.

Cordialement,
${userSignature}
    `.trim();

    return emailContent;
  };

  /**
   * Copie le contenu dans le presse-papiers
   * @param {string} content - Contenu à copier
   */
  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Email copié dans le presse-papiers');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      toast.error('Erreur lors de la copie dans le presse-papiers');
    }
  };

  /**
   * Génère un email de confirmation de réception
   * @param {Object} order - Commande reçue
   * @param {Object} receivedItems - Articles reçus
   * @param {string} userSignature - Signature de l'utilisateur
   * @returns {string} - Contenu de l'email de confirmation
   */
  const generateReceiptConfirmationEmail = (order, receivedItems, userSignature) => {
    if (!order || !receivedItems) {
      return '';
    }

    const receivedItemsList = Object.entries(receivedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([sku, qty]) => {
        const product = products.find(p => p.sku === sku);
        return `- ${sku} - ${product?.name || 'Produit inconnu'}: ${qty} unités`;
      });

    const emailContent = `
Objet: Confirmation de réception - Commande ${order.poNumber || order.id}

Bonjour,

Je vous confirme la réception de la commande ${order.poNumber || order.id} le ${new Date().toLocaleDateString('fr-FR')}.

Articles reçus:
${receivedItemsList.join('\n')}

La livraison s'est bien déroulée et tous les articles sont conformes à notre commande.

Merci pour votre service.

Cordialement,
${userSignature}
    `.trim();

    return emailContent;
  };

  return {
    isGenerating,
    generateOrderEmailDraft,
    generateReclamationEmail,
    generateReceiptConfirmationEmail,
    copyToClipboard
  };
};
