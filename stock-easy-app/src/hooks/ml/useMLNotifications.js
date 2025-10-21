/**
 * Hook pour gérer les notifications ML
 * @module hooks/ml/useMLNotifications
 */

import { useState, useEffect } from 'react';
import { shouldRetrain, createRetrainingNotification } from '../../utils/ml/autoRetraining';
import { generateMLAlerts } from '../../services/ml/alertService';

const NOTIFICATIONS_KEY = 'ml-notifications';

/**
 * Hook pour gérer les notifications ML
 * @param {Array} products - Produits
 * @param {Object} forecasts - Prévisions
 * @param {boolean} isReady - Modèle prêt
 * @returns {Object} {notifications, addNotification, markAsRead, clearAll}
 */
export function useMLNotifications(products, forecasts, isReady) {
  const [notifications, setNotifications] = useState([]);

  // Charger les notifications au montage
  useEffect(() => {
    loadNotifications();
  }, []);

  // Vérifier périodiquement si un réentraînement est nécessaire
  useEffect(() => {
    if (!isReady) return;

    const checkInterval = setInterval(() => {
      if (shouldRetrain(7)) { // Vérifier tous les 7 jours
        const notif = createRetrainingNotification('périodique');
        addNotification(notif);
      }
    }, 3600000); // Vérifier toutes les heures

    return () => clearInterval(checkInterval);
  }, [isReady]);

  // Générer des alertes basées sur les prévisions
  useEffect(() => {
    if (!isReady || !forecasts || Object.keys(forecasts).length === 0) return;

    const alerts = generateMLAlerts(products, forecasts);
    
    // Convertir les alertes critiques en notifications
    alerts
      .filter(alert => alert.severity === 'critical' || alert.severity === 'high')
      .forEach(alert => {
        const notif = {
          id: alert.id,
          title: alert.message,
          message: alert.details,
          severity: alert.severity,
          type: alert.type,
          action: alert.action,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        // Ajouter seulement si pas déjà présente
        if (!notifications.some(n => n.id === notif.id)) {
          addNotification(notif);
        }
      });
  }, [forecasts, isReady]);

  /**
   * Charge les notifications depuis localStorage
   */
  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        const notifs = JSON.parse(stored);
        // Ne garder que les notifications non lues et récentes (< 7 jours)
        const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const filtered = notifs.filter(n => 
          !n.read && new Date(n.timestamp).getTime() > weekAgo
        );
        setNotifications(filtered);
      }
    } catch (error) {
      console.error('Erreur chargement notifications ML:', error);
    }
  };

  /**
   * Ajoute une notification
   */
  const addNotification = (notification) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      const updated = [notification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  /**
   * Marque une notification comme lue
   */
  const markAsRead = (notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated.filter(n => !n.read);
    });
  };

  /**
   * Marque toutes comme lues
   */
  const markAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return [];
    });
  };

  /**
   * Supprime toutes les notifications
   */
  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem(NOTIFICATIONS_KEY);
  };

  /**
   * Sauvegarde les notifications
   * @private
   */
  const saveNotifications = (notifs) => {
    try {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
    } catch (error) {
      console.error('Erreur sauvegarde notifications ML:', error);
    }
  };

  return {
    notifications: notifications.filter(n => !n.read),
    unreadCount: notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}

