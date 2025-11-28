/**
 * Service unifié de génération d'emails
 * Centralise toute la logique de création d'emails pour l'application
 */

// ============================================
// VALIDATION & HELPERS
// ============================================

/**
 * Valide une adresse email
 * @param {string} email - L'adresse email à valider
 * @returns {boolean} True si l'email est valide
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Nettoie et formate une adresse email
 * @param {string} email - L'adresse email
 * @returns {string} L'email nettoyé ou chaîne vide
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Extrait le prénom d'un nom complet
 * @param {string} fullName - Le nom complet
 * @returns {string} Le prénom ou chaîne vide
 */
export const getFirstName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') return '';
  return fullName.trim().split(' ')[0];
};

/**
 * Génère une ligne de salutation personnalisée
 * @param {string} contactName - Le nom du contact
 * @returns {string} La ligne de salutation
 */
export const getGreeting = (contactName) => {
  const firstName = getFirstName(contactName);
  return firstName ? `Bonjour ${firstName},` : 'Bonjour,';
};

/**
 * Formate un prix avec devise
 * @param {number} amount - Le montant
 * @param {Function} formatFn - Fonction de formatage de devise
 * @returns {string} Le prix formaté
 */
const formatPrice = (amount, formatFn) => {
  if (typeof formatFn === 'function') {
    return formatFn(amount);
  }
  return `${amount.toFixed(2)} €`;
};

// ============================================
// FORMATAGE TABLEAU PRODUITS
// ============================================

/**
 * Crée un tableau de produits formaté pour email texte
 * @param {Array} products - Liste des produits
 * @param {Object} quantities - Quantités par SKU
 * @param {Function} formatCurrency - Fonction de formatage devise
 * @returns {Object} { table: string, total: number }
 */
export const formatProductTable = (products, quantities, formatCurrency) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return { table: 'Aucun produit', total: 0 };
  }

  const filteredProducts = products.filter(p => {
    const qty = quantities?.[p.sku] || p.qtyToOrder || 0;
    return qty > 0;
  });

  if (filteredProducts.length === 0) {
    return { table: 'Aucun produit sélectionné', total: 0 };
  }

  // Calculer les largeurs dynamiques basées sur le contenu
  const maxNameLength = Math.min(
    Math.max(...filteredProducts.map(p => (p.name || '').length), 10),
    35
  );

  // En-tête du tableau
  const header = [
    'Produit'.padEnd(maxNameLength),
    'SKU'.padEnd(15),
    'Qté'.padStart(6),
    'P.U.'.padStart(12),
    'Total'.padStart(12)
  ].join(' │ ');

  const separator = '─'.repeat(header.length);

  // Lignes de produits
  let grandTotal = 0;
  const rows = filteredProducts.map(product => {
    const name = (product.name || 'Sans nom').substring(0, maxNameLength);
    const sku = (product.sku || '').substring(0, 15);
    const quantity = quantities?.[product.sku] || product.qtyToOrder || 0;
    const unitPrice = product.buyPrice || product.supplierPrice || product.price || 0;
    const lineTotal = quantity * unitPrice;
    grandTotal += lineTotal;

    return [
      name.padEnd(maxNameLength),
      sku.padEnd(15),
      quantity.toString().padStart(6),
      formatPrice(unitPrice, formatCurrency).padStart(12),
      formatPrice(lineTotal, formatCurrency).padStart(12)
    ].join(' │ ');
  });

  // Ligne de total
  const totalRow = [
    'TOTAL'.padEnd(maxNameLength),
    ''.padEnd(15),
    ''.padStart(6),
    ''.padStart(12),
    formatPrice(grandTotal, formatCurrency).padStart(12)
  ].join(' │ ');

  const table = [
    separator,
    header,
    separator,
    ...rows,
    separator,
    totalRow,
    separator
  ].join('\n');

  return { table, total: grandTotal };
};

/**
 * Crée une liste de produits formatée (version simplifiée)
 * @param {Array} products - Liste des produits
 * @param {Object} quantities - Quantités par SKU
 * @param {Function} formatCurrency - Fonction de formatage devise
 * @returns {Object} { list: string, total: number }
 */
export const formatProductList = (products, quantities, formatCurrency) => {
  if (!products || !Array.isArray(products) || products.length === 0) {
    return { list: 'Aucun produit', total: 0 };
  }

  let grandTotal = 0;
  const lines = products
    .filter(p => {
      const qty = quantities?.[p.sku] || p.qtyToOrder || 0;
      return qty > 0;
    })
    .map(product => {
      const quantity = quantities?.[product.sku] || product.qtyToOrder || 0;
      const unitPrice = product.buyPrice || product.supplierPrice || product.price || 0;
      const lineTotal = quantity * unitPrice;
      grandTotal += lineTotal;

      return `• ${product.name} (${product.sku})\n  Quantité: ${quantity} × ${formatPrice(unitPrice, formatCurrency)} = ${formatPrice(lineTotal, formatCurrency)}`;
    });

  return {
    list: lines.join('\n\n'),
    total: grandTotal
  };
};

// ============================================
// GÉNÉRATION D'EMAILS DE COMMANDE
// ============================================

/**
 * Génère un email de commande complet
 * @param {Object} options - Options de génération
 * @param {string} options.supplierName - Nom du fournisseur
 * @param {Array} options.products - Produits à commander
 * @param {Object} options.quantities - Quantités par SKU
 * @param {Object} options.supplier - Infos du fournisseur
 * @param {Object} options.warehouse - Infos de l'entrepôt
 * @param {string} options.signature - Signature de l'expéditeur
 * @param {Function} options.formatCurrency - Fonction de formatage devise
 * @returns {Object} { to, subject, body, isValid }
 */
export const generateOrderEmail = ({
  supplierName,
  products,
  quantities,
  supplier,
  warehouse,
  signature = "L'équipe Stockeasy",
  formatCurrency
}) => {
  // Validation des paramètres requis
  if (!supplierName || !products || !warehouse) {
    return {
      to: '',
      subject: '',
      body: 'Paramètres manquants pour générer l\'email.',
      isValid: false
    };
  }

  // Récupérer l'email du contact commercial
  const commercialEmail = sanitizeEmail(
    supplier?.commercialContactEmail ||
    supplier?.email ||
    ''
  );

  const commercialName = supplier?.commercialContactName || '';
  const commercialPhone = supplier?.commercialContactPhone || '';

  // Construire l'adresse de l'entrepôt
  const warehouseAddress = warehouse?.address
    ? `${warehouse.address}\n${warehouse.postalCode || ''} ${warehouse.city || ''}\n${warehouse.country || ''}`
    : warehouse?.name || 'Non spécifié';

  // Générer le tableau de produits
  const { table: productTable, total } = formatProductTable(products, quantities, formatCurrency);

  // Construire le corps de l'email
  const body = `${getGreeting(commercialName)}

Nous souhaitons passer une commande de réapprovisionnement pour les produits suivants :

${productTable}

📦 Livraison
───────────────────────────────
Entrepôt : ${warehouse?.name || 'Non spécifié'}
Adresse :
${warehouseAddress}

Merci de nous confirmer :
• La disponibilité des produits
• Les délais de livraison estimés
• Le montant total avec frais de port

${commercialName || commercialPhone ? `Contact fournisseur : ${commercialName}${commercialPhone ? ` • Tél: ${commercialPhone}` : ''}\n` : ''}
Cordialement,
${signature}`;

  return {
    to: commercialEmail,
    subject: `Commande de réapprovisionnement - ${supplierName}`,
    body,
    total,
    isValid: isValidEmail(commercialEmail)
  };
};

// ============================================
// GÉNÉRATION D'EMAILS DE RÉCLAMATION
// ============================================

/**
 * Génère un email de réclamation pour écarts de livraison
 * @param {Object} options - Options de génération
 * @param {Object} options.order - La commande concernée
 * @param {Object} options.receivedItems - Items reçus {sku: {received, ordered}}
 * @param {Object} options.damagedQuantities - Quantités endommagées {sku: qty}
 * @param {Array} options.products - Liste des produits (pour les noms)
 * @param {Object} options.supplier - Infos du fournisseur
 * @param {string} options.notes - Notes additionnelles
 * @param {string} options.signature - Signature de l'expéditeur
 * @returns {Object} { to, subject, body, isValid }
 */
export const generateReclamationEmail = ({
  order,
  receivedItems,
  damagedQuantities,
  products,
  supplier,
  notes,
  signature = "L'équipe Stockeasy"
}) => {
  if (!order) {
    return {
      to: '',
      subject: '',
      body: 'Commande non spécifiée.',
      isValid: false
    };
  }

  const poNumber = order.poNumber || order.id || 'N/A';

  // Récupérer l'email de réclamation
  const reclamationEmail = sanitizeEmail(
    supplier?.reclamationContactEmail ||
    supplier?.commercialContactEmail ||
    supplier?.email ||
    ''
  );

  const contactName = supplier?.reclamationContactName || supplier?.commercialContactName || '';
  const contactPhone = supplier?.reclamationContactPhone || supplier?.commercialContactPhone || '';

  // Construire les sections d'écarts
  const sections = [];

  // Section quantités manquantes
  const missingItems = [];
  if (order.items && receivedItems) {
    order.items.forEach(item => {
      const receivedData = receivedItems[item.sku];
      const received = typeof receivedData === 'object' ? receivedData.received : (receivedData || 0);
      const damaged = damagedQuantities?.[item.sku] || 0;
      const totalReceived = Number(received) + Number(damaged);
      const missing = item.quantity - totalReceived;

      if (missing > 0) {
        const product = products?.find(p => p.sku === item.sku);
        missingItems.push({
          name: product?.name || item.sku,
          sku: item.sku,
          ordered: item.quantity,
          received: Number(received),
          damaged: Number(damaged),
          missing
        });
      }
    });
  }

  if (missingItems.length > 0) {
    let section = '🔴 QUANTITÉS MANQUANTES\n';
    section += '─'.repeat(40) + '\n';
    missingItems.forEach(item => {
      section += `\n▸ ${item.name}\n`;
      section += `  SKU: ${item.sku}\n`;
      section += `  Commandé: ${item.ordered} unités\n`;
      section += `  Reçu sain: ${item.received} unités\n`;
      if (item.damaged > 0) {
        section += `  Reçu endommagé: ${item.damaged} unités\n`;
      }
      section += `  ⚠️ Manquant: ${item.missing} unités\n`;
    });
    sections.push(section);
  }

  // Section produits endommagés
  const damagedItems = [];
  if (damagedQuantities) {
    Object.entries(damagedQuantities).forEach(([sku, qty]) => {
      if (qty > 0) {
        const product = products?.find(p => p.sku === sku);
        damagedItems.push({
          name: product?.name || sku,
          sku,
          quantity: qty
        });
      }
    });
  }

  if (damagedItems.length > 0) {
    let section = '⚠️ PRODUITS ENDOMMAGÉS\n';
    section += '─'.repeat(40) + '\n';
    damagedItems.forEach(item => {
      section += `\n▸ ${item.name}\n`;
      section += `  SKU: ${item.sku}\n`;
      section += `  Quantité endommagée: ${item.quantity} unités\n`;
    });
    sections.push(section);
  }

  // Notes utilisateur
  const hasNotes = notes && typeof notes === 'string' && notes.trim().length > 0;

  // Construire le corps de l'email
  const body = `${getGreeting(contactName)}

Nous avons réceptionné la commande ${poNumber} et constatons les problèmes suivants :

${sections.length > 0 ? sections.join('\n') : 'Aucun problème spécifique détaillé.'}
${hasNotes ? `\n📝 Notes additionnelles\n${'─'.repeat(40)}\n${notes.trim()}\n` : ''}
─────────────────────────────────────────

Merci de procéder rapidement au remplacement ou à l'envoi des articles manquants/endommagés.

${contactName || contactPhone ? `Contact réclamations : ${contactName}${contactPhone ? ` • Tél: ${contactPhone}` : ''}\n` : ''}
Cordialement,
${signature}`;

  return {
    to: reclamationEmail,
    subject: `Réclamation - Commande ${poNumber}`,
    body,
    isValid: isValidEmail(reclamationEmail),
    hasIssues: missingItems.length > 0 || damagedItems.length > 0
  };
};

// ============================================
// HELPERS POUR LES MODALES
// ============================================

/**
 * Parse un email texte en composants (to, subject, body)
 * @param {string} content - Le contenu brut de l'email
 * @returns {Object} { to, subject, body }
 */
export const parseEmailContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { to: '', subject: '', body: '' };
  }

  const lines = content.split('\n');
  let to = '';
  let subject = '';
  let bodyStartIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('À:') || line.startsWith('A:')) {
      to = line.replace(/^[ÀA]:/, '').trim();
    } else if (line.startsWith('Objet:')) {
      subject = line.replace('Objet:', '').trim();
    } else if (line.startsWith('Bonjour')) {
      bodyStartIndex = i;
      break;
    }
  }

  const body = lines.slice(bodyStartIndex).join('\n');

  return { to, subject, body };
};

/**
 * Reconstruit un email complet à partir de ses composants
 * @param {string} to - Destinataire
 * @param {string} subject - Objet
 * @param {string} body - Corps
 * @returns {string} L'email complet
 */
export const buildEmailContent = (to, subject, body) => {
  return `À: ${to}\nObjet: ${subject}\n\n${body}`;
};

/**
 * Ouvre le client email avec le contenu pré-rempli
 * @param {string} to - Destinataire
 * @param {string} subject - Objet
 * @param {string} body - Corps
 */
export const openEmailClient = (to, subject, body) => {
  const mailtoLink = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailtoLink, '_blank');
};

/**
 * Copie du texte dans le presse-papiers
 * @param {string} text - Le texte à copier
 * @returns {Promise<boolean>} True si succès
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Erreur lors de la copie:', err);
    // Fallback pour les navigateurs plus anciens
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      console.error('Erreur fallback copie:', fallbackErr);
      return false;
    }
  }
};

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

const emailService = {
  // Validation
  isValidEmail,
  sanitizeEmail,
  getFirstName,
  getGreeting,
  
  // Formatage
  formatProductTable,
  formatProductList,
  
  // Génération
  generateOrderEmail,
  generateReclamationEmail,
  
  // Helpers
  parseEmailContent,
  buildEmailContent,
  openEmailClient,
  copyToClipboard
};

export default emailService;

