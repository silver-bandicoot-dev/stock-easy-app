import { logger } from './logger';

/**
 * Erreur de validation personnalisée
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Valide un SKU
 * 
 * SKU doit être:
 * - Alphanumerique avec - et _ autorisés
 * - Entre 1 et 50 caractères
 * - Pas d'espaces
 * 
 * @param sku - SKU à valider
 * @param fieldName - Nom du champ (pour les messages d'erreur)
 * @throws ValidationError si le SKU est invalide
 */
export function validateSku(sku: string, fieldName: string = 'sku'): void {
  if (!sku || typeof sku !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      sku
    );
  }
  
  // Trim pour éviter les espaces
  const trimmedSku = sku.trim();
  
  if (trimmedSku.length === 0) {
    throw new ValidationError(
      `${fieldName} cannot be empty`,
      fieldName,
      sku
    );
  }
  
  if (trimmedSku.length > 50) {
    throw new ValidationError(
      `${fieldName} cannot exceed 50 characters`,
      fieldName,
      sku
    );
  }
  
  // SKU doit être alphanumerique avec - et _ autorisés
  const skuRegex = /^[A-Za-z0-9_-]+$/;
  if (!skuRegex.test(trimmedSku)) {
    throw new ValidationError(
      `${fieldName} must contain only letters, numbers, hyphens, and underscores`,
      fieldName,
      sku
    );
  }
}

/**
 * Valide un UUID v4
 * 
 * @param uuid - UUID à valider
 * @param fieldName - Nom du champ
 * @throws ValidationError si l'UUID est invalide
 */
export function validateUuid(uuid: string, fieldName: string = 'uuid'): void {
  if (!uuid || typeof uuid !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      uuid
    );
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    throw new ValidationError(
      `${fieldName} must be a valid UUID v4`,
      fieldName,
      uuid
    );
  }
}

/**
 * Valide une quantité
 * 
 * Quantité doit être:
 * - Un nombre entier
 * - >= 0
 * - <= 1,000,000 (limite raisonnable)
 * 
 * @param quantity - Quantité à valider
 * @param fieldName - Nom du champ
 * @param options - Options de validation
 * @throws ValidationError si la quantité est invalide
 */
export function validateQuantity(
  quantity: number,
  fieldName: string = 'quantity',
  options: {
    min?: number;
    max?: number;
    allowNegative?: boolean;
  } = {}
): void {
  const {
    min = 0,
    max = 1_000_000,
    allowNegative = false
  } = options;
  
  if (quantity === null || quantity === undefined) {
    throw new ValidationError(
      `${fieldName} is required`,
      fieldName,
      quantity
    );
  }
  
  if (typeof quantity !== 'number' || isNaN(quantity)) {
    throw new ValidationError(
      `${fieldName} must be a number`,
      fieldName,
      quantity
    );
  }
  
  if (!Number.isInteger(quantity)) {
    throw new ValidationError(
      `${fieldName} must be an integer`,
      fieldName,
      quantity
    );
  }
  
  if (!allowNegative && quantity < min) {
    throw new ValidationError(
      `${fieldName} must be at least ${min}`,
      fieldName,
      quantity
    );
  }
  
  if (quantity > max) {
    throw new ValidationError(
      `${fieldName} cannot exceed ${max}`,
      fieldName,
      quantity
    );
  }
}

/**
 * Valide un prix
 * 
 * Prix doit être:
 * - Un nombre
 * - >= 0
 * - Maximum 2 décimales
 * - <= 1,000,000
 * 
 * @param price - Prix à valider
 * @param fieldName - Nom du champ
 * @throws ValidationError si le prix est invalide
 */
export function validatePrice(price: number, fieldName: string = 'price'): void {
  if (price === null || price === undefined) {
    throw new ValidationError(
      `${fieldName} is required`,
      fieldName,
      price
    );
  }
  
  if (typeof price !== 'number' || isNaN(price)) {
    throw new ValidationError(
      `${fieldName} must be a number`,
      fieldName,
      price
    );
  }
  
  if (price < 0) {
    throw new ValidationError(
      `${fieldName} must be positive`,
      fieldName,
      price
    );
  }
  
  if (price > 1_000_000) {
    throw new ValidationError(
      `${fieldName} cannot exceed 1,000,000`,
      fieldName,
      price
    );
  }
  
  // Vérifier max 2 décimales
  const decimalCount = (price.toString().split('.')[1] || '').length;
  if (decimalCount > 2) {
    throw new ValidationError(
      `${fieldName} can have at most 2 decimal places`,
      fieldName,
      price
    );
  }
}

/**
 * Valide un email
 * 
 * @param email - Email à valider
 * @param fieldName - Nom du champ
 * @throws ValidationError si l'email est invalide
 */
export function validateEmail(email: string, fieldName: string = 'email'): void {
  if (!email || typeof email !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      email
    );
  }
  
  const trimmedEmail = email.trim().toLowerCase();
  
  // Regex simple mais efficace pour email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new ValidationError(
      `${fieldName} must be a valid email address`,
      fieldName,
      email
    );
  }
  
  if (trimmedEmail.length > 254) {
    throw new ValidationError(
      `${fieldName} is too long (max 254 characters)`,
      fieldName,
      email
    );
  }
}

/**
 * Valide un domaine Shopify
 * 
 * Format attendu: boutique.myshopify.com
 * 
 * @param domain - Domaine à valider
 * @param fieldName - Nom du champ
 * @throws ValidationError si le domaine est invalide
 */
export function validateShopifyDomain(domain: string, fieldName: string = 'domain'): void {
  if (!domain || typeof domain !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      domain
    );
  }
  
  const trimmedDomain = domain.trim().toLowerCase();
  
  // Format: xxx.myshopify.com ou domaine custom
  const shopifyDomainRegex = /^[a-z0-9-]+\.myshopify\.com$/;
  const customDomainRegex = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;
  
  if (!shopifyDomainRegex.test(trimmedDomain) && !customDomainRegex.test(trimmedDomain)) {
    throw new ValidationError(
      `${fieldName} must be a valid Shopify domain (e.g., boutique.myshopify.com)`,
      fieldName,
      domain
    );
  }
}

/**
 * Valide un ID Shopify GraphQL
 * 
 * Format: gid://shopify/ResourceName/123456789
 * 
 * @param gid - ID GraphQL à valider
 * @param fieldName - Nom du champ
 * @param expectedResource - Type de ressource attendu (optionnel)
 * @throws ValidationError si l'ID est invalide
 */
export function validateShopifyGid(
  gid: string,
  fieldName: string = 'id',
  expectedResource?: string
): void {
  if (!gid || typeof gid !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      gid
    );
  }
  
  const gidRegex = /^gid:\/\/shopify\/([A-Za-z]+)\/(\d+)$/;
  const match = gid.match(gidRegex);
  
  if (!match) {
    throw new ValidationError(
      `${fieldName} must be a valid Shopify GraphQL ID (format: gid://shopify/ResourceName/123)`,
      fieldName,
      gid
    );
  }
  
  if (expectedResource) {
    const [, resourceType] = match;
    if (resourceType !== expectedResource) {
      throw new ValidationError(
        `${fieldName} must be a ${expectedResource} ID, got ${resourceType}`,
        fieldName,
        gid
      );
    }
  }
}

/**
 * Valide une date ISO 8601
 * 
 * @param date - Date à valider (string ou Date)
 * @param fieldName - Nom du champ
 * @throws ValidationError si la date est invalide
 */
export function validateISODate(date: string | Date, fieldName: string = 'date'): void {
  if (!date) {
    throw new ValidationError(
      `${fieldName} is required`,
      fieldName,
      date
    );
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    throw new ValidationError(
      `${fieldName} must be a valid ISO 8601 date`,
      fieldName,
      date
    );
  }
}

/**
 * Valide une URL
 * 
 * @param url - URL à valider
 * @param fieldName - Nom du champ
 * @param options - Options de validation
 * @throws ValidationError si l'URL est invalide
 */
export function validateUrl(
  url: string,
  fieldName: string = 'url',
  options: {
    protocols?: string[];
    requireProtocol?: boolean;
  } = {}
): void {
  const {
    protocols = ['http', 'https'],
    requireProtocol = true
  } = options;
  
  if (!url || typeof url !== 'string') {
    throw new ValidationError(
      `${fieldName} is required and must be a string`,
      fieldName,
      url
    );
  }
  
  try {
    const urlObj = new URL(url);
    
    if (requireProtocol && !protocols.includes(urlObj.protocol.replace(':', ''))) {
      throw new ValidationError(
        `${fieldName} must use one of these protocols: ${protocols.join(', ')}`,
        fieldName,
        url
      );
    }
  } catch (error) {
    throw new ValidationError(
      `${fieldName} must be a valid URL`,
      fieldName,
      url
    );
  }
}

/**
 * Sanitize une chaîne pour éviter les injections
 * Supprime les caractères potentiellement dangereux
 * 
 * @param input - Chaîne à nettoyer
 * @returns Chaîne nettoyée
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Supprimer les caractères de contrôle et les nulls
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Valide et nettoie un objet de métadonnées
 * 
 * @param metadata - Métadonnées à valider
 * @param maxDepth - Profondeur maximale autorisée
 * @param currentDepth - Profondeur actuelle (interne)
 * @returns Métadonnées nettoyées
 * @throws ValidationError si les métadonnées sont invalides
 */
export function validateMetadata(
  metadata: any,
  maxDepth: number = 3,
  currentDepth: number = 0
): Record<string, any> {
  if (currentDepth >= maxDepth) {
    throw new ValidationError(
      `Metadata nesting depth cannot exceed ${maxDepth}`,
      'metadata'
    );
  }
  
  if (metadata === null || metadata === undefined) {
    return {};
  }
  
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new ValidationError(
      'Metadata must be an object',
      'metadata',
      metadata
    );
  }
  
  const cleaned: Record<string, any> = {};
  const keys = Object.keys(metadata);
  
  if (keys.length > 50) {
    throw new ValidationError(
      'Metadata cannot have more than 50 keys',
      'metadata'
    );
  }
  
  for (const key of keys) {
    // Valider la clé
    if (key.length > 100) {
      logger.warn(`Metadata key too long, skipping: ${key.substring(0, 20)}...`);
      continue;
    }
    
    const value = metadata[key];
    
    // Valider la valeur
    if (typeof value === 'string') {
      if (value.length > 1000) {
        logger.warn(`Metadata value too long for key ${key}, truncating`);
        cleaned[key] = value.substring(0, 1000);
      } else {
        cleaned[key] = sanitizeString(value);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      cleaned[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      cleaned[key] = validateMetadata(value, maxDepth, currentDepth + 1);
    } else {
      logger.warn(`Invalid metadata value type for key ${key}: ${typeof value}`);
    }
  }
  
  return cleaned;
}

/**
 * Helper pour valider plusieurs champs à la fois
 * Accumule les erreurs et les lance toutes ensemble
 * 
 * @param validations - Fonctions de validation à exécuter
 * @throws ValidationError avec tous les messages d'erreur
 */
export function validateAll(validations: Array<() => void>): void {
  const errors: ValidationError[] = [];
  
  for (const validation of validations) {
    try {
      validation();
    } catch (error) {
      if (error instanceof ValidationError) {
        errors.push(error);
      } else {
        throw error;
      }
    }
  }
  
  if (errors.length > 0) {
    const messages = errors.map(e => e.message).join('; ');
    throw new ValidationError(messages);
  }
}


