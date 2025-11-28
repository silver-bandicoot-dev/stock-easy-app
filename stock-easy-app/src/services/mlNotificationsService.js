/**
 * Service pour les notifications Machine Learning
 * Crée des notifications dans Supabase pour les recommandations ML importantes
 * Version 2.0 avec déduplication et respect des préférences utilisateur
 */

import { createNotificationsForUsersV2 } from './notificationsService';
import { getCompanyUserIds } from './autoNotificationsService';
import { generateMLAlerts, generateAutoRecommendations } from './ml/alertService';

/**
 * Crée des notifications pour les alertes ML critiques (confiance élevée)
 * Avec déduplication basée sur le SKU
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 * @param {number} confidenceThreshold - Seuil de confiance minimum (défaut: 80%)
 */
export async function notifyMLCriticalAlerts(products, forecasts, confidenceThreshold = 80) {
  if (!forecasts || Object.keys(forecasts).length === 0) {
    return { success: true, count: 0, skipped: 0 };
  }

  try {
    const alerts = generateMLAlerts(products, forecasts);
    
    // Filtrer uniquement les alertes critiques ou de haute priorité
    const criticalAlerts = alerts.filter(alert => 
      (alert.severity === 'critical' || alert.severity === 'high')
    );

    if (criticalAlerts.length === 0) {
      return { success: true, count: 0, skipped: 0 };
    }

    // Récupérer tous les utilisateurs de l'entreprise
    const userIds = await getCompanyUserIds();
    if (userIds.length === 0) {
      return { success: true, count: 0, skipped: 0 };
    }

    let successCount = 0;
    let skippedCount = 0;

    // Créer une notification par alerte critique (max 5)
    // Utiliser la déduplication basée sur le SKU avec un cooldown de 24h
    for (const alert of criticalAlerts.slice(0, 5)) {
      const title = alert.severity === 'critical' 
        ? `🚨 ML: ${alert.message}`
        : `⚠️ ML: ${alert.message}`;

      const result = await createNotificationsForUsersV2(
        userIds,
        'ml_alert',
        title,
        alert.details || alert.message,
        '/stock?sku=' + alert.sku,
        {
          severity: alert.severity,
          sku: alert.sku,
          productName: alert.productName,
          alertType: alert.type,
          action: alert.action,
          confidence: alert.confidence || 'high'
        },
        `ml_alert_${alert.sku}`, // Clé de déduplication basée sur le SKU
        24 // Cooldown de 24h
      );

      if (result.successCount > 0) {
        successCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Alertes ML: ${successCount} envoyées, ${skippedCount} ignorées (cooldown)`);
    return { success: true, count: successCount, skipped: skippedCount };
  } catch (error) {
    console.error('Erreur création notifications ML critiques:', error);
    return { success: false, error, count: 0, skipped: 0 };
  }
}

/**
 * Crée une notification hebdomadaire pour lancer les analyses ML
 * Avec déduplication pour éviter les doublons si appelé plusieurs fois le même jour
 */
export async function notifyWeeklyMLAnalysis() {
  try {
    const userIds = await getCompanyUserIds();
    if (userIds.length === 0) {
      return { success: true, count: 0 };
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    // Clé de déduplication basée sur la semaine
    const weekKey = `${today.getFullYear()}_W${getWeekNumber(today)}`;

    const title = '🧠 Analyse ML hebdomadaire disponible';
    const message = `Une nouvelle analyse de prévision de demande est disponible (${dateStr}). Consultez les recommandations pour optimiser vos commandes.`;

    const result = await createNotificationsForUsersV2(
      userIds,
      'ml_weekly',
      title,
      message,
      '/ml-analysis',
      {
        analysisDate: today.toISOString(),
        type: 'weekly_report',
        week: weekKey
      },
      `ml_weekly_${weekKey}`, // Clé de déduplication par semaine
      168 // Cooldown de 7 jours (168h)
    );

    return { success: true, count: result.successCount };
  } catch (error) {
    console.error('Erreur création notification ML hebdomadaire:', error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Crée des notifications pour les recommandations de commande ML avec haute confiance
 * Avec déduplication par fournisseur
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 */
export async function notifyMLRecommendations(products, forecasts) {
  try {
    const recommendations = generateAutoRecommendations(products, forecasts);
    
    // Filtrer uniquement les recommandations urgentes
    const urgentRecommendations = recommendations.filter(rec => rec.urgency === 'urgent');

    if (urgentRecommendations.length === 0) {
      return { success: true, count: 0, skipped: 0 };
    }

    const userIds = await getCompanyUserIds();
    if (userIds.length === 0) {
      return { success: true, count: 0, skipped: 0 };
    }

    // Grouper les recommandations par fournisseur
    const bySupplier = urgentRecommendations.reduce((acc, rec) => {
      if (!acc[rec.supplier]) acc[rec.supplier] = [];
      acc[rec.supplier].push(rec);
      return acc;
    }, {});

    let successCount = 0;
    let skippedCount = 0;

    // Créer une notification par fournisseur avec déduplication
    for (const [supplier, recs] of Object.entries(bySupplier)) {
      const productCount = recs.length;
      const totalCost = recs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      
      const productList = recs.slice(0, 3).map(r => r.productName).join(', ');
      const moreText = productCount > 3 ? ` et ${productCount - 3} autre(s)` : '';

      const title = `🤖 ML recommande: Commander chez ${supplier}`;
      const message = `${productCount} produit(s) à commander URGENCE: ${productList}${moreText}. Coût estimé: ${totalCost.toFixed(2)}€. ${recs[0].reason}`;

      // Clé de déduplication basée sur le fournisseur et les SKUs
      const skuHash = recs.map(r => r.sku).sort().join('_').substring(0, 50);
      
      const result = await createNotificationsForUsersV2(
        userIds,
        'ml_recommendation',
        title,
        message,
        `/order?supplier=${encodeURIComponent(supplier)}`,
        {
          supplier,
          productCount,
          totalCost,
          urgency: 'urgent',
          products: recs.map(r => ({
            sku: r.sku,
            name: r.productName,
            quantity: r.quantity,
            reason: r.reason
          }))
        },
        `ml_rec_${supplier}_${skuHash}`, // Clé de déduplication
        12 // Cooldown de 12h pour les recommandations urgentes
      );

      if (result.successCount > 0) {
        successCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`📊 Recommandations ML: ${successCount} envoyées, ${skippedCount} ignorées (cooldown)`);
    return { success: true, count: successCount, skipped: skippedCount };
  } catch (error) {
    console.error('Erreur création notifications recommandations ML:', error);
    return { success: false, error, count: 0, skipped: 0 };
  }
}

/**
 * Vérifie et crée des notifications pour les prévisions ML
 * À appeler périodiquement (ex: tous les jours) ou après un réentraînement
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 */
export async function checkAndNotifyMLInsights(products, forecasts) {
  console.log('🤖 Vérification insights ML pour notifications...');
  
  try {
    // 1. Notifications pour alertes critiques
    const alertsResult = await notifyMLCriticalAlerts(products, forecasts, 80);
    console.log(`✅ Alertes ML: ${alertsResult.count} créée(s), ${alertsResult.skipped} ignorée(s)`);

    // 2. Notifications pour recommandations urgentes
    const recsResult = await notifyMLRecommendations(products, forecasts);
    console.log(`✅ Recommandations ML: ${recsResult.count} créée(s), ${recsResult.skipped} ignorée(s)`);

    return {
      success: true,
      alertsCount: alertsResult.count,
      alertsSkipped: alertsResult.skipped,
      recommendationsCount: recsResult.count,
      recommendationsSkipped: recsResult.skipped,
      totalCount: alertsResult.count + recsResult.count,
      totalSkipped: alertsResult.skipped + recsResult.skipped
    };
  } catch (error) {
    console.error('Erreur vérification insights ML:', error);
    return { success: false, error, totalCount: 0, totalSkipped: 0 };
  }
}

/**
 * Obtient le numéro de semaine ISO d'une date
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
