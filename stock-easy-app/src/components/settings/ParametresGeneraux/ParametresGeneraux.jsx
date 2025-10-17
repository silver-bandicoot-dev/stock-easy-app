import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';

/**
 * Composant de paramètres généraux de l'application
 * @param {Object} props
 * @param {number} props.seuilSurstock - Seuil de surstock en jours
 * @param {Function} props.onUpdateSeuil - Callback de mise à jour du seuil
 * @param {string} props.devise - Devise par défaut
 * @param {Function} props.onUpdateDevise - Callback de mise à jour de la devise
 * @param {number} props.multiplicateur - Multiplicateur par défaut
 * @param {Function} props.onUpdateMultiplicateur - Callback de mise à jour du multiplicateur
 * @returns {JSX.Element}
 */
export function ParametresGeneraux({ 
  seuilSurstock, 
  onUpdateSeuil, 
  devise, 
  onUpdateDevise,
  multiplicateur,
  onUpdateMultiplicateur
}) {
  const [tempSeuil, setTempSeuil] = useState(seuilSurstock);
  const [tempDevise, setTempDevise] = useState(devise);
  const [tempMultiplicateur, setTempMultiplicateur] = useState(multiplicateur);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
  }, [seuilSurstock, devise, multiplicateur]);

  useEffect(() => {
    const changed = tempSeuil !== seuilSurstock || 
                    tempDevise !== devise || 
                    tempMultiplicateur !== multiplicateur;
    setHasChanges(changed);
    if (changed) setSaveSuccess(false);
  }, [tempSeuil, tempDevise, tempMultiplicateur, seuilSurstock, devise, multiplicateur]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises = [];
      if (tempSeuil !== seuilSurstock) promises.push(onUpdateSeuil(tempSeuil));
      if (tempDevise !== devise) promises.push(onUpdateDevise(tempDevise));
      if (tempMultiplicateur !== multiplicateur) promises.push(onUpdateMultiplicateur(tempMultiplicateur));
      
      await Promise.all(promises);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {saveSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-green-800 font-medium">✅ Paramètres sauvegardés avec succès !</span>
        </div>
      )}

      {/* Boutons de sauvegarde */}
      {hasChanges && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <span className="text-yellow-800 font-medium">Vous avez des modifications non sauvegardées</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button 
              variant="primary" 
              icon={isSaving ? RefreshCw : Check}
              onClick={handleSave}
              disabled={isSaving}
              className={isSaving ? 'opacity-75' : ''}
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
            </Button>
          </div>
        </div>
      )}

      {/* Devise */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">💰 Devise par défaut</h3>
        <p className="text-sm text-[#666663] mb-4">
          Devise utilisée pour afficher les prix dans l'application
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['EUR', 'USD', 'GBP', 'CAD'].map(curr => (
            <button
              key={curr}
              onClick={() => setTempDevise(curr)}
              className={`
                px-4 py-3 rounded-lg border-2 font-medium transition-all
                ${tempDevise === curr
                  ? 'border-[#8B5CF6] bg-purple-50 text-[#8B5CF6]'
                  : 'border-[#E5E4DF] hover:border-[#BFBFBA] text-[#666663]'
                }
              `}
            >
              {curr}
            </button>
          ))}
        </div>
        
        <div className="mt-3 p-3 bg-[#FAFAF7] rounded-lg">
          <span className="text-sm text-[#666663]">Devise sélectionnée : </span>
          <span className="text-sm font-bold text-[#191919]">{tempDevise}</span>
        </div>
      </div>
      
      {/* Seuil Surstock */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">📊 Seuil Surstock Profond</h3>
        <p className="text-sm text-[#666663] mb-4">
          Nombre de jours d'autonomie à partir duquel un produit est considéré en surstock profond
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setTempSeuil(60)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 60
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">60 jours</div>
            <div className="text-xs text-[#666663]">Fashion</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(90)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 90
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">90 jours ⭐</div>
            <div className="text-xs text-[#666663]">Standard</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(120)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 120
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">120 jours</div>
            <div className="text-xs text-[#666663]">Durable</div>
          </button>
          
          <button
            onClick={() => setTempSeuil(180)}
            className={`
              px-4 py-3 rounded-lg border-2 transition-all
              ${tempSeuil === 180
                ? 'border-[#8B5CF6] bg-purple-50'
                : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
              }
            `}
          >
            <div className="font-semibold text-[#191919]">180 jours</div>
            <div className="text-xs text-[#666663]">B2B</div>
          </button>
        </div>
        
        <div className="mt-3 p-3 bg-[#FAFAF7] rounded-lg">
          <span className="text-sm text-[#666663]">Valeur sélectionnée : </span>
          <span className="text-sm font-bold text-[#191919]">{tempSeuil} jours</span>
        </div>
      </div>
      
      {/* Multiplicateur */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">📈 Multiplicateur par défaut</h3>
        <p className="text-sm text-[#666663] mb-4">
          Coefficient appliqué aux nouveaux produits pour ajuster les prévisions
        </p>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTempMultiplicateur(Math.max(0.1, tempMultiplicateur - 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
          >
            <span className="text-xl font-bold text-[#666663]">-</span>
          </button>
          
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-[#191919]">{tempMultiplicateur.toFixed(1)}</div>
          </div>
          
          <button
            onClick={() => setTempMultiplicateur(Math.min(5, tempMultiplicateur + 0.1))}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-[#E5E4DF] hover:border-[#8B5CF6] hover:bg-purple-50 transition-all"
          >
            <span className="text-xl font-bold text-[#666663]">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}

