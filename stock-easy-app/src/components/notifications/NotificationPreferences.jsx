import React, { useState, useEffect } from 'react';
import { Bell, Mail, Group, Clock, Save, Loader2, Check, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  NOTIFICATION_TYPES,
  EMAIL_FREQUENCY_OPTIONS,
  DAYS_OF_WEEK
} from '../../services/notificationPreferencesService';

const NotificationPreferences = ({ onClose }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('inapp'); // 'inapp', 'email', 'grouping'

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    setLoading(true);
    const { data, error } = await getNotificationPreferences();
    if (error) {
      toast.error('Erreur lors du chargement des préférences');
    } else {
      setPreferences(data);
    }
    setLoading(false);
  };

  const handleToggle = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
  };

  const handleChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const { success, error } = await updateNotificationPreferences(preferences);
    
    if (success) {
      toast.success('Préférences sauvegardées');
      setHasChanges(false);
    } else {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="p-8 text-center text-gray-500">
        Impossible de charger les préférences
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Préférences de notification</h2>
            <p className="text-sm text-gray-500">Personnalisez vos alertes</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('inapp')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'inapp'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          In-App
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'email'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          Email
        </button>
        <button
          onClick={() => setActiveTab('grouping')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'grouping'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Group className="w-4 h-4 inline mr-2" />
          Groupement
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
        {/* Tab: In-App Notifications */}
        {activeTab === 'inapp' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-6">
              Choisissez les types de notifications que vous souhaitez recevoir dans l'application.
            </p>
            
            {Object.values(NOTIFICATION_TYPES).map((type) => (
              <div
                key={type.key}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </div>
                <Toggle
                  checked={preferences[type.prefKey]}
                  onChange={() => handleToggle(type.prefKey)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Tab: Email Notifications */}
        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Master toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Activer les emails</div>
                  <div className="text-sm text-gray-500">Recevoir des notifications par email</div>
                </div>
              </div>
              <Toggle
                checked={preferences.emailEnabled}
                onChange={() => handleToggle('emailEnabled')}
              />
            </div>

            {preferences.emailEnabled && (
              <>
                {/* Fréquence */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fréquence des emails
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {EMAIL_FREQUENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleChange('emailFrequency', option.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          preferences.emailFrequency === option.value
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {preferences.emailFrequency === option.value && (
                            <Check className="w-4 h-4 text-blue-600" />
                          )}
                          {option.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Horaire du digest */}
                {(preferences.emailFrequency === 'daily' || preferences.emailFrequency === 'weekly') && (
                  <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Horaire de réception</span>
                    </div>
                    
                    <div className="flex gap-4">
                      {preferences.emailFrequency === 'weekly' && (
                        <div className="flex-1">
                          <label className="block text-sm text-gray-600 mb-1">Jour</label>
                          <select
                            value={preferences.emailDigestDay}
                            onChange={(e) => handleChange('emailDigestDay', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {DAYS_OF_WEEK.map((day) => (
                              <option key={day.value} value={day.value}>
                                {day.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <label className="block text-sm text-gray-600 mb-1">Heure</label>
                        <select
                          value={preferences.emailDigestHour}
                          onChange={(e) => handleChange('emailDigestHour', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {i.toString().padStart(2, '0')}:00
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Types d'emails */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Types de notifications par email
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>💬</span>
                        <span className="text-gray-900">Mentions</span>
                      </div>
                      <Toggle
                        checked={preferences.emailMentionEnabled}
                        onChange={() => handleToggle('emailMentionEnabled')}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span>🚨</span>
                        <span className="text-gray-900">Alertes ML critiques</span>
                      </div>
                      <Toggle
                        checked={preferences.emailMlAlertEnabled}
                        onChange={() => handleToggle('emailMlAlertEnabled')}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab: Grouping */}
        {activeTab === 'grouping' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Le groupement permet de regrouper les notifications similaires pour éviter la surcharge.
            </p>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Group className="w-6 h-6 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Grouper les notifications similaires</div>
                  <div className="text-sm text-gray-500">
                    Ex: "3 alertes ML" au lieu de 3 notifications séparées
                  </div>
                </div>
              </div>
              <Toggle
                checked={preferences.groupSimilarEnabled}
                onChange={() => handleToggle('groupSimilarEnabled')}
              />
            </div>

            {preferences.groupSimilarEnabled && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fenêtre de groupement
                </label>
                <p className="text-sm text-gray-500 mb-3">
                  Les notifications du même type reçues pendant cette période seront groupées.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    value={preferences.groupTimeWindowMinutes}
                    onChange={(e) => handleChange('groupTimeWindowMinutes', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
                    {preferences.groupTimeWindowMinutes >= 60 
                      ? `${Math.floor(preferences.groupTimeWindowMinutes / 60)}h${preferences.groupTimeWindowMinutes % 60 > 0 ? preferences.groupTimeWindowMinutes % 60 + 'min' : ''}`
                      : `${preferences.groupTimeWindowMinutes} min`
                    }
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="text-sm text-blue-800">
                  <strong>Exemple de groupement :</strong>
                  <br />
                  Si vous recevez 5 alertes ML en 1 heure, vous verrez une seule notification 
                  "🚨 5 alertes ML" au lieu de 5 notifications séparées.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {hasChanges ? (
            <span className="text-amber-600 font-medium">● Modifications non sauvegardées</span>
          ) : (
            <span className="text-green-600">✓ À jour</span>
          )}
        </div>
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              hasChanges && !saving
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Composant Toggle réutilisable
const Toggle = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      checked ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

export default NotificationPreferences;

