/**
 * Tests pour parameterHandlers.js
 * 
 * Ces tests protègent contre les régressions lors du refactoring
 * et servent de documentation pour comprendre le comportement attendu.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toast } from 'sonner';
import {
  handleUpdateSeuilSurstock,
  handleUpdateDevise,
  handleUpdateMultiplicateur,
  updateParameterState,
  saveAllParameters
} from '../parameterHandlers';

// Mock de toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn()
  }
}));

describe('parameterHandlers', () => {
  let mockApi;
  let mockSetSeuilSurstockProfond;
  let mockUpdateParameterState;

  beforeEach(() => {
    // Reset des mocks avant chaque test
    vi.clearAllMocks();
    
    mockApi = {
      updateParameter: vi.fn()
    };
    
    mockSetSeuilSurstockProfond = vi.fn();
    mockUpdateParameterState = vi.fn();
  });

  describe('handleUpdateSeuilSurstock', () => {
    it('devrait mettre à jour le seuil avec succès', async () => {
      // Arrange : Configuration du mock pour un succès
      mockApi.updateParameter.mockResolvedValue({ success: true });
      
      // Act : Appel de la fonction
      const result = await handleUpdateSeuilSurstock(
        90,
        mockApi,
        mockSetSeuilSurstockProfond,
        mockUpdateParameterState
      );
      
      // Assert : Vérifications
      expect(result).toBe(true);
      expect(mockApi.updateParameter).toHaveBeenCalledWith('SeuilSurstockProfond', 90);
      expect(mockSetSeuilSurstockProfond).toHaveBeenCalledWith(90);
      expect(mockUpdateParameterState).toHaveBeenCalledWith('seuilSurstockProfond', 90);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de l\'API', async () => {
      // Arrange : Configuration du mock pour une erreur
      const errorMessage = 'Erreur réseau';
      mockApi.updateParameter.mockResolvedValue({ 
        success: false, 
        error: errorMessage 
      });
      
      // Act & Assert : La fonction doit lancer une erreur
      await expect(
        handleUpdateSeuilSurstock(
          90,
          mockApi,
          mockSetSeuilSurstockProfond,
          mockUpdateParameterState
        )
      ).rejects.toThrow(errorMessage);
      
      expect(toast.error).toHaveBeenCalled();
    });

    it('devrait fonctionner sans updateParameterState (optionnel)', async () => {
      mockApi.updateParameter.mockResolvedValue({ success: true });
      
      const result = await handleUpdateSeuilSurstock(
        90,
        mockApi,
        mockSetSeuilSurstockProfond,
        null // Pas de updateParameterState
      );
      
      expect(result).toBe(true);
      expect(mockSetSeuilSurstockProfond).toHaveBeenCalledWith(90);
      // updateParameterState ne doit pas être appelé si null
      expect(mockUpdateParameterState).not.toHaveBeenCalled();
    });
  });

  describe('handleUpdateDevise', () => {
    it('devrait mettre à jour la devise avec succès', async () => {
      const mockSetDeviseDefaut = vi.fn();
      mockApi.updateParameter.mockResolvedValue({ success: true });
      
      const result = await handleUpdateDevise(
        'USD',
        mockApi,
        mockSetDeviseDefaut,
        mockUpdateParameterState
      );
      
      expect(result).toBe(true);
      expect(mockApi.updateParameter).toHaveBeenCalledWith('DeviseDefaut', 'USD');
      expect(mockSetDeviseDefaut).toHaveBeenCalledWith('USD');
    });
  });

  describe('updateParameterState', () => {
    it('devrait mettre à jour l\'état des paramètres correctement', () => {
      const mockSetParameters = vi.fn();
      const currentState = { seuilSurstockProfond: 60, deviseDefaut: 'EUR' };
      
      updateParameterState('seuilSurstockProfond', 90, mockSetParameters);
      
      // Vérifier que setParameters a été appelé avec une fonction
      expect(mockSetParameters).toHaveBeenCalled();
      const updateFn = mockSetParameters.mock.calls[0][0];
      
      // Simuler l'appel de la fonction avec l'état actuel
      const newState = updateFn(currentState);
      expect(newState.seuilSurstockProfond).toBe(90);
      expect(newState.deviseDefaut).toBe('EUR'); // Les autres valeurs sont préservées
    });

    it('devrait gérer un état initial null ou array', () => {
      const mockSetParameters = vi.fn();
      
      updateParameterState('seuilSurstockProfond', 90, mockSetParameters);
      
      const updateFn = mockSetParameters.mock.calls[0][0];
      // Tester avec null
      const newState1 = updateFn(null);
      expect(newState1.seuilSurstockProfond).toBe(90);
      
      // Tester avec array (cas d'erreur)
      const newState2 = updateFn([]);
      expect(newState2.seuilSurstockProfond).toBe(90);
    });
  });

  describe('saveAllParameters', () => {
    it('devrait sauvegarder tous les paramètres modifiés', async () => {
      const mockLoadData = vi.fn().mockResolvedValue();
      const mockSetUnsavedParameterChanges = vi.fn();
      const mockSetIsSavingParameters = vi.fn();
      
      const unsavedChanges = {
        seuilSurstockProfond: 90,
        deviseDefaut: 'USD'
      };
      
      // Mock de l'API pour retourner succès pour chaque paramètre
      mockApi.updateParameter
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });
      
      await saveAllParameters(
        unsavedChanges,
        mockApi,
        mockLoadData,
        mockSetUnsavedParameterChanges,
        mockSetIsSavingParameters
      );
      
      // Vérifications
      expect(mockSetIsSavingParameters).toHaveBeenCalledWith(true);
      expect(mockApi.updateParameter).toHaveBeenCalledTimes(2);
      expect(mockApi.updateParameter).toHaveBeenCalledWith('seuilSurstockProfond', 90);
      expect(mockApi.updateParameter).toHaveBeenCalledWith('deviseDefaut', 'USD');
      expect(mockLoadData).toHaveBeenCalled();
      expect(mockSetUnsavedParameterChanges).toHaveBeenCalledWith({});
      expect(mockSetIsSavingParameters).toHaveBeenCalledWith(false);
      expect(toast.success).toHaveBeenCalled();
    });

    it('ne devrait rien faire si aucun paramètre modifié', async () => {
      const mockLoadData = vi.fn();
      const mockSetUnsavedParameterChanges = vi.fn();
      const mockSetIsSavingParameters = vi.fn();
      
      await saveAllParameters(
        {}, // Aucune modification
        mockApi,
        mockLoadData,
        mockSetUnsavedParameterChanges,
        mockSetIsSavingParameters
      );
      
      expect(toast.info).toHaveBeenCalledWith('Aucune modification à sauvegarder');
      expect(mockApi.updateParameter).not.toHaveBeenCalled();
      expect(mockLoadData).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs lors de la sauvegarde', async () => {
      const mockLoadData = vi.fn();
      const mockSetUnsavedParameterChanges = vi.fn();
      const mockSetIsSavingParameters = vi.fn();
      
      const unsavedChanges = { seuilSurstockProfond: 90 };
      
      // Un des appels API échoue
      mockApi.updateParameter.mockResolvedValue({ success: false, error: 'Erreur API' });
      
      await saveAllParameters(
        unsavedChanges,
        mockApi,
        mockLoadData,
        mockSetUnsavedParameterChanges,
        mockSetIsSavingParameters
      );
      
      expect(toast.error).toHaveBeenCalled();
      expect(mockSetIsSavingParameters).toHaveBeenCalledWith(false); // Finally block
    });
  });
});

















