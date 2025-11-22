import crypto from 'crypto';
import { logger } from './logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes pour AES
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Obtenir la clé de chiffrement depuis l'environnement
 * La clé doit être un hash hex de 64 caractères (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required');
  }
  
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Chiffre une chaîne de caractères avec AES-256-GCM
 * 
 * @param text - Texte en clair à chiffrer
 * @returns Chaîne chiffrée au format: iv:authTag:encrypted (hex)
 * 
 * @example
 * const token = 'shpat_abc123...';
 * const encrypted = encrypt(token);
 * // => "a1b2c3d4...:e5f6g7h8...:i9j0k1l2..."
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    
    // Générer un IV aléatoire unique pour chaque chiffrement
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Créer le cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Chiffrer le texte
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Récupérer l'authentication tag (important pour GCM)
    const authTag = cipher.getAuthTag();
    
    // Retourner: iv:authTag:encrypted (tous en hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    
  } catch (error: any) {
    logger.error('Encryption failed', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Déchiffre une chaîne chiffrée avec AES-256-GCM
 * 
 * @param encryptedText - Texte chiffré au format: iv:authTag:encrypted
 * @returns Texte en clair
 * 
 * @example
 * const encrypted = "a1b2c3d4...:e5f6g7h8...:i9j0k1l2...";
 * const decrypted = decrypt(encrypted);
 * // => "shpat_abc123..."
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    
    // Séparer les composants
    const parts = encryptedText.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format. Expected: iv:authTag:encrypted');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    
    // Convertir de hex en Buffer
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Valider les longueurs
    if (iv.length !== IV_LENGTH) {
      throw new Error(`Invalid IV length. Expected ${IV_LENGTH}, got ${iv.length}`);
    }
    
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error(`Invalid auth tag length. Expected ${AUTH_TAG_LENGTH}, got ${authTag.length}`);
    }
    
    // Créer le decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Déchiffrer
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
    
  } catch (error: any) {
    logger.error('Decryption failed', {
      error: error.message,
      // Ne pas logger le texte chiffré ou déchiffré pour des raisons de sécurité
    });
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash une chaîne avec SHA-256
 * Utile pour vérifier l'intégrité ou créer des identifiants
 * 
 * @param text - Texte à hasher
 * @returns Hash hex (64 caractères)
 */
export function hash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Génère une clé de chiffrement aléatoire sécurisée
 * À utiliser UNIQUEMENT pour générer ENCRYPTION_KEY (une seule fois)
 * 
 * @returns Clé de chiffrement en format hex (64 caractères)
 * 
 * @example
 * // Dans un script de setup:
 * const key = generateEncryptionKey();
 * console.log(`ENCRYPTION_KEY=${key}`);
 * // => ENCRYPTION_KEY=a1b2c3d4e5f6...
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Compare deux chaînes de manière sécurisée (protection contre timing attacks)
 * 
 * @param a - Première chaîne
 * @param b - Deuxième chaîne
 * @returns true si identiques, false sinon
 */
export function secureCompare(a: string, b: string): boolean {
  try {
    if (a.length !== b.length) {
      return false;
    }
    
    const bufferA = Buffer.from(a, 'utf8');
    const bufferB = Buffer.from(b, 'utf8');
    
    return crypto.timingSafeEqual(bufferA, bufferB);
  } catch {
    return false;
  }
}

/**
 * Génère un token aléatoire sécurisé
 * 
 * @param length - Longueur en bytes (défaut: 32)
 * @returns Token en format hex
 * 
 * @example
 * const sessionToken = generateToken();
 * // => "a1b2c3d4e5f6g7h8..."
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash un mot de passe avec bcrypt-like (PBKDF2)
 * Utile si vous devez stocker des mots de passe
 * 
 * @param password - Mot de passe en clair
 * @param salt - Salt optionnel (généré automatiquement si non fourni)
 * @returns Hash au format: salt:iterations:hash
 */
export function hashPassword(password: string, salt?: string): string {
  const iterations = 100000;
  const keyLength = 64;
  const digest = 'sha512';
  
  const saltBuffer = salt 
    ? Buffer.from(salt, 'hex')
    : crypto.randomBytes(SALT_LENGTH);
  
  const hash = crypto.pbkdf2Sync(
    password,
    saltBuffer,
    iterations,
    keyLength,
    digest
  );
  
  return `${saltBuffer.toString('hex')}:${iterations}:${hash.toString('hex')}`;
}

/**
 * Vérifie un mot de passe contre son hash
 * 
 * @param password - Mot de passe en clair à vérifier
 * @param hashedPassword - Hash au format: salt:iterations:hash
 * @returns true si le mot de passe correspond
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, iterationsStr, originalHash] = hashedPassword.split(':');
    
    if (!salt || !iterationsStr || !originalHash) {
      throw new Error('Invalid hash format');
    }
    
    const iterations = parseInt(iterationsStr, 10);
    const keyLength = originalHash.length / 2; // hex string is 2x the byte length
    const digest = 'sha512';
    
    const hash = crypto.pbkdf2Sync(
      password,
      Buffer.from(salt, 'hex'),
      iterations,
      keyLength,
      digest
    );
    
    return secureCompare(hash.toString('hex'), originalHash);
  } catch {
    return false;
  }
}

/**
 * Exemple d'utilisation pour générer ENCRYPTION_KEY
 * Exécuter une seule fois et stocker le résultat dans .env
 */
if (require.main === module) {
  console.log('🔐 Génération d\'une nouvelle clé de chiffrement...\n');
  const key = generateEncryptionKey();
  console.log('Ajoutez cette ligne à votre fichier .env :\n');
  console.log(`ENCRYPTION_KEY=${key}\n`);
  console.log('⚠️  ATTENTION: Gardez cette clé secrète et ne la commitez JAMAIS dans Git!');
  console.log('⚠️  Si vous perdez cette clé, vous ne pourrez plus déchiffrer les données existantes.');
}


