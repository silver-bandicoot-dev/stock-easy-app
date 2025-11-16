import { useState } from 'react';
import { toast } from 'sonner';
import api from '../../services/apiAdapter';
import { multiplierOptimizer } from '../../services/ml/multiplierOptimizer';
import { InfoTooltip } from '../ui/InfoTooltip/InfoTooltip';
import { ImagePreview } from '../ui/ImagePreview';

/**
 * Composant pour éditer le multiplicateur de prévision d'un produit
 * Propose deux options : modification manuelle et suggestion ML
 * 
 * @param {Object} props
 * @param {Object} props.product - Le produit à modifier
 * @param {Function} props.onUpdate - Callback appelé après mise à jour
 * @param {Function} props.onClose - Callback pour fermer l'éditeur
 */
export function ProductMultiplierEditor({ product, onUpdate, onClose }) {
  const [multiplier, setMultiplier] = useState(
    product.multiplicateur_prevision || product.multiplier || 1.2
  );
  const [isSaving, setIsSaving] = useState(false);
  const [mlSuggestion, setMlSuggestion] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showMLDetails, setShowMLDetails] = useState(false);

  const handleManualSave = async () => {
    if (multiplier < 0.1 || multiplier > 10) {
      setTimeout(() => {
        toast.error('Le multiplicateur doit être entre 0.1 et 10');
      }, 0);
      return;
    }

    setIsSaving(true);
    try {
      const result = await api.updateProductMultiplier(product.sku, multiplier);
      
      if (result.success) {
        setTimeout(() => {
          toast.success(`Multiplicateur mis à jour à ${multiplier.toFixed(1)}`);
        }, 0);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          if (onClose) onClose();
        }, 100);
      } else {
        setTimeout(() => {
          toast.error(result.error || 'Erreur lors de la mise à jour');
        }, 0);
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde multiplicateur:', error);
      setTimeout(() => {
        toast.error('Erreur lors de la sauvegarde');
      }, 0);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMLAnalyze = async () => {
    setIsAnalyzing(true);
    setMlSuggestion(null);
    
    try {
      const suggestion = await multiplierOptimizer.suggestOptimalMultiplier(product);
      setMlSuggestion(suggestion);
      setShowMLDetails(true);
    } catch (error) {
      console.error('❌ Erreur analyse ML:', error);
      setTimeout(() => {
        toast.error('Erreur lors de l\'analyse ML');
      }, 0);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyMLSuggestion = async () => {
    if (!mlSuggestion) return;

    setIsSaving(true);
    try {
      const result = await multiplierOptimizer.applySuggestedMultiplier(
        product.sku,
        mlSuggestion.suggestedMultiplier
      );

      if (result.success) {
        // Utiliser setTimeout pour éviter le warning React
        setTimeout(() => {
          toast.success(result.message || 'Multiplicateur ML appliqué avec succès');
        }, 0);
        setMultiplier(mlSuggestion.suggestedMultiplier);
        // Appeler onUpdate et onClose dans un setTimeout pour éviter le warning
        setTimeout(() => {
          if (onUpdate) onUpdate();
          if (onClose) onClose();
        }, 100);
      } else {
        setTimeout(() => {
          toast.error(result.error || 'Erreur lors de l\'application');
        }, 0);
      }
    } catch (error) {
      console.error('❌ Erreur application ML:', error);
      setTimeout(() => {
        toast.error('Erreur lors de l\'application');
      }, 0);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setIsSaving(true);
    try {
      const result = await api.resetProductMultiplier(product.sku);
      
      if (result.success) {
        setTimeout(() => {
          toast.success('Multiplicateur réinitialisé au paramètre par défaut');
        }, 0);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          if (onClose) onClose();
        }, 100);
      } else {
        setTimeout(() => {
          toast.error(result.error || 'Erreur lors de la réinitialisation');
        }, 0);
      }
    } catch (error) {
      console.error('❌ Erreur réinitialisation:', error);
      setTimeout(() => {
        toast.error('Erreur lors de la réinitialisation');
      }, 0);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-[#E5E4DF] p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#191919]">
          📈 Multiplicateur de Prévision
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[#666663] hover:text-[#191919] transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="mb-4 flex items-start gap-3">
        {product.imageUrl ? (
          <ImagePreview
            src={product.imageUrl}
            alt={product.name || product.nom_produit || 'Produit'}
            thumbClassName="w-12 h-12 rounded-md object-cover flex-shrink-0 bg-[#E5E4DF]"
          />
        ) : (
          <div className="w-12 h-12 rounded-md bg-[#E5E4DF] flex items-center justify-center text-sm text-[#666663] flex-shrink-0">
            {(product.name || product.nom_produit || '?').charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-[#666663] mb-2">
            <strong>{product.name || product.nom_produit}</strong> (SKU: {product.sku})
          </p>
          <div className="flex items-center gap-2">
          <span className="text-xs text-[#666663] cursor-help underline">
            Qu'est-ce que le multiplicateur de prévision ?
          </span>
          <InfoTooltip
            content="Coefficient pour ajuster les prévisions selon la saisonnalité ou les événements (BFCM, soldes). 1 = normal, 0.5 = hors saison, 5 = pic majeur."
          />
          </div>
        </div>
      </div>

      {/* Modification Manuelle */}
      <div className="mb-6 p-4 bg-[#FAFAF7] rounded-lg border border-[#E5E4DF]">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-[#191919]">✏️ Modification Manuelle</h4>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMultiplier(Math.max(0.1, multiplier - 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
            disabled={isSaving}
          >
            <span className="text-xl font-bold text-[#666663]">-</span>
          </button>
          
          <div className="flex-1">
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value) || 1.2)}
              className="w-full text-center text-2xl font-bold text-[#191919] border-2 border-[#E5E4DF] rounded-lg px-4 py-2 focus:border-[#8B5CF6] focus:outline-none"
              disabled={isSaving}
            />
            <p className="text-xs text-[#666663] text-center mt-1">
              Valeur entre 0.1 et 10.0
            </p>
          </div>
          
          <button
            onClick={() => setMultiplier(Math.min(10, multiplier + 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
            disabled={isSaving}
          >
            <span className="text-xl font-bold text-[#666663]">+</span>
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleManualSave}
            disabled={isSaving || multiplier === (product.multiplicateur_prevision || product.multiplier || 1.2)}
            className="flex-1 px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-semibold hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="px-4 py-2 bg-[#E5E4DF] text-[#191919] rounded-lg font-semibold hover:bg-[#D4D4D4] transition-colors disabled:opacity-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Suggestion ML */}
      <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-[#191919]">🤖 Suggestion par Machine Learning</h4>
          <button
            onClick={handleMLAnalyze}
            disabled={isAnalyzing || isSaving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isAnalyzing ? 'Analyse...' : 'Analyser avec ML'}
          </button>
        </div>

        {mlSuggestion && (
          <div className="mt-4 space-y-3 max-h-[400px] overflow-y-auto">
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[#191919]">
                  Multiplicateur suggéré : <span className="text-purple-600 text-xl">{mlSuggestion.suggestedMultiplier.toFixed(1)}</span>
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  mlSuggestion.confidence >= 70 ? 'bg-green-100 text-green-700' :
                  mlSuggestion.confidence >= 50 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  Confiance: {mlSuggestion.confidence}%
                </span>
              </div>

              <p className="text-sm text-[#666663] mb-3">{mlSuggestion.reasoning}</p>

              {mlSuggestion.adjustments && mlSuggestion.adjustments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-[#191919] mb-1">Ajustements détectés :</p>
                  <ul className="text-xs text-[#666663] list-disc list-inside space-y-1">
                    {mlSuggestion.adjustments.map((adj, idx) => (
                      <li key={idx}>{adj}</li>
                    ))}
                  </ul>
                </div>
              )}

              {showMLDetails && mlSuggestion.factors && (
                <div className="mt-3 pt-3 border-t border-purple-200">
                  <p className="text-xs font-semibold text-[#191919] mb-2">Détails de l'analyse :</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#666663]">
                    <div>
                      <span className="font-semibold">Saisonnalité :</span>{' '}
                      {mlSuggestion.factors.seasonality ? 'Détectée' : 'Non détectée'}
                    </div>
                    <div>
                      <span className="font-semibold">Tendance :</span>{' '}
                      {mlSuggestion.factors.trend || 'Stable'}
                    </div>
                    <div>
                      <span className="font-semibold">Volatilité :</span>{' '}
                      {mlSuggestion.factors.volatility || 'Moyenne'}
                    </div>
                    <div>
                      <span className="font-semibold">Points de données :</span>{' '}
                      {mlSuggestion.factors.dataPoints || 0}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyMLSuggestion}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  Appliquer la suggestion
                </button>
              </div>
            </div>
          </div>
        )}

        {!mlSuggestion && (
          <p className="text-sm text-[#666663] italic">
            Cliquez sur "Analyser avec ML" pour obtenir une suggestion basée sur l'historique des ventes.
          </p>
        )}
      </div>

      {/* Aide contextuelle */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-[#666663]">
          <strong className="text-[#191919]">💡 Astuce :</strong> Le multiplicateur ajuste les prévisions de ventes.
          Utilisez la modification manuelle pour des ajustements ponctuels (événements, promotions).
          Utilisez le ML pour une optimisation basée sur l'historique.
        </p>
      </div>
    </div>
  );
}

