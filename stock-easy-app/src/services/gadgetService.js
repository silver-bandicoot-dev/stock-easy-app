/**
 * Service pour communiquer avec l'API Gadget
 * Utilisé pour synchroniser les données vers Shopify
 * 
 * IMPORTANT: Produits "Untracked" dans Shopify
 * =============================================
 * Certains produits peuvent avoir `inventory_management: null` dans Shopify,
 * ce qui signifie que leur inventaire n'est PAS suivi.
 * 
 * Pour ces produits :
 * - L'API Shopify refuse les mises à jour d'inventaire
 * - Le service retournera une erreur "skipped" pour ces SKUs
 * 
 * Solution: Le marchand doit activer le suivi de l'inventaire dans Shopify Admin:
 * 1. Aller dans Products > [Produit]
 * 2. Cliquer sur "Edit" pour la variante
 * 3. Cocher "Track quantity"
 * 4. Sauvegarder
 */

// URL de l'API Gadget (à configurer dans les variables d'environnement)
const GADGET_API_URL = import.meta.env.VITE_GADGET_API_URL || 'https://stockeasy-app.gadget.app';
const GADGET_API_KEY = import.meta.env.VITE_GADGET_INTERNAL_API_KEY;

/**
 * Met à jour l'inventaire Shopify pour une liste de produits
 * @param {string} companyId - L'ID de la company
 * @param {Array<{sku: string, stock_actuel: number}>} updates - Liste des mises à jour
 * @returns {Promise<{success: boolean, processed?: number, errors?: number, skipped?: number}>}
 */
export async function updateShopifyInventory(companyId, updates) {
  if (!GADGET_API_KEY) {
    console.warn('⚠️ VITE_GADGET_INTERNAL_API_KEY non configurée - mise à jour Shopify ignorée');
    return { 
      success: false, 
      error: 'API key not configured',
      message: 'La clé API Gadget n\'est pas configurée. Configurez VITE_GADGET_INTERNAL_API_KEY.'
    };
  }

  if (!companyId || !updates || updates.length === 0) {
    return { 
      success: false, 
      error: 'Invalid parameters',
      message: 'companyId et updates sont requis'
    };
  }

  try {
    console.log('🔄 Envoi mise à jour inventaire Shopify via Gadget:', {
      companyId,
      updateCount: updates.length,
      skus: updates.map(u => u.sku)
    });

    const response = await fetch(`${GADGET_API_URL}/update-shopify-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GADGET_API_KEY}`
      },
      body: JSON.stringify({
        company_id: companyId,
        updates: updates.map(u => ({
          sku: u.sku,
          stock_actuel: Math.floor(u.stock_actuel || u.newStock || 0)
        }))
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Gadget API:', response.status, errorText);
      return {
        success: false,
        error: `HTTP ${response.status}`,
        message: errorText
      };
    }

    const result = await response.json();
    console.log('✅ Résultat mise à jour Shopify:', result);
    
    return {
      success: true,
      processed: result.processed || 0,
      errors: result.errors || 0,
      skipped: result.skipped || 0
    };
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour Shopify:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erreur de connexion à l\'API Gadget'
    };
  }
}

/**
 * Vérifie si un produit est suivi dans Shopify (inventory_management = 'shopify')
 * Les produits "untracked" ne peuvent pas être mis à jour
 * @param {string} sku - Le SKU du produit
 * @returns {Promise<boolean>}
 */
export async function isProductTrackedInShopify(sku) {
  // Cette vérification devrait être faite côté Gadget
  // Pour l'instant, on retourne true et on laisse Gadget gérer les erreurs
  return true;
}

/**
 * Prépare les mises à jour de stock à partir des données de réconciliation INITIALE
 * Utilisé lors de la première réconciliation (quantités reçues en bon état)
 * @param {Object} order - La commande réconciliée
 * @returns {Array<{sku: string, stock_actuel: number}>}
 */
export function prepareStockUpdatesFromReconciliation(order, currentProducts) {
  if (!order || !order.items) {
    return [];
  }

  const updates = [];

  order.items.forEach(item => {
    const sku = item.sku;
    const orderedQty = item.quantity || 0;
    
    // Obtenir les quantités manquantes et endommagées
    const missingQty = order.missingQuantitiesBySku?.[sku] || 0;
    const damagedQty = order.damagedQuantitiesBySku?.[sku] || 0;
    
    // Calculer la quantité reçue en bon état
    const receivedQty = Math.max(0, orderedQty - missingQty - damagedQty);
    
    if (receivedQty > 0) {
      // Trouver le stock actuel du produit
      const product = currentProducts?.find(p => p.sku === sku);
      const currentStock = product?.stock || 0;
      const newStock = currentStock + receivedQty;
      
      updates.push({
        sku,
        stock_actuel: newStock,
        previousStock: currentStock,
        addedQuantity: receivedQty
      });
    }
  });

  return updates;
}

/**
 * Prépare les mises à jour de stock lors de la COMPLÉTION d'une réconciliation
 * Utilisé quand les quantités manquantes sont finalement arrivées
 * 
 * IMPORTANT: Cette fonction est appelée APRÈS que api.confirmOrderReconciliation()
 * a déjà mis à jour le stock dans Supabase. On récupère donc le stock FINAL
 * et on l'envoie tel quel à Shopify (pas d'addition).
 * 
 * @param {Object} order - La commande en réconciliation
 * @param {Array} currentProducts - Liste des produits avec stock actuel (APRÈS mise à jour)
 * @returns {Array<{sku: string, stock_actuel: number}>}
 */
export function prepareStockUpdatesForCompletion(order, currentProducts) {
  if (!order || !order.items) {
    console.log('⚠️ prepareStockUpdatesForCompletion: pas d\'items');
    return [];
  }

  const updates = [];

  order.items.forEach(item => {
    const sku = item.sku;
    
    // Obtenir les quantités manquantes (pour savoir si on doit synchroniser)
    const missingQty = order.missingQuantitiesBySku?.[sku] || 0;
    
    console.log(`📦 Complétion - SKU ${sku}: quantités manquantes = ${missingQty}`);
    
    if (missingQty > 0) {
      // Le stock a DÉJÀ été mis à jour par confirmOrderReconciliation()
      // On récupère juste le stock actuel et on l'envoie tel quel à Shopify
      const product = currentProducts?.find(p => p.sku?.toLowerCase() === sku?.toLowerCase());
      const finalStock = product?.stock_actuel || product?.stock || 0;
      
      console.log(`📦 Complétion - SKU ${sku}: stock final après MAJ = ${finalStock} (envoi à Shopify)`);
      
      updates.push({
        sku,
        stock_actuel: finalStock  // PAS d'addition, le stock est déjà correct
      });
    }
  });

  console.log('📦 prepareStockUpdatesForCompletion résultat:', updates);
  return updates;
}

/**
 * Récupère les produits depuis Supabase avec un matching case-insensitive des SKUs
 * Évite les pertes de données quand les SKUs ont des casings différents entre les commandes et la DB
 * 
 * @param {Object} supabase - Instance Supabase
 * @param {string[]} skus - Liste des SKUs à rechercher
 * @returns {Promise<Array<{sku: string, stock_actuel: number}>>}
 */
export async function fetchProductsBySkusCaseInsensitive(supabase, skus) {
  if (!skus || skus.length === 0) {
    return [];
  }

  // Filtrer les SKUs vides/null
  const validSkus = skus.filter(sku => sku && typeof sku === 'string' && sku.trim().length > 0);
  
  if (validSkus.length === 0) {
    return [];
  }

  // Fonction utilitaire pour dédupliquer les produits par SKU (case-insensitive)
  // Évite les doublons quand plusieurs SKUs d'entrée différent seulement par la casse
  // et correspondent au même produit en base (ex: "Product1" et "PRODUCT1" → même produit)
  const deduplicateProducts = (products) => {
    if (!products || products.length === 0) return [];
    const seen = new Set();
    return products.filter(product => {
      const skuLower = product.sku?.toLowerCase();
      if (seen.has(skuLower)) {
        return false; // Déjà vu, ignorer ce doublon
      }
      seen.add(skuLower);
      return true;
    });
  };

  try {
    // Stratégie 1: Essayer d'abord avec une requête case-insensitive optimisée
    // Pour un seul SKU, utiliser ilike directement
    // IMPORTANT: Utiliser .limit(1) pour cohérence avec le multi-SKU loop et éviter
    // de retourner plusieurs produits si des doublons existent avec des casings différents
    if (validSkus.length === 1) {
      const { data, error } = await supabase
        .from('produits')
        .select('sku, stock_actuel')
        .ilike('sku', validSkus[0])
        .limit(1);
      
      if (error) {
        console.warn('⚠️ Erreur requête case-insensitive (1 SKU), fallback case-sensitive:', error);
        // Fallback case-sensitive
        const { data: fallbackData } = await supabase
          .from('produits')
          .select('sku, stock_actuel')
          .eq('sku', validSkus[0])
          .limit(1);
        return fallbackData || [];
      }
      return data || [];
    }

    // Pour plusieurs SKUs, construire une requête avec or() et ilike
    // Syntaxe Supabase: .or('sku.ilike.value1,sku.ilike.value2,...')
    // Note: Pour un match exact case-insensitive, on utilise la valeur directement (pas de wildcards %)
    // IMPORTANT: Les requêtes séparées sont plus fiables car elles évitent les problèmes
    // d'échappement des caractères spéciaux PostgREST (virgules, points, parenthèses, etc.)
    // Utiliser un seuil de 10 SKUs pour les requêtes séparées
    let data;
    
    // Fonction pour échapper les caractères spéciaux PostgREST dans les valeurs SKU
    // Les caractères réservés (, . ( ) : ) doivent être échappés via des guillemets doubles
    const escapePostgrestValue = (value) => {
      // Si la valeur contient des caractères réservés PostgREST, l'entourer de guillemets doubles
      // Caractères réservés: virgule, point, parenthèses, deux-points, guillemets
      if (/[,.()\:\"]/.test(value)) {
        // Échapper les guillemets doubles internes en les doublant
        const escaped = value.replace(/"/g, '""');
        return `"${escaped}"`;
      }
      return value;
    };
    
    if (validSkus.length <= 10) {
      // Pour peu de SKUs, faire des requêtes séparées (plus fiable, évite les problèmes d'échappement)
      // IMPORTANT: Distinguer les erreurs de requête des SKUs non trouvés
      const queryResults = await Promise.all(
        validSkus.map(async (sku) => {
          const { data: skuData, error: skuError } = await supabase
            .from('produits')
            .select('sku, stock_actuel')
            .ilike('sku', sku)
            .limit(1);
          
          if (skuError) {
            // Marquer comme erreur, pas comme "non trouvé"
            return { sku, error: skuError, product: null };
          }
          return { sku, error: null, product: skuData?.[0] || null };
        })
      );
      
      // Séparer les résultats : produits trouvés, non trouvés, et erreurs
      const successfulResults = queryResults.filter(r => r.product !== null);
      const errorResults = queryResults.filter(r => r.error !== null);
      const notFoundResults = queryResults.filter(r => r.product === null && r.error === null);
      
      data = successfulResults.map(r => r.product);
      
      // Si des requêtes ont échoué, les réessayer avec un fallback case-sensitive
      if (errorResults.length > 0) {
        console.warn(`⚠️ ${errorResults.length} requête(s) ont échoué, tentative de fallback case-sensitive`);
        const errorSkus = errorResults.map(r => r.sku);
        
        try {
          const { data: retryData, error: retryError } = await supabase
            .from('produits')
            .select('sku, stock_actuel')
            .in('sku', errorSkus);
          
          if (!retryError && retryData) {
            data = [...data, ...retryData];
            console.log(`✅ Récupéré ${retryData.length} produit(s) via fallback pour les requêtes en erreur`);
          } else if (retryError) {
            console.error('❌ Fallback également échoué pour les requêtes en erreur:', retryError);
          }
        } catch (retryException) {
          console.error('❌ Exception lors du fallback:', retryException);
        }
      }
      
      // Note: Les erreurs ont été gérées ci-dessus avec des fallbacks internes
    } else {
      // Pour beaucoup de SKUs, utiliser or() pour la performance
      // IMPORTANT: Les virgules dans les valeurs SKU NE PEUVENT PAS être échappées de manière fiable
      // dans une chaîne .or() car PostgREST utilise la virgule comme séparateur de conditions.
      // Stratégie: séparer les SKUs en deux groupes:
      // 1. SKUs "safe" (sans virgules) → requête .or() groupée
      // 2. SKUs "problématiques" (avec virgules) → requêtes individuelles
      
      const safeSKUs = validSkus.filter(sku => !sku.includes(','));
      const problematicSKUs = validSkus.filter(sku => sku.includes(','));
      
      let safeData = [];
      let problematicData = [];
      
      // 1. Traiter les SKUs safe avec .or()
      if (safeSKUs.length > 0) {
        const orConditions = safeSKUs.map(sku => `sku.ilike.${escapePostgrestValue(sku)}`).join(',');
        const result = await supabase
          .from('produits')
          .select('sku, stock_actuel')
          .or(orConditions);
        
        if (result.error) {
          console.warn('⚠️ Erreur requête .or() pour SKUs safe:', result.error);
          // Fallback: requêtes individuelles pour les SKUs safe aussi
          // IMPORTANT: Capturer et logger les erreurs pour chaque requête individuelle
          const fallbackResults = await Promise.all(
            safeSKUs.map(async (sku) => {
              const { data: skuData, error: skuError } = await supabase
                .from('produits')
                .select('sku, stock_actuel')
                .ilike('sku', sku)
                .limit(1);
              
              if (skuError) {
                console.warn(`⚠️ Erreur fallback pour SKU safe "${sku}":`, skuError);
                return { sku, error: skuError, product: null };
              }
              return { sku, error: null, product: skuData?.[0] || null };
            })
          );
          
          // Extraire les produits trouvés
          safeData = fallbackResults
            .filter(r => r.product !== null)
            .map(r => r.product);
          
          // Logger les erreurs et SKUs non trouvés pour debugging
          const errorCount = fallbackResults.filter(r => r.error !== null).length;
          const notFoundCount = fallbackResults.filter(r => r.product === null && r.error === null).length;
          if (errorCount > 0) {
            console.warn(`⚠️ ${errorCount} requête(s) fallback ont échoué pour SKUs safe`);
          }
          if (notFoundCount > 0) {
            const notFoundSkus = fallbackResults
              .filter(r => r.product === null && r.error === null)
              .map(r => r.sku);
            console.log(`📝 ${notFoundCount} SKU(s) safe non trouvé(s):`, notFoundSkus);
          }
        } else {
          safeData = result.data || [];
        }
      }
      
      // 2. Traiter les SKUs problématiques (avec virgules) individuellement
      if (problematicSKUs.length > 0) {
        console.log(`📝 ${problematicSKUs.length} SKU(s) avec virgules, traitement individuel:`, problematicSKUs);
        const problematicResults = await Promise.all(
          problematicSKUs.map(async (sku) => {
            const { data: skuData, error: skuError } = await supabase
              .from('produits')
              .select('sku, stock_actuel')
              .ilike('sku', sku)
              .limit(1);
            
            if (skuError) {
              console.warn(`⚠️ Erreur pour SKU problématique "${sku}":`, skuError);
              return { sku, error: skuError, product: null };
            }
            return { sku, error: null, product: skuData?.[0] || null };
          })
        );
        
        // Extraire les produits trouvés
        const successfulProblematic = problematicResults.filter(r => r.product !== null);
        const errorProblematic = problematicResults.filter(r => r.error !== null);
        
        problematicData = successfulProblematic.map(r => r.product);
        
        // Si des requêtes ont échoué, les réessayer avec un fallback case-sensitive
        // (cohérent avec le traitement des SKUs ≤10)
        if (errorProblematic.length > 0) {
          console.warn(`⚠️ ${errorProblematic.length} requête(s) ont échoué pour SKUs problématiques, tentative de fallback case-sensitive`);
          const errorSkus = errorProblematic.map(r => r.sku);
          
          try {
            // Pour les SKUs avec virgules, on doit faire des requêtes individuelles même en fallback
            const retryResults = await Promise.all(
              errorSkus.map(async (sku) => {
                const { data: retryData, error: retryError } = await supabase
                  .from('produits')
                  .select('sku, stock_actuel')
                  .eq('sku', sku)
                  .limit(1);
                
                if (retryError) {
                  console.error(`❌ Fallback case-sensitive échoué pour SKU "${sku}":`, retryError);
                  return null;
                }
                return retryData?.[0] || null;
              })
            );
            
            const recoveredProducts = retryResults.filter(p => p !== null);
            if (recoveredProducts.length > 0) {
              problematicData = [...problematicData, ...recoveredProducts];
              console.log(`✅ Récupéré ${recoveredProducts.length} produit(s) via fallback pour SKUs problématiques en erreur`);
            }
          } catch (retryException) {
            console.error('❌ Exception lors du fallback pour SKUs problématiques:', retryException);
          }
        }
      }
      
      // Combiner les résultats
      data = [...safeData, ...problematicData];
      // Note: Les erreurs ont été gérées individuellement dans chaque branche ci-dessus
    }

    // Note: Le fallback case-sensitive global a été supprimé car c'était du code mort.
    // La variable `error` est toujours null à ce stade car chaque branche gère ses propres
    // erreurs avec des fallbacks internes. Le code `if (error)` ne s'exécutait jamais.

    // Vérifier si tous les SKUs ont été trouvés
    const foundSkus = new Set((data || []).map(p => p.sku?.toLowerCase()));
    const missingSkus = validSkus.filter(sku => !foundSkus.has(sku?.toLowerCase()));
    
    if (missingSkus.length > 0) {
      console.warn('⚠️ SKUs non trouvés même avec matching case-insensitive:', missingSkus);
      console.warn('⚠️ Ces SKUs peuvent causer l\'envoi de stock=0 à Shopify au lieu de la valeur réelle');
      
      // Essayer de trouver les SKUs manquants avec des variantes de casing
      // NOTE: Ce fallback est CRITIQUE surtout quand TOUS les SKUs sont manquants
      // (cas où missingSkus.length === validSkus.length), donc on l'exécute toujours
      // 
      // IMPORTANT: On évite le full-table scan car Supabase a une limite par défaut (~1000 lignes)
      // Si la table produits dépasse cette limite, certains SKUs ne seraient jamais trouvés.
      // À la place, on fait des requêtes ciblées avec différentes variantes de casing.
      try {
        const additionalProducts = [];
        
        // Stratégie 1: Essayer avec des variantes de casing courantes
        // (uppercase, lowercase, original) via des requêtes .eq() groupées
        const casingVariants = missingSkus.flatMap(sku => [
          sku,                    // Original
          sku.toUpperCase(),      // UPPERCASE
          sku.toLowerCase(),      // lowercase
          // Title case (première lettre majuscule)
          sku.charAt(0).toUpperCase() + sku.slice(1).toLowerCase()
        ]);
        
        // Dédupliquer les variantes
        const uniqueVariants = [...new Set(casingVariants)];
        
        // Faire une requête .in() avec toutes les variantes (case-sensitive)
        // Note: .in() supporte jusqu'à plusieurs milliers d'éléments
        const { data: variantProducts, error: variantError } = await supabase
          .from('produits')
          .select('sku, stock_actuel')
          .in('sku', uniqueVariants);
        
        if (variantError) {
          console.warn('⚠️ Erreur lors du fallback avec variantes de casing:', variantError);
        } else if (variantProducts && variantProducts.length > 0) {
          // Filtrer pour ne garder que ceux qui correspondent aux SKUs manquants (case-insensitive)
          const matchedProducts = variantProducts.filter(product => {
            const productSkuLower = product.sku?.toLowerCase();
            return missingSkus.some(missingSku => missingSku?.toLowerCase() === productSkuLower);
          });
          
          // Dédupliquer par SKU (garder le premier match pour chaque SKU manquant)
          const seenSkus = new Set();
          matchedProducts.forEach(product => {
            const skuLower = product.sku?.toLowerCase();
            if (!seenSkus.has(skuLower)) {
              seenSkus.add(skuLower);
              additionalProducts.push(product);
            }
          });
        }
        
        if (additionalProducts.length > 0) {
          console.log('✅ Trouvé', additionalProducts.length, 'produit(s) supplémentaire(s) avec variantes de casing');
          return deduplicateProducts([...(data || []), ...additionalProducts]);
        } else {
          // Dernière tentative: requêtes individuelles pour chaque SKU manquant
          // Cela couvre les cas où le casing est complètement différent
          console.log('📝 Tentative de requêtes individuelles pour', missingSkus.length, 'SKU(s) manquant(s)');
          
          const individualResults = await Promise.all(
            missingSkus.map(async (sku) => {
              // Essayer d'abord case-sensitive exact
              const { data: exactData } = await supabase
                .from('produits')
                .select('sku, stock_actuel')
                .eq('sku', sku)
                .limit(1);
              
              if (exactData && exactData.length > 0) {
                return exactData[0];
              }
              
              // Sinon essayer uppercase/lowercase
              const { data: upperData } = await supabase
                .from('produits')
                .select('sku, stock_actuel')
                .eq('sku', sku.toUpperCase())
                .limit(1);
              
              if (upperData && upperData.length > 0) {
                return upperData[0];
              }
              
              const { data: lowerData } = await supabase
                .from('produits')
                .select('sku, stock_actuel')
                .eq('sku', sku.toLowerCase())
                .limit(1);
              
              return lowerData?.[0] || null;
            })
          );
          
          const recoveredProducts = individualResults.filter(p => p !== null);
          if (recoveredProducts.length > 0) {
            console.log('✅ Récupéré', recoveredProducts.length, 'produit(s) via requêtes individuelles');
            return deduplicateProducts([...(data || []), ...recoveredProducts]);
          }
          
          console.warn('⚠️ Aucun produit trouvé même avec le fallback - ces SKUs n\'existent probablement pas dans la base');
        }
      } catch (fallbackException) {
        console.error('❌ Exception lors du fallback pour SKUs manquants:', fallbackException);
      }
    }

    // Dédupliquer les résultats finaux pour éviter les doublons
    // (peut arriver si plusieurs SKUs d'entrée correspondent au même produit)
    return deduplicateProducts(data || []);
  } catch (error) {
    console.error('❌ Erreur inattendue lors de la récupération des produits:', error);
    // Dernier recours: requête case-sensitive
    try {
      const { data: fallbackData } = await supabase
        .from('produits')
        .select('sku, stock_actuel')
        .in('sku', validSkus);
      return fallbackData || [];
    } catch (fallbackError) {
      console.error('❌ Erreur avec le fallback final:', fallbackError);
      return [];
    }
  }
}

export default {
  updateShopifyInventory,
  isProductTrackedInShopify,
  prepareStockUpdatesFromReconciliation,
  prepareStockUpdatesForCompletion,
  fetchProductsBySkusCaseInsensitive
};

