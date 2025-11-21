// ============================================
// HANDLERS PARAMÈTRES - Extraites de StockEasy.jsx
// PHASE 3 : Handlers Paramètres
// ============================================

import { toast } from 'sonner';

console.log('📁 Loading parameterHandlers.js - Phase 3');

/**
 * Met à jour le seuil de surstock profond
 * @param {number} newValue - Nouvelle valeur du seuil
 * @param {Object} api - Service API
 * @param {Function} setSeuilSurstockProfond - Setter pour le state
 * @param {Function} updateParameterState - Fonction optionnelle pour mettre à jour l'état global
 * @returns {Promise<boolean>} True si succès
 */
export const handleUpdateSeuilSurstock = async (
  newValue,
  api,
  setSeuilSurstockProfond,
  updateParameterState = null
) => {
  try {
    const result = await api.updateParameter('SeuilSurstockProfond', newValue);
    if (!result?.success) {
      throw new Error(result?.error || 'Échec de la mise à jour du seuil de surstock');
    }
    setSeuilSurstockProfond(newValue);
    if (updateParameterState) {
      updateParameterState('seuilSurstockProfond', newValue);
    }
    console.log(`✅ Seuil surstock mis à jour : ${newValue}j`);
    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour seuil:', error);
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      toast.error('Problème de connexion. Vérifiez votre connexion Internet.', {
        action: {
          label: 'Réessayer',
          onClick: () => handleUpdateSeuilSurstock(newValue, api, setSeuilSurstockProfond, updateParameterState)
        }
      });
    } else if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
      toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
        description: 'Vérifiez la connexion à Supabase',
        duration: 10000
      });
    } else {
      toast.error(`Erreur lors de la sauvegarde: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Met à jour la devise par défaut
 * @param {string} newDevise - Nouvelle devise
 * @param {Object} api - Service API
 * @param {Function} setDeviseDefaut - Setter pour le state
 * @param {Function} updateParameterState - Fonction optionnelle pour mettre à jour l'état global
 * @returns {Promise<boolean>} True si succès
 */
export const handleUpdateDevise = async (
  newDevise,
  api,
  setDeviseDefaut,
  updateParameterState = null
) => {
  try {
    const result = await api.updateParameter('DeviseDefaut', newDevise);
    if (!result?.success) {
      throw new Error(result?.error || 'Échec de la mise à jour de la devise');
    }
    setDeviseDefaut(newDevise);
    if (updateParameterState) {
      updateParameterState('deviseDefaut', newDevise);
    }
    console.log(`✅ Devise mise à jour : ${newDevise}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour devise:', error);
    if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
      toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
        description: 'Vérifiez la connexion à Supabase',
        duration: 10000
      });
    } else {
      toast.error(`Erreur lors de la sauvegarde de la devise: ${error.message}`);
    }
    throw error;
  }
};

/**
 * Met à jour le multiplicateur par défaut
 * @param {number} newValue - Nouvelle valeur du multiplicateur
 * @param {Object} api - Service API
 * @param {Function} setMultiplicateurDefaut - Setter pour le state
 * @param {Function} updateParameterState - Fonction optionnelle pour mettre à jour l'état global
 * @returns {Promise<boolean>} True si succès
 */
export const handleUpdateMultiplicateur = async (
  newValue,
  api,
  setMultiplicateurDefaut,
  updateParameterState = null
) => {
  try {
    const result = await api.updateParameter('MultiplicateurDefaut', newValue);
    if (!result?.success) {
      throw new Error(result?.error || 'Échec de la mise à jour du multiplicateur');
    }
    setMultiplicateurDefaut(newValue);
    if (updateParameterState) {
      updateParameterState('multiplicateurDefaut', newValue);
    }
    console.log(`✅ Multiplicateur mis à jour : ${newValue}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur mise à jour multiplicateur:', error);
    if (error.message?.includes('Action non reconnue') || error.message?.includes('Action inconnue')) {
      toast.error('❌ Erreur Backend: L\'action "updateParameter" n\'est pas disponible', {
        description: 'Vérifiez la connexion à Supabase',
        duration: 10000
      });
    } else {
      toast.error(`Erreur lors de la sauvegarde du multiplicateur: ${error.message}`);
    }
    throw error;
  }
};

/**
 * PRIORITÉ 4 : Met à jour l'état local des paramètres
 * @param {string} key - Clé du paramètre
 * @param {any} value - Nouvelle valeur
 * @param {Function} setParameters - Setter pour l'état des paramètres
 */
export const updateParameterState = (key, value, setParameters) => {
  setParameters(prev => {
    const current = prev && !Array.isArray(prev) ? prev : {};
    return {
      ...current,
      [key]: value
    };
  });
};

/**
 * PRIORITÉ 6 : Gère le changement d'un paramètre (marque comme modifié mais non sauvegardé)
 * @param {string} paramName - Nom du paramètre modifié
 * @param {any} value - Nouvelle valeur du paramètre
 * @param {Function} setUnsavedParameterChanges - Setter pour l'état des modifications non sauvegardées
 */
export const handleParameterChange = (paramName, value, setUnsavedParameterChanges) => {
  console.log('Modification paramètre:', paramName, '=', value);
  setUnsavedParameterChanges(prev => ({
    ...prev,
    [paramName]: value
  }));
};

/**
 * PRIORITÉ 6 : Sauvegarde tous les paramètres modifiés
 * @param {Object} unsavedParameterChanges - Objet contenant les paramètres modifiés
 * @param {Object} api - Service API
 * @param {Function} loadData - Fonction pour recharger les données
 * @param {Function} setUnsavedParameterChanges - Setter pour nettoyer les modifications
 * @param {Function} setIsSavingParameters - Setter pour l'état de sauvegarde
 * @returns {Promise<void>}
 */
export const saveAllParameters = async (
  unsavedParameterChanges,
  api,
  loadData,
  setUnsavedParameterChanges,
  setIsSavingParameters
) => {
  if (Object.keys(unsavedParameterChanges).length === 0) {
    toast.info('Aucune modification à sauvegarder');
    return;
  }
  
  setIsSavingParameters(true);
  
  try {
    console.log('💾 Sauvegarde des paramètres:', unsavedParameterChanges);
    
    // Sauvegarder chaque paramètre modifié
    const savePromises = Object.entries(unsavedParameterChanges).map(([paramName, value]) => {
      console.log(`  - ${paramName}: ${value}`);
      return api.updateParameter(paramName, value);
    });
    
    const results = await Promise.all(savePromises);
    console.log('Résultats de sauvegarde:', results);
    
    // Vérifier les erreurs
    const errors = results.filter(r => !r?.success);
    if (errors.length > 0) {
      throw new Error(`Erreurs: ${errors.map(e => e.error || 'Erreur inconnue').join(', ')}`);
    }
    
    // Recharger les données pour obtenir les paramètres mis à jour
    await loadData();
    
    // Sauvegarder le nombre de paramètres sauvegardés avant de nettoyer
    const savedCount = Object.keys(unsavedParameterChanges).length;
    
    // Nettoyer les modifications non sauvegardées
    setUnsavedParameterChanges({});
    
    toast.success(`${savedCount} paramètre(s) sauvegardé(s) avec succès!`, {
      duration: 4000
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    toast.error('Erreur lors de la sauvegarde: ' + error.message, {
      duration: 6000
    });
  } finally {
    setIsSavingParameters(false);
  }
};

