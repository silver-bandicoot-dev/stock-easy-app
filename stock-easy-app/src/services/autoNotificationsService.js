/**
 * Service de notifications automatiques (v2 avec déduplication anti-spam)
 * 
 * Gère la création de notifications pour :
 * - Alertes de stock (rupture, bientôt en rupture)
 * - Produits non mappés avec fournisseurs
 * - Rapports hebdomadaires
 * - Commandes en retard
 * - Écarts de réception
 * - Surstock profond
 * - Informations fournisseurs manquantes
 * 
 * Utilise create_notification_v2 avec système de déduplication pour éviter le spam.
 * Chaque notification a une clé unique et un cooldown qui empêche les doublons.
 */

import { supabase } from '../lib/supabaseClient';

// ============================================
// Configuration des cooldowns par type
// ============================================

const COOLDOWN_CONFIG = {
  stock_alert_critical: 24,      // 24h avant de re-notifier pour les ruptures
  stock_alert_warning: 12,       // 12h pour les alertes de stock bas
  unmapped_product: 24,          // 24h pour les produits sans fournisseur
  weekly_report: 168,            // 7 jours (une fois par semaine)
  order_delayed_critical: 24,    // 24h pour les commandes très en retard
  order_delayed_warning: 12,     // 12h pour les commandes légèrement en retard
  order_discrepancy: 48,         // 48h pour les écarts de réception
  surstock_alert: 24,            // 24h pour les alertes de surstock
  missing_supplier_info: 48,     // 48h pour les infos fournisseurs manquantes
  missing_product_moq: 48        // 48h pour les produits sans MOQ
};

// ============================================
// Fonction de création avec déduplication
// ============================================

/**
 * Crée une notification avec déduplication anti-spam
 * Utilise create_notification_v2 de PostgreSQL
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {string} type - Type de notification
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} link - Lien optionnel vers la ressource
 * @param {Object} metadata - Métadonnées supplémentaires
 * @param {string} dedupKey - Clé de déduplication unique
 * @param {number} cooldownHours - Heures avant de pouvoir renvoyer la même notification
 */
export async function createNotification(
  userId, 
  type, 
  title, 
  message, 
  link = null, 
  metadata = {},
  dedupKey = null,
  cooldownHours = 24
) {
  try {
    // Utiliser la fonction v2 avec déduplication
    const { data, error } = await supabase.rpc('create_notification_v2', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_link: link,
      p_metadata: metadata,
      p_dedup_key: dedupKey,
      p_cooldown_hours: cooldownHours
    });

    if (error) {
      console.error('Erreur création notification:', error);
      return { success: false, error, skipped: false };
    }

    // Si data est null, la notification a été ignorée (cooldown actif ou désactivée)
    if (data === null) {
      return { success: true, skipped: true, reason: 'cooldown_active_or_disabled' };
    }

    return { success: true, data, skipped: false };
  } catch (error) {
    console.error('Erreur création notification:', error);
    return { success: false, error, skipped: false };
  }
}

/**
 * Crée des notifications pour tous les utilisateurs d'une entreprise avec déduplication
 * @param {Array<string>} userIds - Liste des IDs utilisateurs
 * @param {string} type - Type de notification
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} link - Lien optionnel
 * @param {Object} metadata - Métadonnées supplémentaires
 * @param {string} dedupKey - Clé de déduplication (sera suffixée avec l'userId)
 * @param {number} cooldownHours - Heures de cooldown
 */
export async function createNotificationsForUsers(
  userIds, 
  type, 
  title, 
  message, 
  link = null, 
  metadata = {},
  dedupKey = null,
  cooldownHours = 24
) {
  const results = await Promise.all(
    userIds.map(userId => {
      // Ajouter l'userId à la clé de déduplication pour que chaque utilisateur ait son propre cooldown
      const userDedupKey = dedupKey ? `${dedupKey}_${userId}` : null;
      return createNotification(userId, type, title, message, link, metadata, userDedupKey, cooldownHours);
    })
  );

  const successCount = results.filter(r => r.success && !r.skipped).length;
  const skippedCount = results.filter(r => r.skipped).length;
  
  return { 
    success: successCount > 0 || skippedCount > 0, 
    successCount, 
    skippedCount,
    total: userIds.length 
  };
}

// ============================================
// Fonctions de vérification (inchangées)
// ============================================

/**
 * Vérifie les produits en rupture ou bientôt en rupture
 * @param {Array} products - Liste des produits
 * @returns {Object} { critical: [], warning: [] }
 */
export function checkStockAlerts(products) {
  const critical = []; // En rupture (stock <= 0 ou <= securityStock)
  const warning = []; // Bientôt en rupture (stock <= reorderPoint)

  products.forEach(product => {
    const stock = product.stock || 0;
    const reorderPoint = product.reorderPoint || 0;
    const securityStock = product.securityStock || 0;
    const productName = product.name || product.sku;

    // Rupture critique
    if (stock <= 0 || stock <= securityStock) {
      critical.push({
        sku: product.sku,
        name: productName,
        stock,
        reorderPoint,
        securityStock
      });
    }
    // Bientôt en rupture (entre securityStock et reorderPoint)
    else if (stock <= reorderPoint && stock > securityStock) {
      warning.push({
        sku: product.sku,
        name: productName,
        stock,
        reorderPoint,
        securityStock
      });
    }
  });

  return { critical, warning };
}

/**
 * Vérifie les produits non mappés avec des fournisseurs
 * @param {Array} products - Liste des produits
 * @returns {Array} Liste des produits sans fournisseur
 */
export function checkUnmappedProducts(products) {
  return products.filter(product => {
    // Un produit est non mappé s'il n'a pas de fournisseur assigné
    return !product.supplier || product.supplier.trim() === '';
  }).map(product => ({
    sku: product.sku,
    name: product.name || product.sku
  }));
}

// ============================================
// Fonctions de notification avec déduplication
// ============================================

/**
 * Crée des notifications pour les alertes de stock avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Array} products - Liste des produits
 */
export async function notifyStockAlerts(userIds, products) {
  const { critical, warning } = checkStockAlerts(products);

  const notifications = [];

  // Notifications pour les ruptures critiques
  if (critical.length > 0) {
    const criticalCount = critical.length;
    const productList = critical.slice(0, 5).map(p => p.name).join(', ');
    const moreText = criticalCount > 5 ? ` et ${criticalCount - 5} autre(s)` : '';

    const title = criticalCount === 1 
      ? '🚨 Rupture de stock détectée'
      : `🚨 ${criticalCount} ruptures de stock détectées`;

    const message = criticalCount === 1
      ? `${critical[0].name} est en rupture de stock (${critical[0].stock} unité(s) restante(s))`
      : `${productList}${moreText} ${criticalCount === 1 ? 'est' : 'sont'} en rupture de stock`;

    // Clé de déduplication basée sur les SKUs en rupture (triés pour consistance)
    const skuHash = critical.map(p => p.sku).sort().join('_').substring(0, 50);
    
    notifications.push({
      type: 'stock_alert',
      title,
      message,
      link: '/app/stock?filter=urgent',
      metadata: { 
        severity: 'critical',
        count: criticalCount,
        products: critical.map(p => p.sku)
      },
      dedupKey: `stock_critical_${skuHash}`,
      cooldownHours: COOLDOWN_CONFIG.stock_alert_critical
    });
  }

  // Notifications pour les alertes d'avertissement
  if (warning.length > 0) {
    const warningCount = warning.length;
    const productList = warning.slice(0, 5).map(p => p.name).join(', ');
    const moreText = warningCount > 5 ? ` et ${warningCount - 5} autre(s)` : '';

    const title = warningCount === 1
      ? '⚠️ Stock bientôt en rupture'
      : `⚠️ ${warningCount} produits bientôt en rupture`;

    const message = warningCount === 1
      ? `${warning[0].name} approche du point de réapprovisionnement (${warning[0].stock} unité(s))`
      : `${productList}${moreText} ${warningCount === 1 ? 'approche' : 'approchent'} du point de réapprovisionnement`;

    // Clé de déduplication basée sur les SKUs en warning
    const skuHash = warning.map(p => p.sku).sort().join('_').substring(0, 50);

    notifications.push({
      type: 'stock_alert',
      title,
      message,
      link: '/app/stock?filter=warning',
      metadata: {
        severity: 'warning',
        count: warningCount,
        products: warning.map(p => p.sku)
      },
      dedupKey: `stock_warning_${skuHash}`,
      cooldownHours: COOLDOWN_CONFIG.stock_alert_warning
    });
  }

  // Créer les notifications pour tous les utilisateurs
  let totalCreated = 0;
  let totalSkipped = 0;
  
  if (notifications.length > 0) {
    for (const notif of notifications) {
      const result = await createNotificationsForUsers(
        userIds,
        notif.type,
        notif.title,
        notif.message,
        notif.link,
        notif.metadata,
        notif.dedupKey,
        notif.cooldownHours
      );
      totalCreated += result.successCount;
      totalSkipped += result.skippedCount;
    }
  }

  return { 
    critical, 
    warning, 
    notificationsCreated: totalCreated,
    notificationsSkipped: totalSkipped
  };
}

/**
 * Crée des notifications pour les produits non mappés avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Array} products - Liste des produits
 */
export async function notifyUnmappedProducts(userIds, products) {
  const unmapped = checkUnmappedProducts(products);

  if (unmapped.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  const count = unmapped.length;
  const productList = unmapped.slice(0, 5).map(p => p.name).join(', ');
  const moreText = count > 5 ? ` et ${count - 5} autre(s)` : '';

  const title = count === 1
    ? '📦 Produit sans fournisseur'
    : `📦 ${count} produits sans fournisseur`;

  const message = count === 1
    ? `${unmapped[0].name} n'a pas de fournisseur assigné. Veuillez le mapper pour pouvoir passer commande.`
    : `${productList}${moreText} ${count === 1 ? 'n\'a' : 'n\'ont'} pas de fournisseur assigné. Veuillez les mapper pour pouvoir passer commande.`;

  // Clé de déduplication quotidienne (basée sur la date)
  const today = new Date().toISOString().split('T')[0];
  
  const result = await createNotificationsForUsers(
    userIds,
    'unmapped_product',
    title,
    message,
    '/app/settings/suppliers', // Route vers la gestion des fournisseurs
    {
      count,
      products: unmapped.map(p => p.sku)
    },
    `unmapped_${today}_${count}`,
    COOLDOWN_CONFIG.unmapped_product
  );

  return { 
    count, 
    notificationsCreated: result.successCount,
    notificationsSkipped: result.skippedCount
  };
}

/**
 * Génère un rapport hebdomadaire et crée une notification avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Object} data - Données pour le rapport { products, orders, suppliers }
 */
export async function notifyWeeklyReport(userIds, data) {
  const { products = [], orders = [], suppliers = {} } = data;

  // Calculer les statistiques
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalSuppliers = Object.keys(suppliers).length;

  // Produits en rupture
  const { critical } = checkStockAlerts(products);
  const criticalCount = critical.length;

  // Produits non mappés
  const unmapped = checkUnmappedProducts(products);
  const unmappedCount = unmapped.length;

  // Commandes en cours
  const ordersInProgress = orders.filter(o => 
    ['pending_confirmation', 'preparing', 'in_transit'].includes(o.status)
  ).length;

  // Commandes en attente de réception
  const ordersPendingReceipt = orders.filter(o => 
    o.status === 'shipped' || o.status === 'in_transit'
  ).length;

  // Générer le message du rapport
  const reportDate = new Date().toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let message = `📊 Rapport hebdomadaire - ${reportDate}\n\n`;
  message += `📦 Produits: ${totalProducts}\n`;
  message += `🚚 Fournisseurs: ${totalSuppliers}\n`;
  message += `📋 Commandes totales: ${totalOrders}\n`;
  message += `⏳ Commandes en cours: ${ordersInProgress}\n`;
  message += `📬 Commandes en transit: ${ordersPendingReceipt}\n\n`;

  if (criticalCount > 0) {
    message += `🚨 ${criticalCount} produit(s) en rupture de stock\n`;
  }

  if (unmappedCount > 0) {
    message += `⚠️ ${unmappedCount} produit(s) sans fournisseur\n`;
  }

  if (criticalCount === 0 && unmappedCount === 0) {
    message += `✅ Tout est en ordre !`;
  }

  const title = `📊 Rapport hebdomadaire - ${new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}`;

  // Clé de déduplication basée sur la semaine (année + numéro de semaine)
  const weekNumber = getWeekNumber(new Date());
  
  const result = await createNotificationsForUsers(
    userIds,
    'weekly_report',
    title,
    message,
    '/app/analytics/kpis',
    {
      reportDate: new Date().toISOString(),
      stats: {
        totalProducts,
        totalOrders,
        totalSuppliers,
        criticalCount,
        unmappedCount,
        ordersInProgress,
        ordersPendingReceipt
      }
    },
    `weekly_report_${weekNumber}`,
    COOLDOWN_CONFIG.weekly_report
  );

  return { 
    success: result.successCount > 0,
    notificationsCreated: result.successCount,
    notificationsSkipped: result.skippedCount
  };
}

/**
 * Récupère le numéro de semaine de l'année
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

/**
 * Récupère tous les utilisateurs d'une entreprise
 * @param {string} companyId - ID de l'entreprise (optionnel, si null récupère l'utilisateur actuel)
 * @returns {Promise<Array<string>>} Liste des IDs utilisateurs
 */
export async function getCompanyUserIds(companyId = null) {
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return [];
    }

    // Si pas de companyId, retourner uniquement l'utilisateur actuel
    if (!companyId) {
      // Essayer de récupérer l'entreprise de l'utilisateur
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('company_id')
        .eq('user_id', currentUser.id)
        .single();

      if (profile?.company_id) {
        companyId = profile.company_id;
      } else {
        // Pas d'entreprise, retourner uniquement l'utilisateur actuel
        return [currentUser.id];
      }
    }

    // Récupérer tous les utilisateurs de l'entreprise
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('company_id', companyId);

    if (error) {
      console.error('Erreur récupération utilisateurs entreprise:', error);
      // En cas d'erreur, retourner au moins l'utilisateur actuel
      return [currentUser.id];
    }

    return profiles?.map(p => p.user_id) || [currentUser.id];
  } catch (error) {
    console.error('Erreur getCompanyUserIds:', error);
    // En cas d'erreur, retourner au moins l'utilisateur actuel
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    return currentUser ? [currentUser.id] : [];
  }
}

/**
 * Vérifie les commandes en retard
 * @param {Array} orders - Liste des commandes
 * @returns {Array} Liste des commandes en retard
 */
export function checkDelayedOrders(orders) {
  const now = new Date();
  const delayed = [];

  orders.forEach(order => {
    // Une commande est en retard si :
    // 1. Elle a une ETA (date estimée)
    // 2. L'ETA est dépassée
    // 3. Elle est toujours en cours (preparing, in_transit, shipped)
    if (order.eta) {
      const etaDate = new Date(order.eta);
      if (etaDate < now && ['preparing', 'in_transit', 'shipped'].includes(order.status)) {
        const daysLate = Math.floor((now - etaDate) / (1000 * 60 * 60 * 24));
        delayed.push({
          id: order.id,
          supplier: order.supplier || 'Fournisseur inconnu',
          eta: order.eta,
          status: order.status,
          daysLate
        });
      }
    }
  });

  return delayed;
}

/**
 * Crée des notifications pour les commandes en retard avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Array} orders - Liste des commandes
 */
export async function notifyOrderDelayed(userIds, orders) {
  const delayed = checkDelayedOrders(orders);

  if (delayed.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  // Grouper par nombre de jours de retard pour créer des notifications pertinentes
  const critical = delayed.filter(o => o.daysLate >= 3); // 3+ jours de retard = critique
  const warning = delayed.filter(o => o.daysLate < 3); // Moins de 3 jours = avertissement

  const notifications = [];

  // Notifications critiques (3+ jours de retard)
  if (critical.length > 0) {
    const criticalCount = critical.length;
    const orderList = critical.slice(0, 3).map(o => o.id).join(', ');
    const moreText = criticalCount > 3 ? ` et ${criticalCount - 3} autre(s)` : '';

    const title = criticalCount === 1
      ? '⏰ Commande en retard critique'
      : `⏰ ${criticalCount} commandes en retard critique`;

    const message = criticalCount === 1
      ? `Commande ${critical[0].id} en retard de ${critical[0].daysLate} jour(s) - Fournisseur: ${critical[0].supplier}`
      : `Commandes ${orderList}${moreText} en retard de 3+ jour(s). Vérifier avec les fournisseurs.`;

    // Clé basée sur les IDs de commandes critiques
    const orderHash = critical.map(o => o.id).sort().join('_').substring(0, 50);

    notifications.push({
      type: 'order_delayed',
      title,
      message,
      link: '/app/orders?filter=delayed',
      metadata: {
        severity: 'critical',
        count: criticalCount,
        orders: critical.map(o => o.id),
        daysLate: critical.map(o => o.daysLate)
      },
      dedupKey: `delayed_critical_${orderHash}`,
      cooldownHours: COOLDOWN_CONFIG.order_delayed_critical
    });
  }

  // Notifications d'avertissement (moins de 3 jours)
  if (warning.length > 0) {
    const warningCount = warning.length;
    const orderList = warning.slice(0, 3).map(o => o.id).join(', ');
    const moreText = warningCount > 3 ? ` et ${warningCount - 3} autre(s)` : '';

    const title = warningCount === 1
      ? '⏰ Commande en retard'
      : `⏰ ${warningCount} commandes en retard`;

    const message = warningCount === 1
      ? `Commande ${warning[0].id} en retard de ${warning[0].daysLate} jour(s) - Fournisseur: ${warning[0].supplier}`
      : `Commandes ${orderList}${moreText} en retard. Surveiller de près.`;

    // Clé basée sur les IDs de commandes en warning
    const orderHash = warning.map(o => o.id).sort().join('_').substring(0, 50);

    notifications.push({
      type: 'order_delayed',
      title,
      message,
      link: '/app/orders?filter=delayed',
      metadata: {
        severity: 'warning',
        count: warningCount,
        orders: warning.map(o => o.id),
        daysLate: warning.map(o => o.daysLate)
      },
      dedupKey: `delayed_warning_${orderHash}`,
      cooldownHours: COOLDOWN_CONFIG.order_delayed_warning
    });
  }

  // Créer les notifications
  let totalCreated = 0;
  let totalSkipped = 0;
  
  if (notifications.length > 0) {
    for (const notif of notifications) {
      const result = await createNotificationsForUsers(
        userIds,
        notif.type,
        notif.title,
        notif.message,
        notif.link,
        notif.metadata,
        notif.dedupKey,
        notif.cooldownHours
      );
      totalCreated += result.successCount;
      totalSkipped += result.skippedCount;
    }
  }

  return { 
    count: delayed.length, 
    notificationsCreated: totalCreated,
    notificationsSkipped: totalSkipped
  };
}

/**
 * Vérifie les commandes avec des écarts de réception
 * @param {Array} orders - Liste des commandes
 * @returns {Array} Liste des commandes avec écarts
 */
export function checkOrderDiscrepancies(orders) {
  return orders.filter(order => {
    // Une commande a des écarts si :
    // 1. Elle a le flag hasDiscrepancy = true
    // 2. OU elle a des items avec discrepancyType !== 'none'
    // 3. OU elle a un damageReport = true
    // 4. ET elle n'est pas encore complétée
    if (order.status === 'completed') return false;

    const hasDiscrepancyFlag = order.hasDiscrepancy === true;
    const hasDamageReport = order.damageReport === true;
    const hasItemDiscrepancies = order.items?.some(item => 
      item.discrepancyType && item.discrepancyType !== 'none'
    );

    return hasDiscrepancyFlag || hasDamageReport || hasItemDiscrepancies;
  }).map(order => {
    // Compter les types d'écarts
    const missingItems = order.items?.filter(item => 
      item.discrepancyType === 'missing' || 
      (item.receivedQuantity !== undefined && item.receivedQuantity < item.quantity)
    ) || [];
    
    const damagedItems = order.items?.filter(item => 
      item.discrepancyType === 'damaged' || 
      (item.damagedQuantity && item.damagedQuantity > 0)
    ) || [];

    return {
      id: order.id,
      supplier: order.supplier || 'Fournisseur inconnu',
      status: order.status,
      missingCount: missingItems.length,
      damagedCount: damagedItems.length,
      hasDiscrepancy: order.hasDiscrepancy,
      damageReport: order.damageReport
    };
  });
}

/**
 * Crée des notifications pour les écarts de réception avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Array} orders - Liste des commandes
 */
export async function notifyOrderDiscrepancy(userIds, orders) {
  const discrepancies = checkOrderDiscrepancies(orders);

  if (discrepancies.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  let totalCreated = 0;
  let totalSkipped = 0;

  // Créer une notification par commande avec écarts (pour plus de précision)
  for (const order of discrepancies) {
    let message = '';
    let title = '';

    if (order.missingCount > 0 && order.damagedCount > 0) {
      title = `⚠️ Commande ${order.id} : Écarts détectés`;
      message = `Commande ${order.id} (${order.supplier}) : ${order.missingCount} article(s) manquant(s) et ${order.damagedCount} article(s) endommagé(s). Vérifier et valider la réception.`;
    } else if (order.missingCount > 0) {
      title = `⚠️ Commande ${order.id} : Articles manquants`;
      message = `Commande ${order.id} (${order.supplier}) : ${order.missingCount} article(s) manquant(s). Vérifier la réception et envoyer une réclamation si nécessaire.`;
    } else if (order.damagedCount > 0) {
      title = `⚠️ Commande ${order.id} : Articles endommagés`;
      message = `Commande ${order.id} (${order.supplier}) : ${order.damagedCount} article(s) endommagé(s). Documenter et envoyer une réclamation si nécessaire.`;
    } else {
      title = `⚠️ Commande ${order.id} : Écarts détectés`;
      message = `Commande ${order.id} (${order.supplier}) : Des écarts ont été détectés. Vérifier la réception.`;
    }

    const result = await createNotificationsForUsers(
      userIds,
      'order_discrepancy',
      title,
      message,
      `/app/orders?order=${order.id}&section=reconciliation`,
      {
        orderId: order.id,
        supplier: order.supplier,
        missingCount: order.missingCount,
        damagedCount: order.damagedCount
      },
      `discrepancy_${order.id}`, // Clé unique par commande
      COOLDOWN_CONFIG.order_discrepancy
    );
    
    totalCreated += result.successCount;
    totalSkipped += result.skippedCount;
  }

  return { 
    count: discrepancies.length, 
    notificationsCreated: totalCreated,
    notificationsSkipped: totalSkipped
  };
}

/**
 * Vérifie les produits en surstock profond
 * @param {Array} products - Liste des produits
 * @param {number} thresholdDays - Seuil en jours d'autonomie (défaut: 90)
 * @returns {Array} Liste des produits en surstock
 */
export function checkSurstockProducts(products, thresholdDays = 90) {
  return products.filter(product => {
    // Un produit est en surstock si :
    // 1. Il a un daysOfStock calculé
    // 2. daysOfStock >= thresholdDays
    // 3. Il a des ventes (sinon c'est normal d'avoir beaucoup de stock)
    const daysOfStock = product.daysOfStock;
    const hasSales = (product.salesPerDay || 0) > 0;

    return daysOfStock !== undefined && 
           daysOfStock !== null && 
           daysOfStock >= thresholdDays && 
           hasSales;
  }).map(product => ({
    sku: product.sku,
    name: product.name || product.sku,
    stock: product.stock || 0,
    daysOfStock: product.daysOfStock,
    salesPerDay: product.salesPerDay || 0
  }));
}

/**
 * Crée des notifications pour les surstocks avec déduplication
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Array} products - Liste des produits
 * @param {number} thresholdDays - Seuil en jours d'autonomie
 */
export async function notifySurstockAlert(userIds, products, thresholdDays = 90) {
  const surstock = checkSurstockProducts(products, thresholdDays);

  if (surstock.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  const count = surstock.length;
  const productList = surstock.slice(0, 5).map(p => p.name).join(', ');
  const moreText = count > 5 ? ` et ${count - 5} autre(s)` : '';

  // Calculer la valeur totale du surstock
  const totalValue = surstock.reduce((sum, p) => {
    const product = products.find(prod => prod.sku === p.sku);
    const value = (product?.buyPrice || 0) * p.stock;
    return sum + value;
  }, 0);

  const title = count === 1
    ? '📦 Surstock détecté'
    : `📦 ${count} produits en surstock`;

  const message = count === 1
    ? `${surstock[0].name} : ${surstock[0].daysOfStock} jours d'autonomie (seuil: ${thresholdDays} jours). Capital immobilisé: ${totalValue > 0 ? totalValue.toFixed(2) + '€' : 'N/A'}`
    : `${productList}${moreText} ${count === 1 ? 'est' : 'sont'} en surstock (${thresholdDays}+ jours d'autonomie). Capital total immobilisé estimé.`;

  // Clé quotidienne pour éviter le spam
  const today = new Date().toISOString().split('T')[0];
  
  const result = await createNotificationsForUsers(
    userIds,
    'surstock_alert',
    title,
    message,
    '/app/stock?filter=overstock',
    {
      count,
      thresholdDays,
      products: surstock.map(p => p.sku),
      totalValue
    },
    `surstock_${today}_${count}`,
    COOLDOWN_CONFIG.surstock_alert
  );

  return { 
    count, 
    notificationsCreated: result.successCount,
    notificationsSkipped: result.skippedCount
  };
}

/**
 * Vérifie les fournisseurs avec des informations manquantes
 * @param {Object} suppliers - Map des fournisseurs { name: supplierObject }
 * @returns {Array} Liste des fournisseurs avec informations manquantes
 */
export function checkMissingSupplierInfo(suppliers) {
  const suppliersList = Object.values(suppliers || {});
  const incomplete = [];

  suppliersList.forEach(supplier => {
    const missing = [];
    
    // Vérifier les champs critiques
    if (!supplier.email || supplier.email.trim() === '') {
      missing.push('email');
    }
    if (!supplier.leadTimeDays || supplier.leadTimeDays <= 0) {
      missing.push('délai de livraison');
    }

    if (missing.length > 0) {
      incomplete.push({
        name: supplier.name || 'Fournisseur sans nom',
        missing: missing
      });
    }
  });

  return incomplete;
}

/**
 * Crée des notifications pour les fournisseurs avec informations manquantes
 * @param {Array} userIds - Liste des IDs utilisateurs
 * @param {Object} suppliers - Map des fournisseurs
 */
export async function notifyMissingSupplierInfo(userIds, suppliers) {
  const incomplete = checkMissingSupplierInfo(suppliers);

  if (incomplete.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  const count = incomplete.length;
  const supplierList = incomplete.slice(0, 5).map(s => s.name).join(', ');
  const moreText = count > 5 ? ` et ${count - 5} autre(s)` : '';

  // Créer une notification groupée
  const title = count === 1
    ? '⚠️ Fournisseur : Informations incomplètes'
    : `⚠️ ${count} fournisseurs : Informations incomplètes`;

  let message = count === 1
    ? `${incomplete[0].name} : ${incomplete[0].missing.join(', ')} manquant(s). Compléter pour optimiser les commandes.`
    : `${supplierList}${moreText} ${count === 1 ? 'a' : 'ont'} des informations manquantes (email, délai). Compléter les données pour améliorer la gestion.`;

  // Clé basée sur les noms de fournisseurs incomplets
  const supplierHash = incomplete.map(s => s.name).sort().join('_').substring(0, 50);
  
  const result = await createNotificationsForUsers(
    userIds,
    'missing_supplier_info',
    title,
    message,
    '/app/settings/suppliers',
    {
      count,
      suppliers: incomplete.map(s => ({
        name: s.name,
        missing: s.missing
      }))
    },
    `supplier_info_${supplierHash}`,
    COOLDOWN_CONFIG.missing_supplier_info
  );

  return { 
    count, 
    notificationsCreated: result.successCount,
    notificationsSkipped: result.skippedCount
  };
}

/**
 * Vérifie les produits sans MOQ défini
 * @param {Array} products - Liste des produits
 * @returns {Array} Liste des produits sans MOQ
 */
export function checkProductsMissingMoq(products) {
  return (products || []).filter(product => {
    const moq = product.moq;
    return moq === undefined || moq === null || moq <= 0;
  }).map(product => ({
    sku: product.sku,
    name: product.name || product.sku
  }));
}

/**
 * Crée des notifications pour les produits sans MOQ
 * @param {Array<string>} userIds - Liste des IDs utilisateurs
 * @param {Array} products - Liste des produits
 */
export async function notifyMissingProductMoq(userIds, products) {
  const missing = checkProductsMissingMoq(products);

  if (missing.length === 0) {
    return { count: 0, notificationsCreated: 0, notificationsSkipped: 0 };
  }

  const count = missing.length;
  const productList = missing.slice(0, 5).map(p => p.name).join(', ');
  const moreText = count > 5 ? ` et ${count - 5} autre(s)` : '';

  const title = count === 1
    ? '⚠️ Produit sans MOQ'
    : `⚠️ ${count} produits sans MOQ`;

  const message = count === 1
    ? `${missing[0].name} n'a pas de MOQ défini. Définir un MOQ au niveau produit pour sécuriser les calculs de réapprovisionnement.`
    : `${productList}${moreText} ${count === 1 ? 'n\'a' : 'n\'ont'} pas de MOQ défini. Définir un MOQ au niveau produit pour sécuriser les calculs de réapprovisionnement.`;

  // Clé quotidienne
  const today = new Date().toISOString().split('T')[0];
  
  const result = await createNotificationsForUsers(
    userIds,
    'missing_product_moq',
    title,
    message,
    '/app/stock',
    {
      count,
      products: missing.map(p => p.sku)
    },
    `moq_missing_${today}_${count}`,
    COOLDOWN_CONFIG.missing_product_moq
  );

  return { 
    count, 
    notificationsCreated: result.successCount,
    notificationsSkipped: result.skippedCount
  };
}
