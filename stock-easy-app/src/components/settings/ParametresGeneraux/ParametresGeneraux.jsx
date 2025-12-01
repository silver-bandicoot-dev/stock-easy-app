import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

// Obtenir une recommandation selon la valeur du seuil (avec traduction)
const getRecommendationForValue = (value, t) => {
  if (value <= 60) return { type: 'Fashion', description: t('settings.general.thresholds.fashionDesc') };
  if (value <= 90) return { type: 'Standard', description: t('settings.general.thresholds.standardDesc') };
  if (value <= 120) return { type: 'Durable', description: t('settings.general.thresholds.durableDesc') };
  if (value <= 180) return { type: 'B2B', description: t('settings.general.thresholds.b2bDesc') };
  return { type: t('settings.general.custom'), description: t('settings.general.thresholds.customDesc') };
};

// Seuils prédéfinis (valeurs)
const PREDEFINED_VALUES = [60, 90, 120, 180];

// Vérifier si la valeur correspond à un seuil prédéfini
const isPredefinedValue = (value) => {
  return PREDEFINED_VALUES.includes(value);
};

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
  onUpdateMultiplicateur,
  loadData
}) {
  const { t } = useTranslation();
  const [tempSeuil, setTempSeuil] = useState(seuilSurstock);
  
  // Seuils prédéfinis avec recommandations (traduits)
  const PREDEFINED_THRESHOLDS = [
    { value: 60, label: t('settings.general.thresholds.fashion'), type: 'Fashion', description: t('settings.general.thresholds.fashionDesc') },
    { value: 90, label: t('settings.general.thresholds.standard'), type: 'Standard', description: t('settings.general.thresholds.standardDesc') },
    { value: 120, label: t('settings.general.thresholds.durable'), type: 'Durable', description: t('settings.general.thresholds.durableDesc') },
    { value: 180, label: t('settings.general.thresholds.b2b'), type: 'B2B', description: t('settings.general.thresholds.b2bDesc') }
  ];
  const [tempDevise, setTempDevise] = useState(devise);
  const [tempMultiplicateur, setTempMultiplicateur] = useState(multiplicateur);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [customSeuilInput, setCustomSeuilInput] = useState('');
  const [seuilError, setSeuilError] = useState('');

  useEffect(() => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
    // Réinitialiser l'input personnalisé si la valeur correspond à un seuil prédéfini
    if (isPredefinedValue(seuilSurstock)) {
      setCustomSeuilInput('');
    } else {
      setCustomSeuilInput(seuilSurstock.toString());
    }
  }, [seuilSurstock, devise, multiplicateur]);

  useEffect(() => {
    const changed = tempSeuil !== seuilSurstock || 
                    tempDevise !== devise || 
                    tempMultiplicateur !== multiplicateur;
    setHasChanges(changed);
    if (changed) setSaveSuccess(false);
  }, [tempSeuil, tempDevise, tempMultiplicateur, seuilSurstock, devise, multiplicateur]);

  const handleSave = async () => {
    if (!hasChanges) {
      return;
    }

    setIsSaving(true);
    try {
      const promises = [];
      if (tempSeuil !== seuilSurstock) promises.push(onUpdateSeuil(tempSeuil));
      if (tempDevise !== devise) promises.push(onUpdateDevise(tempDevise));
      if (tempMultiplicateur !== multiplicateur) promises.push(onUpdateMultiplicateur(tempMultiplicateur));

      await Promise.all(promises);

      if (typeof loadData === 'function') {
        await loadData();
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast.error(error.message || t('settings.general.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempSeuil(seuilSurstock);
    setTempDevise(devise);
    setTempMultiplicateur(multiplicateur);
    setHasChanges(false);
    setSeuilError('');
    // Réinitialiser l'input personnalisé
    if (isPredefinedValue(seuilSurstock)) {
      setCustomSeuilInput('');
    } else {
      setCustomSeuilInput(seuilSurstock.toString());
    }
  };
  
  // Gestion du changement de seuil personnalisé
  const handleCustomSeuilChange = (value) => {
    setCustomSeuilInput(value);
    setSeuilError('');
    
    // Si le champ est vide, ne rien faire
    if (value === '') {
      return;
    }
    
    // Valider que c'est un nombre
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      setSeuilError(t('settings.general.validation.invalidNumber'));
      return;
    }
    
    // Valider la plage (1-365 jours)
    if (numValue < 1 || numValue > 365) {
      setSeuilError(t('settings.general.validation.rangeError'));
      return;
    }
    
    // Si la valeur correspond à un seuil prédéfini, le sélectionner
    if (isPredefinedValue(numValue)) {
      setTempSeuil(numValue);
      setCustomSeuilInput('');
    } else {
      setTempSeuil(numValue);
    }
  };
  
  const handlePredefinedSeuilClick = (value) => {
    setTempSeuil(value);
    setCustomSeuilInput('');
    setSeuilError('');
  };

  return (
    <div className="space-y-6">
      {/* Message de succès */}
      {saveSuccess && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-green-800 font-medium">{t('settings.general.savedSuccess')}</span>
        </div>
      )}

      {/* Boutons de sauvegarde */}
      {hasChanges && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
            <span className="text-yellow-800 font-medium">{t('settings.general.unsavedChanges')}</span>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              variant="primary" 
              icon={isSaving ? RefreshCw : Check}
              onClick={handleSave}
              disabled={isSaving}
              className={isSaving ? 'opacity-75' : ''}
            >
              {isSaving ? t('settings.general.saving') : t('settings.general.saveParameters')}
            </Button>
          </div>
        </div>
      )}

      {/* Devise */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">{t('settings.general.currencyTitle')}</h3>
        <p className="text-sm text-[#666663] mb-4">
          {t('settings.general.currencyHelp')}
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
          <span className="text-sm text-[#666663]">{t('settings.general.selectedCurrency')}: </span>
          <span className="text-sm font-bold text-[#191919]">{tempDevise}</span>
        </div>
      </div>
      
      {/* Seuil Surstock */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">{t('settings.general.overstockThresholdTitle')}</h3>
        <p className="text-sm text-[#666663] mb-4">
          {t('settings.general.overstockThresholdHelp')}
        </p>
        
        {/* Recommandations prédéfinies */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#191919] mb-2">
            {t('settings.general.recommendations')}:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PREDEFINED_THRESHOLDS.map((threshold) => (
              <button
                key={threshold.value}
                onClick={() => handlePredefinedSeuilClick(threshold.value)}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-left
                  ${tempSeuil === threshold.value && isPredefinedValue(tempSeuil)
                    ? 'border-[#8B5CF6] bg-purple-50'
                    : 'border-[#E5E4DF] hover:border-[#BFBFBA]'
                  }
                `}
                title={threshold.description}
              >
                <div className="font-semibold text-[#191919]">{threshold.label}</div>
                <div className="text-xs text-[#666663]">{threshold.type}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Champ personnalisé */}
        <div className="mb-3">
          <label className="block text-sm font-medium text-[#191919] mb-2">
            {t('settings.general.customValueLabel')}:
          </label>
          <input
            type="number"
            min="1"
            max="365"
            value={customSeuilInput}
            onChange={(e) => handleCustomSeuilChange(e.target.value)}
            placeholder={isPredefinedValue(tempSeuil) ? "Ex : 75 jours" : `Ex : ${tempSeuil} jours`}
            className={`
              w-full px-4 py-2 rounded-lg border-2 transition-all
              ${seuilError 
                ? 'border-red-300 bg-red-50' 
                : isPredefinedValue(tempSeuil)
                  ? 'border-[#E5E4DF]'
                  : 'border-[#8B5CF6] bg-purple-50'
              }
              focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6]
            `}
          />
          {seuilError && (
            <p className="mt-2 text-sm text-red-600">{seuilError}</p>
          )}
        </div>
        
        {/* Affichage de la valeur sélectionnée avec recommandation */}
        <div className={`mt-3 p-3 rounded-lg ${
          isPredefinedValue(tempSeuil) 
            ? 'bg-[#FAFAF7]' 
            : 'bg-purple-50 border border-[#8B5CF6]'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[#666663]">{t('settings.general.selectedValue')}: </span>
              <span className="text-sm font-bold text-[#191919]">{tempSeuil} {t('settings.general.days')}</span>
              {!isPredefinedValue(tempSeuil) && (
                <span className="ml-2 text-xs text-[#8B5CF6] font-medium">({t('settings.general.custom')})</span>
              )}
            </div>
          </div>
          {(() => {
            const recommendation = getRecommendationForValue(tempSeuil, t);
            return (
              <div className="mt-2 pt-2 border-t border-[#E5E4DF]">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#666663] whitespace-nowrap">💡 {t('settings.general.recommendationLabel')}:</span>
                  <span className="text-xs text-[#191919]">
                    <span className="font-medium">{recommendation.type}</span>
                    <span className="text-[#666663] ml-1">- {recommendation.description}</span>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
      
      {/* Multiplicateur */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <h3 className="text-lg font-semibold text-[#191919] mb-4">{t('settings.general.multiplierTitle')}</h3>
        <p className="text-sm text-[#666663] mb-4">
          {t('settings.general.multiplierHelp')}
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

