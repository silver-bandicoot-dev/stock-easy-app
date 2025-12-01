import React, { useMemo } from 'react';
import { useOnboardingTourLogic } from '../../hooks/useOnboardingTour';
import './tourStyles.css';

/**
 * Provider pour le tour d'onboarding
 * Utilise le render prop pattern pour injecter les fonctions du tour directement
 */
export function OnboardingTourProvider({ 
  children,
  setActiveTab,
  setSettingsSubTab,
  expandSettingsMenu,
  autoStart = true,
  autoStartDelay = 2500
}) {
  const tourLogic = useOnboardingTourLogic({
    autoStart,
    autoStartDelay,
    setActiveTab,
    setSettingsSubTab,
    expandSettingsMenu
  });

  // Mémoriser la valeur pour éviter les re-renders inutiles
  const tourProps = useMemo(() => ({
    isLoading: tourLogic.isLoading,
    hasCompletedTour: tourLogic.hasCompletedTour,
    isTourActive: tourLogic.isTourActive,
    startTour: tourLogic.startTour,
    stopTour: tourLogic.stopTour,
    resetTour: tourLogic.resetTour
  }), [
    tourLogic.isLoading,
    tourLogic.hasCompletedTour,
    tourLogic.isTourActive,
    tourLogic.startTour,
    tourLogic.stopTour,
    tourLogic.resetTour
  ]);

  // Render prop pattern - children doit être une fonction
  if (typeof children === 'function') {
    return children(tourProps);
  }

  // Fallback si children n'est pas une fonction
  return children;
}

export default OnboardingTourProvider;
