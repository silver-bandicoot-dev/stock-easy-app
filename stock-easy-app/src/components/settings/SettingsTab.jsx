import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cog, Sliders, Users, Package, MapPin, TrendingUp, PlugZap } from 'lucide-react';
import { SubTabsNavigation } from '../features/SubTabsNavigation';
import { ParametresGeneraux } from '../settings/ParametresGeneraux';
import { GestionFournisseurs } from '../settings/GestionFournisseurs';
import { MappingSKUFournisseur } from '../settings/MappingSKUFournisseur';
import { GestionWarehouses } from '../settings/GestionWarehouses';
import { GestionMultiplicateurs } from '../settings/GestionMultiplicateurs';
import { IntegrationsSettings } from '../settings/IntegrationsSettings';
import { SETTINGS_TABS } from '../../constants/stockEasyConstants';

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
  const settingsSections = [
    {
      key: SETTINGS_TABS.GENERAL,
      title: 'Paramètres Généraux',
      icon: Sliders,
      shortTitle: 'Généraux'
    },
    {
      key: SETTINGS_TABS.MULTIPLIERS,
      title: 'Multiplicateurs de Prévision',
      icon: TrendingUp,
      shortTitle: 'Multiplicateurs'
    },
    {
      key: SETTINGS_TABS.SUPPLIERS,
      title: 'Gestion Fournisseurs',
      icon: Users,
      shortTitle: 'Fournisseurs'
    },
    {
      key: SETTINGS_TABS.MAPPING,
      title: 'Mapping SKU-Fournisseur',
      icon: Package,
      shortTitle: 'Mapping'
    },
    {
      key: SETTINGS_TABS.WAREHOUSES,
      title: 'Gestion Entrepôts',
      icon: MapPin,
      shortTitle: 'Entrepôts'
    },
    {
      key: SETTINGS_TABS.INTEGRATIONS,
      title: 'Intégrations',
      icon: PlugZap,
      shortTitle: 'Intégrations'
    }
  ];

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header avec titre et sous-titre */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3 mb-2">
          <Cog className="w-8 h-8 text-[#191919]" />
          <h1 className="text-2xl font-bold text-[#191919]">Paramètres</h1>
        </div>
        <p className="text-xs sm:text-sm text-[#666663]">
          Configurez les paramètres de votre application
        </p>
        
        {/* Onglets de navigation - Optimisés mobile */}
        <div className="flex gap-2 mt-6 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
          {settingsSections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.key}
                onClick={() => setParametersSubTab(section.key)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  parametersSubTab === section.key
                    ? 'bg-black text-white'
                    : 'bg-[#FAFAF7] text-[#666663] hover:bg-[#F0F0EB]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{section.title}</span>
                <span className="sm:hidden">{section.shortTitle}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenu des sous-onglets */}
      <AnimatePresence mode="wait">
        {settingsSections.map(section => (
          parametersSubTab === section.key && (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
            >
              {parametersSubTab === SETTINGS_TABS.GENERAL && (
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
              )}

              {parametersSubTab === SETTINGS_TABS.SUPPLIERS && (
                <GestionFournisseurs
                  suppliers={suppliers}
                  products={products}
                  onOpenModal={handleOpenSupplierModal}
                  onDelete={handleDeleteSupplier}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.MAPPING && (
                <MappingSKUFournisseur
                  products={products}
                  suppliers={suppliers}
                  onSaveSupplierMapping={handleSaveSupplierMapping}
                  isSaving={isSavingSupplierMapping}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.WAREHOUSES && (
                <GestionWarehouses
                  warehouses={warehouses}
                  onCreateWarehouse={onCreateWarehouse}
                  onUpdateWarehouse={onUpdateWarehouse}
                  onDeleteWarehouse={onDeleteWarehouse}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.MULTIPLIERS && (
                <GestionMultiplicateurs
                  products={products}
                  loadData={loadData}
                  multiplicateurDefaut={multiplicateurDefaut}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.INTEGRATIONS && (
                <IntegrationsSettings />
              )}
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
