import React from 'react';
import { motion } from 'framer-motion';
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
  const settingsTabs = [
    { id: SETTINGS_TABS.GENERAL, label: 'Paramètres Généraux', icon: Cog },
    { id: SETTINGS_TABS.SUPPLIERS, label: 'Gestion Fournisseurs', icon: Users },
    { id: SETTINGS_TABS.MAPPING, label: 'Mapping SKU-Fournisseur', icon: Package },
    { id: SETTINGS_TABS.WAREHOUSES, label: 'Gestion Entrepôts', icon: MapPin }
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
      {/* En-tête */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200 shrink-0">
            <Settings className="w-6 h-6 text-gray-600 shrink-0" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Paramètres</h2>
            <p className="text-sm text-gray-600">Configurez les paramètres de votre application</p>
          </div>
        </div>
      </div>

      {/* Navigation des sous-onglets */}
      <SubTabsNavigation
        tabs={settingsTabs}
        activeTab={parametersSubTab}
        onChange={setParametersSubTab}
      />

      {/* Contenu des sous-onglets */}
      <motion.div
        key={parametersSubTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
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
            assignSupplierModalOpen={assignSupplierModalOpen}
            setAssignSupplierModalOpen={setAssignSupplierModalOpen}
            selectedProductForMapping={selectedProductForMapping}
            setSelectedProductForMapping={setSelectedProductForMapping}
            handleOpenAssignSupplierModal={handleOpenAssignSupplierModal}
            handleCloseAssignSupplierModal={handleCloseAssignSupplierModal}
            handleAssignSupplier={handleAssignSupplier}
            loadData={loadData}
          />
        )}

        {parametersSubTab === SETTINGS_TABS.WAREHOUSES && (
          <GestionWarehouses
            warehouses={warehouses}
            warehouseModalOpen={warehouseModalOpen}
            setWarehouseModalOpen={setWarehouseModalOpen}
            editingWarehouse={editingWarehouse}
            setEditingWarehouse={setEditingWarehouse}
            warehouseFormData={warehouseFormData}
            setWarehouseFormData={setWarehouseFormData}
            handleOpenWarehouseModal={handleOpenWarehouseModal}
            handleCloseWarehouseModal={handleCloseWarehouseModal}
            handleWarehouseFormChange={handleWarehouseFormChange}
            handleSaveWarehouse={handleSaveWarehouse}
            handleDeleteWarehouse={handleDeleteWarehouse}
            loadData={loadData}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
