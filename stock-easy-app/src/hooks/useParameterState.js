// ============================================
// HOOK useParameterState - Extraites de StockEasy.jsx
// PRIORITÉ 5 : Gestion de l'état des paramètres et synchronisation
// ============================================

import { useState, useEffect } from 'react';

console.log('📁 Loading useParameterState.js - Priorité 5');

/**
 * Hook personnalisé pour gérer l'état des paramètres et leur synchronisation avec Supabase
 * @param {Object} parameters - Objet des paramètres depuis Supabase
 * @returns {Object} Objet contenant les états des paramètres et leurs setters
 */
export const useParameterState = (parameters) => {
  // États locaux pour les paramètres
  const [seuilSurstockProfond, setSeuilSurstockProfond] = useState(90);
  const [deviseDefaut, setDeviseDefaut] = useState('EUR');
  const [multiplicateurDefaut, setMultiplicateurDefaut] = useState(1.2);

  // Synchronisation avec les paramètres depuis Supabase
  useEffect(() => {
    if (!parameters || Array.isArray(parameters)) {
      return;
    }

    const { 
      seuilSurstockProfond: seuil, 
      deviseDefaut: devise, 
      multiplicateurDefaut: multiplicateur 
    } = parameters;

    // Synchroniser le seuil de surstock profond
    if (seuil !== undefined && seuil !== null) {
      const parsedSeuil = Number(seuil);
      if (!Number.isNaN(parsedSeuil) && parsedSeuil !== seuilSurstockProfond) {
        setSeuilSurstockProfond(parsedSeuil);
      }
    }

    // Synchroniser la devise par défaut
    if (devise && devise !== deviseDefaut) {
      setDeviseDefaut(devise);
    }

    // Synchroniser le multiplicateur par défaut
    if (multiplicateur !== undefined && multiplicateur !== null) {
      const parsedMultiplicateur = Number(multiplicateur);
      if (!Number.isNaN(parsedMultiplicateur) && Math.abs(parsedMultiplicateur - multiplicateurDefaut) > 0.0001) {
        setMultiplicateurDefaut(parsedMultiplicateur);
      }
    }
  }, [parameters, deviseDefaut, multiplicateurDefaut, seuilSurstockProfond]);

  return {
    seuilSurstockProfond,
    setSeuilSurstockProfond,
    deviseDefaut,
    setDeviseDefaut,
    multiplicateurDefaut,
    setMultiplicateurDefaut
  };
};


