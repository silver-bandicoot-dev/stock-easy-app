/**
 * Hook pour gérer les notifications automatiques
 * Vérifie périodiquement les conditions et crée des notifications
 */

import { useEffect, useRef } from 'react';
import {
  notifyStockAlerts,
  notifyUnmappedProducts,
  notifyWeeklyReport,
  notifyOrderDelayed,
  notifyOrderDiscrepancy,
  notifySurstockAlert,
  notifyMissingSupplierInfo,
  getCompanyUserIds
} from '../services/autoNotificationsService';

/**
 * Hook pour les notifications automatiques
 * @param {Object} data - Données de l'application { products, orders, suppliers }
 * @param {Object} options - Options de configuration
 * @param {boolean} options.enabled - Activer/désactiver les notifications automatiques
 * @param {number} options.stockCheckInterval - Intervalle de vérification du stock (ms, défaut: 1h)
 * @param {number} options.unmappedCheckInterval - Intervalle de vérification produits non mappés (ms, défaut: 6h)
 * @param {number} options.weeklyReportDay - Jour de la semaine pour le rapport (0=dimanche, défaut: 1=lundi)
 * @param {number} options.weeklyReportHour - Heure pour le rapport (défaut: 9)
 * @param {number} options.orderDelayedInterval - Intervalle de vérification commandes en retard (ms, défaut: 12h)
 * @param {number} options.orderDiscrepancyInterval - Intervalle de vérification écarts (ms, défaut: 6h)
 * @param {number} options.surstockCheckHour - Heure pour vérifier les surstocks (défaut: 8)
 * @param {number} options.supplierInfoInterval - Intervalle de vérification infos fournisseurs (ms, défaut: 12h)
 * @param {number} options.surstockThresholdDays - Seuil en jours pour surstock (défaut: 90)
 */
export function useAutoNotifications(data, options = {}) {
  const {
    enabled = true,
    stockCheckInterval = 60 * 60 * 1000, // 1 heure
    unmappedCheckInterval = 6 * 60 * 60 * 1000, // 6 heures
    weeklyReportDay = 1, // Lundi
    weeklyReportHour = 9, // 9h du matin
    orderDelayedInterval = 12 * 60 * 60 * 1000, // 12 heures
    orderDiscrepancyInterval = 6 * 60 * 60 * 1000, // 6 heures
    surstockCheckHour = 8, // 8h du matin
    supplierInfoInterval = 12 * 60 * 60 * 1000, // 12 heures
    surstockThresholdDays = 90 // 90 jours d'autonomie
  } = options;

  const intervalsRef = useRef([]);
  const lastStockCheckRef = useRef(null);
  const lastUnmappedCheckRef = useRef(null);
  const lastWeeklyReportRef = useRef(null);
  const lastOrderDelayedCheckRef = useRef(null);
  const lastOrderDiscrepancyCheckRef = useRef(null);
  const lastSurstockCheckRef = useRef(null);
  const lastSupplierInfoCheckRef = useRef(null);

  // Nettoyer les intervalles
  useEffect(() => {
    return () => {
      intervalsRef.current.forEach(interval => clearInterval(interval));
      intervalsRef.current = [];
    };
  }, []);

  // Vérification des alertes de stock
  useEffect(() => {
    if (!enabled || !data?.products) return;

    const checkStock = async () => {
      try {
        const userIds = await getCompanyUserIds();
        if (userIds.length === 0) return;

        // Vérifier si on a déjà vérifié récemment (éviter les doublons)
        const now = Date.now();
        if (lastStockCheckRef.current && (now - lastStockCheckRef.current) < stockCheckInterval / 2) {
          return;
        }

        await notifyStockAlerts(userIds, data.products);
        lastStockCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification alertes stock:', error);
      }
    };

    // Vérifier immédiatement au chargement
    checkStock();

    // Puis vérifier périodiquement
    const interval = setInterval(checkStock, stockCheckInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, data?.products, stockCheckInterval]);

  // Vérification des produits non mappés
  useEffect(() => {
    if (!enabled || !data?.products) return;

    const checkUnmapped = async () => {
      try {
        const userIds = await getCompanyUserIds();
        if (userIds.length === 0) return;

        // Vérifier si on a déjà vérifié récemment
        const now = Date.now();
        if (lastUnmappedCheckRef.current && (now - lastUnmappedCheckRef.current) < unmappedCheckInterval / 2) {
          return;
        }

        await notifyUnmappedProducts(userIds, data.products);
        lastUnmappedCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification produits non mappés:', error);
      }
    };

    // Vérifier immédiatement au chargement
    checkUnmapped();

    // Puis vérifier périodiquement
    const interval = setInterval(checkUnmapped, unmappedCheckInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, data?.products, unmappedCheckInterval]);

  // Rapport hebdomadaire
  useEffect(() => {
    if (!enabled || !data) return;

    const scheduleWeeklyReport = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const currentHour = now.getHours();

      // Vérifier si c'est le bon jour et la bonne heure
      if (currentDay === weeklyReportDay && currentHour === weeklyReportHour) {
        // Vérifier si on a déjà envoyé le rapport aujourd'hui
        const today = now.toDateString();
        if (lastWeeklyReportRef.current === today) {
          return;
        }

        // Envoyer le rapport
        getCompanyUserIds().then(userIds => {
          if (userIds.length > 0) {
            notifyWeeklyReport(userIds, data)
              .then(() => {
                lastWeeklyReportRef.current = today;
              })
              .catch(error => {
                console.error('Erreur envoi rapport hebdomadaire:', error);
              });
          }
        });
      }
    };

    // Vérifier toutes les heures si c'est le moment d'envoyer le rapport
    const interval = setInterval(scheduleWeeklyReport, 60 * 60 * 1000); // Vérifier toutes les heures
    intervalsRef.current.push(interval);

    // Vérifier immédiatement au chargement
    scheduleWeeklyReport();

    return () => clearInterval(interval);
  }, [enabled, data, weeklyReportDay, weeklyReportHour]);

  // Vérification des commandes en retard
  useEffect(() => {
    if (!enabled || !data?.orders) return;

    const checkDelayed = async () => {
      try {
        const userIds = await getCompanyUserIds();
        if (userIds.length === 0) return;

        const now = Date.now();
        if (lastOrderDelayedCheckRef.current && (now - lastOrderDelayedCheckRef.current) < orderDelayedInterval / 2) {
          return;
        }

        await notifyOrderDelayed(userIds, data.orders);
        lastOrderDelayedCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification commandes en retard:', error);
      }
    };

    checkDelayed();
    const interval = setInterval(checkDelayed, orderDelayedInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, data?.orders, orderDelayedInterval]);

  // Vérification des écarts de réception
  useEffect(() => {
    if (!enabled || !data?.orders) return;

    const checkDiscrepancies = async () => {
      try {
        const userIds = await getCompanyUserIds();
        if (userIds.length === 0) return;

        const now = Date.now();
        if (lastOrderDiscrepancyCheckRef.current && (now - lastOrderDiscrepancyCheckRef.current) < orderDiscrepancyInterval / 2) {
          return;
        }

        await notifyOrderDiscrepancy(userIds, data.orders);
        lastOrderDiscrepancyCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification écarts réception:', error);
      }
    };

    checkDiscrepancies();
    const interval = setInterval(checkDiscrepancies, orderDiscrepancyInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, data?.orders, orderDiscrepancyInterval]);

  // Vérification des surstocks (une fois par jour)
  useEffect(() => {
    if (!enabled || !data?.products) return;

    const checkSurstock = async () => {
      try {
        const now = new Date();
        const currentHour = now.getHours();
        const today = now.toDateString();

        // Vérifier si c'est l'heure de vérification et qu'on n'a pas déjà vérifié aujourd'hui
        if (currentHour === surstockCheckHour && lastSurstockCheckRef.current !== today) {
          const userIds = await getCompanyUserIds();
          if (userIds.length === 0) return;

          await notifySurstockAlert(userIds, data.products, surstockThresholdDays);
          lastSurstockCheckRef.current = today;
        }
      } catch (error) {
        console.error('Erreur vérification surstocks:', error);
      }
    };

    // Vérifier toutes les heures pour détecter l'heure de vérification
    const interval = setInterval(checkSurstock, 60 * 60 * 1000);
    intervalsRef.current.push(interval);

    // Vérifier immédiatement au chargement
    checkSurstock();

    return () => clearInterval(interval);
  }, [enabled, data?.products, surstockCheckHour, surstockThresholdDays]);

  // Vérification des informations fournisseurs manquantes
  useEffect(() => {
    if (!enabled || !data?.suppliers) return;

    const checkSupplierInfo = async () => {
      try {
        const userIds = await getCompanyUserIds();
        if (userIds.length === 0) return;

        const now = Date.now();
        if (lastSupplierInfoCheckRef.current && (now - lastSupplierInfoCheckRef.current) < supplierInfoInterval / 2) {
          return;
        }

        await notifyMissingSupplierInfo(userIds, data.suppliers);
        lastSupplierInfoCheckRef.current = now;
      } catch (error) {
        console.error('Erreur vérification infos fournisseurs:', error);
      }
    };

    checkSupplierInfo();
    const interval = setInterval(checkSupplierInfo, supplierInfoInterval);
    intervalsRef.current.push(interval);

    return () => clearInterval(interval);
  }, [enabled, data?.suppliers, supplierInfoInterval]);
}

