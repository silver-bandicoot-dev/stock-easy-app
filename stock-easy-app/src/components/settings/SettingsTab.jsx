import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Users, Package, MapPin, Cog } from 'lucide-react';
import { SubTabsNavigation } from '../features/SubTabsNavigation';
import { ParametresGeneraux } from '../settings/ParametresGeneraux';
import { GestionFournisseurs } from '../settings/GestionFournisseurs';
import { MappingSKUFournisseur } from '../settings/MappingSKUFournisseur';
import { GestionWarehouses } from '../settings/GestionWarehouses';
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
  setSeuilSurstockProfond,
  deviseDefaut,
  setDeviseDefaut,
  multiplicateurDefaut,
  setMultiplicateurDefaut,
  // Props pour GestionFournisseurs
  supplierModalOpen,
  setSupplierModalOpen,
  editingSupplier,
  setEditingSupplier,
  supplierFormData,
  setSupplierFormData,
  handleOpenSupplierModal,
  handleCloseSupplierModal,
  handleSupplierFormChange,
  handleSaveSupplier,
  handleDeleteSupplier,
  // Props pour MappingSKUFournisseur
  assignSupplierModalOpen,
  setAssignSupplierModalOpen,
  selectedProductForMapping,
  setSelectedProductForMapping,
  handleOpenAssignSupplierModal,
  handleCloseAssignSupplierModal,
  handleAssignSupplier,
  // Props pour GestionWarehouses
  warehouseModalOpen,
  setWarehouseModalOpen,
  editingWarehouse,
  setEditingWarehouse,
  warehouseFormData,
  setWarehouseFormData,
  handleOpenWarehouseModal,
  handleCloseWarehouseModal,
  handleWarehouseFormChange,
  handleSaveWarehouse,
  handleDeleteWarehouse
}) => {
  const settingsSections = [
    {
      key: SETTINGS_TABS.GENERAL,
      title: 'Paramètres Généraux',
      icon: Cog,
      shortTitle: 'Généraux'
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
          <Settings className="w-8 h-8 text-[#191919]" />
          <h1 className="text-2xl font-bold text-[#191919]">Paramètres</h1>
        </div>
        <p className="text-[#666663] ml-11">Configurez les paramètres de votre application</p>
        
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
                  onUpdateSeuil={setSeuilSurstockProfond}
                  devise={deviseDefaut}
                  onUpdateDevise={setDeviseDefaut}
                  multiplicateur={multiplicateurDefaut}
                  onUpdateMultiplicateur={setMultiplicateurDefaut}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.SUPPLIERS && (
                <GestionFournisseurs
                  suppliers={suppliers}
                  products={products}
                  supplierModalOpen={supplierModalOpen}
                  setSupplierModalOpen={setSupplierModalOpen}
                  editingSupplier={editingSupplier}
                  setEditingSupplier={setEditingSupplier}
                  supplierFormData={supplierFormData}
                  setSupplierFormData={setSupplierFormData}
                  handleOpenSupplierModal={handleOpenSupplierModal}
                  handleCloseSupplierModal={handleCloseSupplierModal}
                  handleSupplierFormChange={handleSupplierFormChange}
                  handleSaveSupplier={handleSaveSupplier}
                  handleDeleteSupplier={handleDeleteSupplier}
                  loadData={loadData}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.MAPPING && (
                <MappingSKUFournisseur
                  products={products}
                  suppliers={suppliers}
                  onOpenAssignModal={handleOpenAssignSupplierModal}
                  onRemoveSupplier={(product) => {
                    // TODO: Implémenter la logique pour retirer le fournisseur
                    console.log('Remove supplier from', product.sku);
                  }}
                />
              )}

              {parametersSubTab === SETTINGS_TABS.WAREHOUSES && (
                <GestionWarehouses
                  warehouses={warehouses}
                  onCreateWarehouse={handleSaveWarehouse}
                  onUpdateWarehouse={handleSaveWarehouse}
                  onDeleteWarehouse={handleDeleteWarehouse}
                />
              )}
            </motion.div>
          )
        ))}
      </AnimatePresence>
    </motion.div>
  );
};
