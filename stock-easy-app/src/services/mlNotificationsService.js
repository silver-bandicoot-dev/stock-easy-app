/**
 * Service pour les notifications Machine Learning
 * Crée des notifications dans Supabase pour les recommandations ML importantes
 */

import { createNotification, createNotificationsForUsers, getCompanyUserIds } from './autoNotificationsService';
import { generateMLAlerts, generateAutoRecommendations } from './ml/alertService';

/**
 * Crée des notifications pour les alertes ML critiques (confiance élevée)
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 * @param {number} confidenceThreshold - Seuil de confiance minimum (défaut: 80%)
 */
export async function notifyMLCriticalAlerts(products, forecasts, confidenceThreshold = 80) {
  if (!forecasts || Object.keys(forecasts).length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const alerts = generateMLAlerts(products, forecasts);
    
    // Filtrer uniquement les alertes critiques ou de haute priorité
    const criticalAlerts = alerts.filter(alert => 
      (alert.severity === 'critical' || alert.severity === 'high')
    );

    if (criticalAlerts.length === 0) {
      return { success: true, count: 0 };
    }

    // Récupérer tous les utilisateurs de l'entreprise
    const userIds = await getCompanyUserIds();
    if (userIds.length === 0) {
      return { success: true, count: 0 };
    }

    // Créer une notification par alerte critique
    const notificationPromises = criticalAlerts.slice(0, 5).map(alert => { // Max 5 alertes à la fois
      const title = alert.severity === 'critical' 
        ? `🚨 ML: ${alert.message}`
        : `⚠️ ML: ${alert.message}`;

      return createNotificationsForUsers(
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
        }
      );
    });

    await Promise.all(notificationPromises);

    return { success: true, count: criticalAlerts.length };
  } catch (error) {
    console.error('Erreur création notifications ML critiques:', error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Crée une notification hebdomadaire pour lancer les analyses ML
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

    const title = '🧠 Analyse ML hebdomadaire disponible';
    const message = `Une nouvelle analyse de prévision de demande est disponible (${dateStr}). Consultez les recommandations pour optimiser vos commandes.`;

    await createNotificationsForUsers(
      userIds,
      'ml_weekly',
      title,
      message,
      '/ml-analysis',
      {
        analysisDate: today.toISOString(),
        type: 'weekly_report'
      }
    );

    return { success: true, count: 1 };
  } catch (error) {
    console.error('Erreur création notification ML hebdomadaire:', error);
    return { success: false, error, count: 0 };
  }
}

/**
 * Crée des notifications pour les recommandations de commande ML avec haute confiance
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 */
export async function notifyMLRecommendations(products, forecasts) {
  try {
    const recommendations = generateAutoRecommendations(products, forecasts);
    
    // Filtrer uniquement les recommandations urgentes
    const urgentRecommendations = recommendations.filter(rec => rec.urgency === 'urgent');

    if (urgentRecommendations.length === 0) {
      return { success: true, count: 0 };
    }

    const userIds = await getCompanyUserIds();
    if (userIds.length === 0) {
      return { success: true, count: 0 };
    }

    // Grouper les recommandations par fournisseur
    const bySupplier = urgentRecommendations.reduce((acc, rec) => {
      if (!acc[rec.supplier]) acc[rec.supplier] = [];
      acc[rec.supplier].push(rec);
      return acc;
    }, {});

    // Créer une notification par fournisseur
    const notificationPromises = Object.entries(bySupplier).map(([supplier, recs]) => {
      const productCount = recs.length;
      const totalCost = recs.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);
      
      const productList = recs.slice(0, 3).map(r => r.productName).join(', ');
      const moreText = productCount > 3 ? ` et ${productCount - 3} autre(s)` : '';

      const title = `🤖 ML recommande: Commander chez ${supplier}`;
      const message = `${productCount} produit(s) à commander URGENCE: ${productList}${moreText}. Coût estimé: ${totalCost.toFixed(2)}€. ${recs[0].reason}`;

      return createNotificationsForUsers(
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
        }
      );
    });

    await Promise.all(notificationPromises);

    return { success: true, count: Object.keys(bySupplier).length };
  } catch (error) {
    console.error('Erreur création notifications recommandations ML:', error);
    return { success: false, error, count: 0 };
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
    console.log(`✅ ${alertsResult.count} notification(s) d'alerte ML créée(s)`);

    // 2. Notifications pour recommandations urgentes
    const recsResult = await notifyMLRecommendations(products, forecasts);
    console.log(`✅ ${recsResult.count} notification(s) de recommandation ML créée(s)`);

    return {
      success: true,
      alertsCount: alertsResult.count,
      recommendationsCount: recsResult.count,
      totalCount: alertsResult.count + recsResult.count
    };
  } catch (error) {
    console.error('Erreur vérification insights ML:', error);
    return { success: false, error, totalCount: 0 };
  }
}

