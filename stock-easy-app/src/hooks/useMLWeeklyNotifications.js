/**
 * Hook pour gérer les notifications ML hebdomadaires
 * Crée une notification chaque lundi pour inviter l'utilisateur à consulter les analyses ML
 */

import { useEffect, useRef } from 'react';
import { notifyWeeklyMLAnalysis, checkAndNotifyMLInsights } from '../services/mlNotificationsService';

/**
 * Hook pour les notifications ML hebdomadaires et critiques
 * @param {Array} products - Liste des produits
 * @param {Object} forecasts - Prévisions ML
 * @param {Object} options - Options de configuration
 */
export function useMLWeeklyNotifications(products, forecasts, options = {}) {
  const {
    enabled = true,
    weeklyDay = 1, // Lundi
    weeklyHour = 9, // 9h du matin
    criticalCheckInterval = 24 * 60 * 60 * 1000, // Vérifier les alertes critiques toutes les 24h
  } = options;

  const lastWeeklyReportRef = useRef(null);
  const lastCriticalCheckRef = useRef(null);
  const intervalsRef = useRef([]);

  // Nettoyer les intervalles au démontage
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
    };
  }, []);

  // Notification hebdomadaire (lundi matin)
  useEffect(() => {
    if (!enabled) return;

    const checkWeeklyReport = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi
      const currentHour = now.getHours();

      // Vérifier si c'est le bon jour et la bonne heure
      if (currentDay === weeklyDay && currentHour === weeklyHour) {
        const today = now.toDateString();
        
        // Vérifier si on a déjà envoyé le rapport aujourd'hui
        if (lastWeeklyReportRef.current === today) {
          return;
        }

        // Envoyer la notification hebdomadaire
        notifyWeeklyMLAnalysis()
          .then(result => {
            if (result.success) {
              console.log('✅ Notification ML hebdomadaire créée');
              lastWeeklyReportRef.current = today;
            }
          })
          .catch(error => {
            console.error('Erreur notification ML hebdomadaire:', error);
          });
      }
    };

    // Vérifier toutes les heures si c'est le moment
    const interval = setInterval(checkWeeklyReport, 60 * 60 * 1000);
    intervalsRef.current.push(interval);

    // Vérifier immédiatement au chargement
    checkWeeklyReport();

    return () => clearInterval(interval);
  }, [enabled, weeklyDay, weeklyHour]);

  // Vérification des alertes ML critiques (quotidienne)
  useEffect(() => {
    if (!enabled || !products || !forecasts || Object.keys(forecasts).length === 0) return;

    const checkCriticalAlerts = async () => {
      const now = Date.now();
      
      // Vérifier si on a déjà vérifié récemment
      if (lastCriticalCheckRef.current && (now - lastCriticalCheckRef.current) < criticalCheckInterval / 2) {
        return;
      }

      try {
        const result = await checkAndNotifyMLInsights(products, forecasts);
        
        if (result.success && result.totalCount > 0) {
          console.log(`✅ ${result.totalCount} notification(s) ML critique(s) créée(s)`);
        }
        
        lastCriticalCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification alertes ML critiques:', error);
      }
    };

    // Vérifier périodiquement (toutes les 24h par défaut)
    const interval = setInterval(checkCriticalAlerts, criticalCheckInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, products, forecasts, criticalCheckInterval]);
}

