import { useCurrency } from '../contexts/CurrencyContext';

export const useEmailGeneration = () => {
  const { format: formatCurrency } = useCurrency();

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
        const formattedUnitPrice = formatCurrency(unitPrice).padStart(15);
        const formattedTotalPrice = formatCurrency(totalPrice).padStart(15);
        
        return `${product.name.padEnd(25)} | ${product.sku.padEnd(12)} | ${quantity.toString().padStart(8)} | ${formattedUnitPrice} | ${formattedTotalPrice}`;
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
Total de la commande : ${formatCurrency(totalAmount)}

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
  const generateReclamationEmail = (order, receivedItems, damagedQuantities, notes, allProducts = []) => {
    // Traiter receivedItems comme un objet {sku: {received, ordered, notes}}
    const discrepancyText = Object.entries(receivedItems || {})
      .map(([sku, data]) => {
        const product = Array.isArray(allProducts) ? allProducts.find(p => p.sku === sku) : null;
        const productName = product?.name || sku;
        const received = data.received || data || 0;
        const ordered = order.items?.find(item => item.sku === sku)?.quantity || 0;
        return `- ${productName} (SKU: ${sku}): Reçu ${received}, Commandé ${ordered}`;
      })
      .join('\n');

    // Traiter damagedQuantities comme un objet {sku: quantity}
    const damagedText = Object.entries(damagedQuantities || {})
      .filter(([sku, quantity]) => quantity > 0)
      .map(([sku, quantity]) => {
        const product = Array.isArray(allProducts) ? allProducts.find(p => p.sku === sku) : null;
        const productName = product?.name || sku;
        return `- ${productName} (SKU: ${sku}): ${quantity} unités endommagées`;
      })
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
    copyToClipboard
  };
};