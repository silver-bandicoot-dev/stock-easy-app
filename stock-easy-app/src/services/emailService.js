/**
 * Service unifié de génération d'emails
 * Centralise toute la logique de création d'emails pour l'application
 * Supporte l'internationalisation (i18n)
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
 * Génère une ligne de salutation personnalisée (traduite)
 * @param {string} contactName - Le nom du contact
 * @param {Function} t - Fonction de traduction
 * @returns {string} La ligne de salutation
 */
export const getGreeting = (contactName, t) => {
  const firstName = getFirstName(contactName);
  if (t) {
    return firstName 
      ? t('emailTemplates.order.greetingWithName', { name: firstName })
      : t('emailTemplates.order.greeting') + ',';
  }
  // Fallback FR si pas de fonction de traduction
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
 * Utilise un format en liste pour une meilleure compatibilité avec tous les clients email
 * @param {Array} products - Liste des produits
 * @param {Object} quantities - Quantités par SKU
 * @param {Function} formatCurrency - Fonction de formatage devise
 * @param {Function} t - Fonction de traduction (optionnel)
 * @returns {Object} { table: string, total: number }
 */
export const formatProductTable = (products, quantities, formatCurrency, t) => {
  // Traductions avec fallbacks
  const labels = {
    qty: t?.('emailTemplates.order.table.qty') || 'Qté',
    unitPrice: t?.('emailTemplates.order.table.unitPrice') || 'P.U.',
    subtotal: t?.('emailTemplates.order.table.subtotal') || 'Sous-total',
    total: t?.('emailTemplates.order.table.total') || 'TOTAL',
    noProducts: t?.('emailTemplates.order.table.noProducts') || 'Aucun produit',
    noProductsSelected: t?.('emailTemplates.order.table.noProductsSelected') || 'Aucun produit sélectionné',
    unnamed: t?.('emailTemplates.order.table.unnamed') || 'Sans nom',
    productsOrdered: t?.('emailTemplates.order.table.productsOrdered') || 'Produits commandés',
  };

  if (!products || !Array.isArray(products) || products.length === 0) {
    return { table: labels.noProducts, total: 0 };
  }

  const filteredProducts = products.filter(p => {
    const qty = quantities?.[p.sku] || p.qtyToOrder || 0;
    return qty > 0;
  });

  if (filteredProducts.length === 0) {
    return { table: labels.noProductsSelected, total: 0 };
  }

  // Générer les lignes de produits en format liste
  let grandTotal = 0;
  const productLines = filteredProducts.map((product, index) => {
    const name = product.name || labels.unnamed;
    const sku = product.sku || '';
    const quantity = quantities?.[product.sku] || product.qtyToOrder || 0;
    const unitPrice = product.buyPrice || product.supplierPrice || product.price || 0;
    const lineTotal = quantity * unitPrice;
    grandTotal += lineTotal;

    return `${index + 1}. ${name}
   SKU: ${sku}
   ${labels.qty}: ${quantity} × ${formatPrice(unitPrice, formatCurrency)}
   ${labels.subtotal}: ${formatPrice(lineTotal, formatCurrency)}`;
  });

  // Construire le tableau final
  const table = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 ${labels.productsOrdered}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${productLines.join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 ${labels.total}: ${formatPrice(grandTotal, formatCurrency)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

  return { table, total: grandTotal };
};

/**
 * Crée une liste de produits formatée (version simplifiée)
 * @param {Array} products - Liste des produits
 * @param {Object} quantities - Quantités par SKU
 * @param {Function} formatCurrency - Fonction de formatage devise
 * @param {Function} t - Fonction de traduction (optionnel)
 * @returns {Object} { list: string, total: number }
 */
export const formatProductList = (products, quantities, formatCurrency, t) => {
  const labels = {
    noProducts: t?.('emailTemplates.order.table.noProducts') || 'Aucun produit',
    qty: t?.('emailTemplates.order.table.qty') || 'Quantité',
  };

  if (!products || !Array.isArray(products) || products.length === 0) {
    return { list: labels.noProducts, total: 0 };
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

      return `• ${product.name} (${product.sku})\n  ${labels.qty}: ${quantity} × ${formatPrice(unitPrice, formatCurrency)} = ${formatPrice(lineTotal, formatCurrency)}`;
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
 * @param {Function} options.t - Fonction de traduction i18n (optionnel)
 * @returns {Object} { to, subject, body, isValid }
 */
export const generateOrderEmail = ({
  supplierName,
  products,
  quantities,
  supplier,
  warehouse,
  signature = '',
  formatCurrency,
  t
}) => {
  // Traductions avec fallbacks
  const labels = {
    subject: t ? t('emailTemplates.order.subject', { supplier: supplierName }) : `Commande de réapprovisionnement - ${supplierName}`,
    intro: t?.('emailTemplates.order.intro') || 'Nous souhaitons passer une commande de réapprovisionnement pour les produits suivants :',
    deliverySection: t?.('emailTemplates.order.deliverySection') || '📦 Livraison',
    warehouse: t?.('emailTemplates.order.warehouse') || 'Entrepôt',
    address: t?.('emailTemplates.order.address') || 'Adresse',
    notSpecified: t?.('emailTemplates.order.notSpecified') || 'Non spécifié',
    confirmRequest: t?.('emailTemplates.order.confirmRequest') || 'Merci de nous confirmer :',
    confirmAvailability: t?.('emailTemplates.order.confirmAvailability') || 'La disponibilité des produits',
    confirmDelivery: t?.('emailTemplates.order.confirmDelivery') || 'Les délais de livraison estimés',
    confirmTotal: t?.('emailTemplates.order.confirmTotal') || 'Le montant total avec frais de port',
    supplierContact: t?.('emailTemplates.order.supplierContact') || 'Contact fournisseur',
    phone: t?.('emailTemplates.order.phone') || 'Tél',
    closing: t?.('emailTemplates.order.closing') || 'Cordialement,',
    missingParams: t?.('emailTemplates.order.missingParams') || 'Paramètres manquants pour générer l\'email.',
  };

  // Validation des paramètres requis
  if (!supplierName || !products || !warehouse) {
    return {
      to: '',
      subject: '',
      body: labels.missingParams,
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
    : warehouse?.name || labels.notSpecified;

  // Générer le tableau de produits
  const { table: productTable, total } = formatProductTable(products, quantities, formatCurrency, t);

  // Construire le corps de l'email
  const body = `${getGreeting(commercialName, t)}

${labels.intro}

${productTable}

${labels.deliverySection}
-------------------------------
${labels.warehouse} : ${warehouse?.name || labels.notSpecified}
${labels.address} :
${warehouseAddress}

${labels.confirmRequest}
• ${labels.confirmAvailability}
• ${labels.confirmDelivery}
• ${labels.confirmTotal}

${commercialName || commercialPhone ? `${labels.supplierContact} : ${commercialName}${commercialPhone ? ` • ${labels.phone}: ${commercialPhone}` : ''}\n` : ''}${labels.closing}
${signature}`;

  return {
    to: commercialEmail,
    subject: labels.subject,
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
 * @param {Function} options.t - Fonction de traduction i18n (optionnel)
 * @returns {Object} { to, subject, body, isValid }
 */
export const generateReclamationEmail = ({
  order,
  receivedItems,
  damagedQuantities,
  products,
  supplier,
  notes,
  signature = '',
  t
}) => {
  const poNumber = order?.poNumber || order?.id || 'N/A';

  // Traductions avec fallbacks
  const labels = {
    subject: t ? t('emailTemplates.reclamation.subject', { poNumber }) : `Réclamation - Commande ${poNumber}`,
    intro: t ? t('emailTemplates.reclamation.intro', { poNumber }) : `Nous avons réceptionné la commande ${poNumber} et constatons les problèmes suivants :`,
    missingSection: t?.('emailTemplates.reclamation.missingSection') || '🔴 QUANTITÉS MANQUANTES',
    damagedSection: t?.('emailTemplates.reclamation.damagedSection') || '⚠️ PRODUITS ENDOMMAGÉS',
    notesSection: t?.('emailTemplates.reclamation.notesSection') || '📝 Notes additionnelles',
    ordered: t?.('emailTemplates.reclamation.ordered') || 'Commandé',
    receivedHealthy: t?.('emailTemplates.reclamation.receivedHealthy') || 'Reçu sain',
    receivedDamaged: t?.('emailTemplates.reclamation.receivedDamaged') || 'Reçu endommagé',
    missing: t?.('emailTemplates.reclamation.missing') || 'Manquant',
    damagedQty: t?.('emailTemplates.reclamation.damagedQty') || 'Quantité endommagée',
    units: t?.('emailTemplates.reclamation.units') || 'unités',
    noIssues: t?.('emailTemplates.reclamation.noIssues') || 'Aucun problème spécifique détaillé.',
    actionRequest: t?.('emailTemplates.reclamation.actionRequest') || 'Merci de procéder rapidement au remplacement ou à l\'envoi des articles manquants/endommagés.',
    reclamationContact: t?.('emailTemplates.reclamation.reclamationContact') || 'Contact réclamations',
    phone: t?.('emailTemplates.reclamation.phone') || 'Tél',
    closing: t?.('emailTemplates.reclamation.closing') || 'Cordialement,',
    orderNotSpecified: 'Commande non spécifiée.',
  };

  if (!order) {
    return {
      to: '',
      subject: '',
      body: labels.orderNotSpecified,
      isValid: false
    };
  }

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
      const missingQty = item.quantity - totalReceived;

      if (missingQty > 0) {
        const product = products?.find(p => p.sku === item.sku);
        missingItems.push({
          name: product?.name || item.sku,
          sku: item.sku,
          ordered: item.quantity,
          received: Number(received),
          damaged: Number(damaged),
          missing: missingQty
        });
      }
    });
  }

  if (missingItems.length > 0) {
    let section = `${labels.missingSection}\n`;
    section += '-'.repeat(40) + '\n';
    missingItems.forEach(item => {
      section += `\n> ${item.name}\n`;
      section += `  SKU: ${item.sku}\n`;
      section += `  ${labels.ordered}: ${item.ordered} ${labels.units}\n`;
      section += `  ${labels.receivedHealthy}: ${item.received} ${labels.units}\n`;
      if (item.damaged > 0) {
        section += `  ${labels.receivedDamaged}: ${item.damaged} ${labels.units}\n`;
      }
      section += `  ⚠️ ${labels.missing}: ${item.missing} ${labels.units}\n`;
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
    let section = `${labels.damagedSection}\n`;
    section += '-'.repeat(40) + '\n';
    damagedItems.forEach(item => {
      section += `\n> ${item.name}\n`;
      section += `  SKU: ${item.sku}\n`;
      section += `  ${labels.damagedQty}: ${item.quantity} ${labels.units}\n`;
    });
    sections.push(section);
  }

  // Notes utilisateur
  const hasNotes = notes && typeof notes === 'string' && notes.trim().length > 0;

  // Construire le corps de l'email (avec salutation traduite pour réclamation)
  const greetingReclamation = t 
    ? (contactName 
        ? t('emailTemplates.reclamation.greetingWithName', { name: getFirstName(contactName) })
        : t('emailTemplates.reclamation.greeting') + ',')
    : (contactName ? `Bonjour ${getFirstName(contactName)},` : 'Bonjour,');

  const body = `${greetingReclamation}

${labels.intro}

${sections.length > 0 ? sections.join('\n') : labels.noIssues}
${hasNotes ? `\n${labels.notesSection}\n${'-'.repeat(40)}\n${notes.trim()}\n` : ''}
-----------------------------------------

${labels.actionRequest}

${contactName || contactPhone ? `${labels.reclamationContact} : ${contactName}${contactPhone ? ` • ${labels.phone}: ${contactPhone}` : ''}\n` : ''}${labels.closing}
${signature}`;

  return {
    to: reclamationEmail,
    subject: labels.subject,
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

    if (line.startsWith('À:') || line.startsWith('A:') || line.startsWith('To:')) {
      to = line.replace(/^[ÀATo]:/, '').trim();
    } else if (line.startsWith('Objet:') || line.startsWith('Subject:')) {
      subject = line.replace(/^(Objet|Subject):/, '').trim();
    } else if (line.startsWith('Bonjour') || line.startsWith('Hello') || line.startsWith('Hola')) {
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
