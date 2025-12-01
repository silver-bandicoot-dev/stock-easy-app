import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Users, Package, Warehouse, TrendingUp, PlugZap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ParametresGeneraux } from '../settings/ParametresGeneraux';
import { GestionFournisseurs } from '../settings/GestionFournisseurs';
import { MappingSKUFournisseur } from '../settings/MappingSKUFournisseur';
import GestionWarehouses from '../settings/GestionWarehouses';
import { GestionMultiplicateurs } from '../settings/GestionMultiplicateurs';
import { IntegrationsSettings } from '../settings/IntegrationsSettings';
import { SETTINGS_TABS } from '../../constants/stockEasyConstants';
import { useStockContext } from '../../contexts/StockDataContext';

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
  // Navigation - Support both naming conventions
  subTab,
  setSubTab,
  parametersSubTab: parametersSubTabProp,
  setParametersSubTab: setParametersSubTabProp,
  
  // Parameter State (new way)
  parameterState,
  handleInputChange,
  handleSaveParameters,
  handleResetParameters,
  isDirty,
  isSavingParameters,
  
  // Legacy props (for backwards compatibility)
  parameters: parametersProp,
  setParameters,
  loadData: loadDataProp,
  seuilSurstockProfond: seuilSurstockProfondProp,
  onUpdateSeuilSurstock,
  deviseDefaut: deviseDefautProp,
  onUpdateDevise,
  multiplicateurDefaut: multiplicateurDefautProp,
  onUpdateMultiplicateur,
  
  // Suppliers
  suppliers,
  supplierModalOpen,
  editingSupplier,
  handleOpenSupplierModal,
  handleCloseSupplierModal,
  handleSaveSupplier,
  handleDeleteSupplier,
  
  // Mapping
  assignSupplierModalOpen,
  setAssignSupplierModalOpen,
  selectedProductForMapping,
  setSelectedProductForMapping,
  handleSaveSupplierMapping,
  isSavingSupplierMapping,
  
  // Warehouses
  warehouses: warehousesProp,
  onCreateWarehouse,
  onUpdateWarehouse,
  onDeleteWarehouse,
  
  // Products (may come from context)
  products: productsProp
}) => {
  const { t } = useTranslation();
  const settingsSections = getSettingsSections(t);
  
  // Get data from context as fallback
  const stockContext = useStockContext();
  
  // Use props or fallback to context
  const products = productsProp || stockContext?.products || stockContext?.enrichedProducts || [];
  const warehouses = warehousesProp || stockContext?.warehouses || [];
  const loadData = loadDataProp || stockContext?.refreshData;
  
  // Support both naming conventions for tabs
  const currentSubTab = subTab || parametersSubTabProp || SETTINGS_TABS.GENERAL;
  const setCurrentSubTab = setSubTab || setParametersSubTabProp;
  
  // Extract values from parameterState or use legacy props
  const seuilSurstockProfond = parameterState?.seuilSurstockProfond ?? seuilSurstockProfondProp ?? 90;
  const deviseDefaut = parameterState?.deviseDefaut ?? deviseDefautProp ?? 'EUR';
  const multiplicateurDefaut = parameterState?.multiplicateurDefaut ?? multiplicateurDefautProp ?? 1.2;
  
  // Create update handlers from parameterState if available
  const handleUpdateSeuil = onUpdateSeuilSurstock || ((value) => {
    if (handleInputChange) {
      handleInputChange('seuilSurstockProfond', value);
    }
  });
  
  const handleUpdateDevise = onUpdateDevise || ((value) => {
    if (handleInputChange) {
      handleInputChange('deviseDefaut', value);
    }
  });
  
  const handleUpdateMultiplicateur = onUpdateMultiplicateur || ((value) => {
    if (handleInputChange) {
      handleInputChange('multiplicateurDefaut', value);
    }
  });

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
              onClick={() => setCurrentSubTab(section.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentSubTab === section.key
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
          {currentSubTab === SETTINGS_TABS.GENERAL && (
            <motion.div
              key="general"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <ParametresGeneraux
                seuilSurstock={seuilSurstockProfond}
                onUpdateSeuil={handleUpdateSeuil}
                devise={deviseDefaut}
                onUpdateDevise={handleUpdateDevise}
                multiplicateur={multiplicateurDefaut}
                onUpdateMultiplicateur={handleUpdateMultiplicateur}
                loadData={loadData}
              />
            </motion.div>
          )}

          {currentSubTab === SETTINGS_TABS.MULTIPLIERS && (
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

          {currentSubTab === SETTINGS_TABS.SUPPLIERS && (
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

          {currentSubTab === SETTINGS_TABS.MAPPING && (
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

          {currentSubTab === SETTINGS_TABS.WAREHOUSES && (
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

          {currentSubTab === SETTINGS_TABS.INTEGRATIONS && (
            <motion.div
              key="integrations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              <IntegrationsSettings products={products} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
