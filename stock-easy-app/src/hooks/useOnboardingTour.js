import { useState, useEffect, useCallback, useRef } from 'react';
import { driver } from 'driver.js';
import { useTranslation } from 'react-i18next';
import { getMainTourSteps, TOUR_ELEMENT_IDS, TOUR_NAVIGATION_CONFIG } from '../components/onboarding/tourSteps';
import { 
  getOnboardingStatus, 
  markTourCompleted, 
  resetTour as resetTourService 
} from '../services/onboardingService';

/**
 * Hook pour gérer le tour guidé d'onboarding
 * @param {Object} options - Options de configuration
 * @param {boolean} options.autoStart - Démarrer automatiquement si non complété (défaut: true)
 * @param {number} options.autoStartDelay - Délai avant démarrage auto en ms (défaut: 2000)
 * @param {Function} options.setActiveTab - Fonction pour changer d'onglet
 * @param {Function} options.setSettingsSubTab - Fonction pour changer de sous-onglet paramètres
 * @param {Function} options.expandSettingsMenu - Fonction pour ouvrir le menu paramètres
 * @returns {Object} - Fonctions et état du tour
 */
export function useOnboardingTourLogic(options = {}) {
  const { 
    autoStart = true, 
    autoStartDelay = 2000,
    setActiveTab,
    setSettingsSubTab,
    expandSettingsMenu
  } = options;
  
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [isTourActive, setIsTourActive] = useState(false);
  const driverRef = useRef(null);
  const hasInitialized = useRef(false);
  const autoStartTimeoutRef = useRef(null);
  const closeHandlerRef = useRef(null); // Référence stable pour le handler de fermeture

  /**
   * Gère la navigation vers la bonne section AVANT d'afficher le highlight
   * Utilise TOUR_NAVIGATION_CONFIG pour déterminer les actions nécessaires
   * @param {string} elementId - L'ID de l'élément ciblé (sans #)
   */
  const handleTourNavigation = useCallback((elementId) => {
    if (!elementId) return;
    
    const navConfig = TOUR_NAVIGATION_CONFIG[elementId];
    
    if (navConfig) {
      // 1. D'abord expand le menu Settings si nécessaire
      if (navConfig.expandSettings && expandSettingsMenu) {
        expandSettingsMenu();
      }
      
      // 2. Naviguer vers l'onglet principal
      if (navConfig.tab && setActiveTab) {
        setActiveTab(navConfig.tab);
      }
      
      // 3. Naviguer vers le sous-onglet
      if (navConfig.subTab && setSettingsSubTab) {
        setSettingsSubTab(navConfig.subTab);
      }
    }
  }, [setActiveTab, setSettingsSubTab, expandSettingsMenu]);

  // Initialiser l'instance Driver.js
  const initDriver = useCallback(() => {
    // Nettoyer l'ancien handler s'il existe avant de créer un nouveau driver
    if (closeHandlerRef.current) {
      document.removeEventListener('click', closeHandlerRef.current, true);
      closeHandlerRef.current = null;
    }

    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const steps = getMainTourSteps(t);
    
    // Handler global pour le bouton de fermeture - délégation d'événements
    // Utiliser une référence stable stockée dans closeHandlerRef
    const handleCloseButtonClick = (e) => {
      // Vérifier si le clic est sur le bouton de fermeture ou un de ses enfants
      const target = e.target;
      const closeButton = target.closest('.driver-popover-close-btn');
      
      if (closeButton && driverRef.current) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Détruire le driver
        driverRef.current.destroy();
        return false;
      }
    };
    
    // Stocker la référence du handler dans le ref pour pouvoir le retirer correctement
    closeHandlerRef.current = handleCloseButtonClick;
    
    // Ajouter le listener au document avec capture pour intercepter avant Driver.js
    document.addEventListener('click', closeHandlerRef.current, true);
    
    driverRef.current = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayClickNext: false,
      stagePadding: 10,
      stageRadius: 8,
      popoverClass: 'stockeasy-tour-popover',
      progressText: t('tour.progress', '{{current}} / {{total}}'),
      nextBtnText: t('tour.next', 'Suivant'),
      prevBtnText: t('tour.previous', 'Précédent'),
      doneBtnText: t('tour.finish', 'Terminer'),
      steps: steps,
      // Note: Pas de callbacks personnalisés pour onNextClick/onPrevClick
      // Driver.js gère automatiquement la navigation
      onDestroyStarted: () => {
        setIsTourActive(false);
        // Retirer le listener global quand le tour est détruit
        if (closeHandlerRef.current) {
          document.removeEventListener('click', closeHandlerRef.current, true);
          closeHandlerRef.current = null;
        }
      },
      onDestroyed: () => {
        setIsTourActive(false);
        // Retirer le listener global (double sécurité)
        if (closeHandlerRef.current) {
          document.removeEventListener('click', closeHandlerRef.current, true);
          closeHandlerRef.current = null;
        }
        // Marquer comme complété (sans await pour éviter les blocages)
        markTourCompleted('main_tour').then(() => {
          setHasCompletedTour(true);
        });
      }
    });

    // Nettoyer le listener quand le driver est détruit manuellement
    const originalDestroy = driverRef.current.destroy;
    driverRef.current.destroy = function() {
      if (closeHandlerRef.current) {
        document.removeEventListener('click', closeHandlerRef.current, true);
        closeHandlerRef.current = null;
      }
      return originalDestroy.call(this);
    };

    return driverRef.current;
  }, [t, handleTourNavigation]);

  // Charger le statut d'onboarding au montage
  useEffect(() => {
    const loadStatus = async () => {
      try {
        const { data } = await getOnboardingStatus();
        setHasCompletedTour(data?.main_tour_completed ?? false);
      } catch (error) {
        console.error('Erreur chargement statut onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();

    // Cleanup
    return () => {
      if (autoStartTimeoutRef.current) {
        clearTimeout(autoStartTimeoutRef.current);
      }
      // Nettoyer le handler de fermeture
      if (closeHandlerRef.current) {
        document.removeEventListener('click', closeHandlerRef.current, true);
        closeHandlerRef.current = null;
      }
      if (driverRef.current) {
        driverRef.current.destroy();
      }
    };
  }, []);

  // Auto-démarrage du tour pour les nouveaux utilisateurs
  useEffect(() => {
    if (isLoading || hasInitialized.current) return;
    
    hasInitialized.current = true;

    if (autoStart && !hasCompletedTour) {
      autoStartTimeoutRef.current = setTimeout(() => {
        startTour();
      }, autoStartDelay);
    }
  }, [isLoading, hasCompletedTour, autoStart, autoStartDelay]);

  // Démarrer le tour manuellement
  const startTour = useCallback(() => {
    // Attendre que les éléments soient rendus
    requestAnimationFrame(() => {
      const driverInstance = initDriver();
      if (driverInstance) {
        setIsTourActive(true);
        driverInstance.drive();
      }
    });
  }, [initDriver]);

  // Arrêter le tour
  const stopTour = useCallback(() => {
    // Nettoyer le handler de fermeture
    if (closeHandlerRef.current) {
      document.removeEventListener('click', closeHandlerRef.current, true);
      closeHandlerRef.current = null;
    }
    if (driverRef.current) {
      driverRef.current.destroy();
    }
    setIsTourActive(false);
  }, []);

  // Réinitialiser le tour (pour tests)
  const resetTour = useCallback(async () => {
    try {
      await resetTourService('main_tour');
      setHasCompletedTour(false);
    } catch (error) {
      console.error('Erreur réinitialisation tour:', error);
    }
  }, []);

  return {
    isLoading,
    hasCompletedTour,
    isTourActive,
    startTour,
    stopTour,
    resetTour
  };
}
