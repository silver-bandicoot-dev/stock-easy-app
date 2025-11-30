import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Users, Package, Warehouse, TrendingUp, PlugZap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ParametresGeneraux } from '../settings/ParametresGeneraux';
import { GestionFournisseurs } from '../settings/GestionFournisseurs';
import { MappingSKUFournisseur } from '../settings/MappingSKUFournisseur';
import { GestionWarehouses } from '../settings/GestionWarehouses';
import { GestionMultiplicateurs } from '../settings/GestionMultiplicateurs';
import { IntegrationsSettings } from '../settings/IntegrationsSettings';
import { SETTINGS_TABS } from '../../constants/stockEasyConstants';

// Settings tabs configuration
const getSettingsSections = (t) => [
  { key: SETTINGS_TABS.GENERAL, label: t('settings.tabs.general'), icon: Sliders },
  { key: SETTINGS_TABS.MULTIPLIERS, label: t('settings.tabs.multipliers'), icon: TrendingUp },
  { key: SETTINGS_TABS.SUPPLIERS, label: t('settings.tabs.suppliers'), icon: Users },
  { key: SETTINGS_TABS.MAPPING, label: t('settings.tabs.mapping'), icon: Package },
  { key: SETTINGS_TABS.WAREHOUSES, label: t('settings.tabs.warehouses'), icon: Warehouse },
  { key: SETTINGS_TABS.INTEGRATIONS, label: t('settings.tabs.integrations'), icon: PlugZap }
];

export const SettingsTab = ({
  parametersSubTab,
  setParametersSubTab,
  products,
  suppliers,
  warehouses,
  parameters,
  setParameters,
  loadData,
  // Props pour ParametresGeneraux
  seuilSurstockProfond,
  onUpdateSeuilSurstock,
  deviseDefaut,
  onUpdateDevise,
  multiplicateurDefaut,
  onUpdateMultiplicateur,
  // Props pour GestionFournisseurs
  handleOpenSupplierModal,
  handleDeleteSupplier,
  // Props pour MappingSKUFournisseur
  handleSaveSupplierMapping,
  isSavingSupplierMapping,
  // Props pour GestionWarehouses
  onCreateWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse
}) => {
  const { t } = useTranslation();
  const settingsSections = getSettingsSections(t);

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="h-full flex flex-col space-y-6"
    >
      {/* Header - Style Dashboard épuré */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#191919]">
            {t('settings.title')}
          </h1>
          <p className="text-sm text-[#6B7177] mt-0.5">
            {t('settings.subtitle')}
          </p>
        </div>
      </div>

      {/* Onglets - Style pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {settingsSections.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.key}
              onClick={() => setParametersSubTab(section.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                parametersSubTab === section.key
                  ? 'bg-[#191919] text-white shadow-sm'
                  : 'bg-white text-[#6B7177] border border-[#E1E3E5] hover:border-[#8A8C8E] hover:text-[#191919]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenu des sous-onglets */}
      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {parametersSubTab === SETTINGS_TABS.GENERAL && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <ParametresGeneraux
                parameters={parameters}
                setParameters={setParameters}
                loadData={loadData}
                seuilSurstock={seuilSurstockProfond}
                onUpdateSeuil={onUpdateSeuilSurstock}
                devise={deviseDefaut}
                onUpdateDevise={onUpdateDevise}
                multiplicateur={multiplicateurDefaut}
                onUpdateMultiplicateur={onUpdateMultiplicateur}
              />
            </motion.div>
          )}

          {parametersSubTab === SETTINGS_TABS.MULTIPLIERS && (
            <motion.div
              key="multipliers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GestionMultiplicateurs
                products={products}
                loadData={loadData}
                multiplicateurDefaut={multiplicateurDefaut}
              />
            </motion.div>
          )}

          {parametersSubTab === SETTINGS_TABS.SUPPLIERS && (
            <motion.div
              key="suppliers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GestionFournisseurs
                suppliers={suppliers}
                products={products}
                onOpenModal={handleOpenSupplierModal}
                onDelete={handleDeleteSupplier}
              />
            </motion.div>
          )}

          {parametersSubTab === SETTINGS_TABS.MAPPING && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <MappingSKUFournisseur
                products={products}
                suppliers={suppliers}
                onSaveSupplierMapping={handleSaveSupplierMapping}
                isSaving={isSavingSupplierMapping}
              />
            </motion.div>
          )}

          {parametersSubTab === SETTINGS_TABS.WAREHOUSES && (
            <motion.div
              key="warehouses"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <GestionWarehouses
                warehouses={warehouses}
                onCreateWarehouse={onCreateWarehouse}
                onUpdateWarehouse={onUpdateWarehouse}
                onDeleteWarehouse={onDeleteWarehouse}
              />
            </motion.div>
          )}

          {parametersSubTab === SETTINGS_TABS.INTEGRATIONS && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <IntegrationsSettings />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
