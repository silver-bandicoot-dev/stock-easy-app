import { useState } from 'react';

export const useEmailGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  /**
   * Génère un brouillon d'email pour une commande
   */
  const generateOrderEmailDraft = (supplierName, products, warehouse, orderQuantities, userSignature, suppliers, warehouses) => {
    console.log('🔍 Debug generateOrderEmailDraft:');
    console.log('- supplierName:', supplierName);
    console.log('- products:', products);
    console.log('- warehouse:', warehouse);
    console.log('- orderQuantities:', orderQuantities);
    console.log('- userSignature:', userSignature);
    console.log('- suppliers:', suppliers);
    console.log('- warehouses:', warehouses);
    
    if (!supplierName || !products || !warehouse) {
      console.log('❌ Missing required parameters');
      return '';
    }

    // Trouver les informations du fournisseur et de l'entrepôt
    const supplier = Array.isArray(suppliers) 
      ? suppliers.find(s => s.name === supplierName)
      : suppliers && Object.values(suppliers).find(s => s.name === supplierName);
    
    const warehouseInfo = Array.isArray(warehouses)
      ? warehouses.find(w => w.name === warehouse)
      : warehouses && Object.values(warehouses).find(w => w.name === warehouse);

    // Créer le tableau en texte pour les produits
    const orderItemsTable = products
      .filter(product => orderQuantities[product.sku] > 0)
      .map(product => {
        const quantity = orderQuantities[product.sku];
        const unitPrice = product.buyPrice || product.price || 0;
        const totalPrice = quantity * unitPrice;
        
        return `${product.name.padEnd(25)} | ${product.sku.padEnd(12)} | ${quantity.toString().padStart(8)} | ${unitPrice.toFixed(2).padStart(10)}€ | ${totalPrice.toFixed(2).padStart(10)}€`;
      }).join('\n');

    const totalAmount = products
      .filter(product => orderQuantities[product.sku] > 0)
      .reduce((sum, product) => {
        const quantity = orderQuantities[product.sku];
        const unitPrice = product.buyPrice || product.price || 0;
        return sum + (quantity * unitPrice);
      }, 0);

    // Adresse complète de l'entrepôt
    const warehouseAddress = warehouseInfo ? 
      `${warehouseInfo.address}, ${warehouseInfo.postalCode} ${warehouseInfo.city}, ${warehouseInfo.country}` : 
      warehouse;

    const emailContent = `À: ${supplier?.email || 'contact@fournisseur.com'}
Objet: Commande de réapprovisionnement - ${supplierName}

Bonjour,

Nous souhaitons passer une commande de réapprovisionnement pour les produits suivants :

Produit                   | SKU         | Quantité | Prix unitaire | Total
-------------------------|-------------|----------|---------------|----------
${orderItemsTable}
-------------------------|-------------|----------|---------------|----------
Total de la commande : ${totalAmount.toFixed(2)}€

Entrepôt de livraison : ${warehouse}
Adresse : ${warehouseAddress}

Merci de confirmer la disponibilité et les délais de livraison.

Cordialement,
${userSignature}`;

    console.log('✅ Generated email:', emailContent);
    return emailContent;
  };

  /**
   * Génère un email de réclamation
   */
  const generateReclamationEmail = (order, discrepancyItems, damagedQuantities, notes) => {
    setIsGenerating(true);
    
    try {
      const discrepancyText = discrepancyItems
        .map(item => `- ${item.name} (SKU: ${item.sku}): Reçu ${item.receivedQuantity}, Commandé ${item.orderedQuantity}`)
        .join('\n');

      const damagedText = damagedQuantities
        .map(item => `- ${item.name} (SKU: ${item.sku}): ${item.damagedQuantity} unités endommagées`)
        .join('\n');

      const emailContent = `Objet: Réclamation - Commande ${order.poNumber}

Bonjour,

Nous avons réceptionné la commande ${order.poNumber} avec les problèmes suivants :

${discrepancyText ? `Écarts de quantité :\n${discrepancyText}\n` : ''}
${damagedText ? `Produits endommagés :\n${damagedText}\n` : ''}
${notes ? `Notes : ${notes}` : ''}

Merci de nous contacter pour résoudre ces problèmes.

Cordialement,
L'équipe StockEasy`;

      return emailContent;
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Copie le texte dans le presse-papiers
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      return false;
    }
  };

  return {
    generateOrderEmailDraft,
    generateReclamationEmail,
    copyToClipboard,
    isGenerating
  };
};