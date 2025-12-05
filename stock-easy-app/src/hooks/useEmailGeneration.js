import { useCurrency } from '../contexts/CurrencyContext';
import emailService from '../services/emailService';

/**
 * Hook pour la génération d'emails
 * Utilise le service emailService centralisé
 */
export const useEmailGeneration = () => {
  const { format: formatCurrency } = useCurrency();

  /**
   * Génère un brouillon d'email pour une commande
   * @param {string} supplierName - Nom du fournisseur
   * @param {Array} products - Produits à commander
   * @param {string} warehouseName - Nom de l'entrepôt
   * @param {Object} orderQuantities - Quantités par SKU
   * @param {string} userSignature - Signature de l'utilisateur
   * @param {Object} suppliers - Map des fournisseurs
   * @param {Object} warehouses - Map des entrepôts
   * @returns {string} Le contenu de l'email formaté
   */
  const generateOrderEmailDraft = (
    supplierName, 
    products, 
    warehouseName, 
    orderQuantities, 
    userSignature, 
    suppliers, 
    warehouses
  ) => {
    if (!supplierName || !products || !warehouseName) {
      return '';
    }

    // Trouver les informations du fournisseur
    const supplier = Array.isArray(suppliers) 
      ? suppliers.find(s => s.name === supplierName)
      : suppliers && Object.values(suppliers).find(s => s.name === supplierName);
    
    // Trouver les informations de l'entrepôt
    const warehouse = Array.isArray(warehouses)
      ? warehouses.find(w => w.name === warehouseName)
      : warehouses && (warehouses[warehouseName] || Object.values(warehouses).find(w => w.name === warehouseName));

    // Utiliser le service centralisé
    const email = emailService.generateOrderEmail({
      supplierName,
      products,
      quantities: orderQuantities,
      supplier,
      warehouse: warehouse ? { ...warehouse, name: warehouseName } : { name: warehouseName },
      signature: userSignature || '',
      formatCurrency
    });

    // Retourner le format attendu par les modales existantes
    return emailService.buildEmailContent(email.to, email.subject, email.body);
  };

  /**
   * Génère un email de réclamation (retourne le body comme chaîne)
   * @param {Object} order - La commande concernée
   * @param {Object} receivedItems - Items reçus
   * @param {Object} damagedQuantities - Quantités endommagées
   * @param {string} notes - Notes additionnelles (optionnel)
   * @param {Array} allProducts - Liste de tous les produits
   * @param {Object} supplier - Infos du fournisseur (optionnel)
   * @param {string} signature - Signature de l'utilisateur (optionnel)
   * @returns {string} Le contenu du body de l'email
   */
  const generateReclamationEmail = (
    order, 
    receivedItems, 
    damagedQuantities, 
    notes = '', 
    allProducts = [],
    supplier = null,
    signature = ''
  ) => {
    const email = emailService.generateReclamationEmail({
      order,
      receivedItems,
      damagedQuantities,
      products: allProducts,
      supplier,
      notes, // Notes additionnelles - seulement si l'utilisateur a écrit quelque chose
      signature // Signature séparée - ne doit pas apparaître dans les notes
    });

    return email.body; // Retourner le body comme chaîne pour compatibilité avec les usages existants
  };

  /**
   * Génère un email de réclamation (retourne l'objet complet avec to, subject, body)
   * @param {Object} order - La commande concernée
   * @param {Object} receivedItems - Items reçus
   * @param {Object} damagedQuantities - Quantités endommagées
   * @param {string} notes - Notes additionnelles (optionnel)
   * @param {Array} allProducts - Liste de tous les produits
   * @param {Object} supplier - Infos du fournisseur (optionnel)
   * @param {string} signature - Signature de l'utilisateur (optionnel)
   * @returns {Object} L'objet email complet { to, subject, body, isValid }
   */
  const generateReclamationEmailObject = (
    order, 
    receivedItems, 
    damagedQuantities, 
    notes = '', 
    allProducts = [],
    supplier = null,
    signature = ''
  ) => {
    return emailService.generateReclamationEmail({
      order,
      receivedItems,
      damagedQuantities,
      products: allProducts,
      supplier,
      notes,
      signature
    });
  };

  /**
   * Copie le texte dans le presse-papiers
   * @param {string} text - Le texte à copier
   * @returns {Promise<boolean>} True si succès
   */
  const copyToClipboard = async (text) => {
    return emailService.copyToClipboard(text);
  };

  /**
   * Ouvre le client email avec le contenu
   * @param {string} to - Destinataire
   * @param {string} subject - Objet
   * @param {string} body - Corps
   */
  const openInEmailClient = (to, subject, body) => {
    emailService.openEmailClient(to, subject, body);
  };

  /**
   * Parse un email en ses composants
   * @param {string} content - Contenu de l'email
   * @returns {Object} { to, subject, body }
   */
  const parseEmail = (content) => {
    return emailService.parseEmailContent(content);
  };

  /**
   * Valide une adresse email
   * @param {string} email - L'adresse email
   * @returns {boolean} True si valide
   */
  const validateEmail = (email) => {
    return emailService.isValidEmail(email);
  };

  return {
    generateOrderEmailDraft,
    generateReclamationEmail,
    generateReclamationEmailObject,
    copyToClipboard,
    openInEmailClient,
    parseEmail,
    validateEmail
  };
};
