import { useState } from 'react';
import * as MappingHandlers from '../handlers/mappingHandlers';
import api from '../services/apiAdapter';

export const useSupplierMapping = (products, loadData) => {
  const [assignSupplierModalOpen, setAssignSupplierModalOpen] = useState(false);
  const [isSavingSupplierMapping, setIsSavingSupplierMapping] = useState(false);
  const [productToMap, setProductToMap] = useState(null);
  const [selectedSupplierForMapping, setSelectedSupplierForMapping] = useState('');
  const [selectedProductForMapping, setSelectedProductForMapping] = useState(null);

  const handleSaveSupplierMapping = async (supplierName, assignedSkus = []) => {
    return await MappingHandlers.handleSaveSupplierMapping(
      supplierName,
      assignedSkus,
      products,
      api,
      loadData,
      setIsSavingSupplierMapping
    );
  };

  const handleRemoveSupplierFromProduct = async (sku) => {
    return await MappingHandlers.handleRemoveSupplierFromProduct(sku, products, api, loadData);
  };

  const openAssignSupplierModal = (product) => {
    setProductToMap(product);
    // Pre-select current supplier if exists
    if (product.supplier) {
      setSelectedSupplierForMapping(product.supplier);
    } else {
      setSelectedSupplierForMapping('');
    }
    setAssignSupplierModalOpen(true);
  };

  const closeAssignSupplierModal = () => {
    MappingHandlers.handleCloseAssignSupplierModal(
      setAssignSupplierModalOpen,
      setProductToMap,
      setSelectedSupplierForMapping
    );
  };

  return {
    assignSupplierModalOpen,
    setAssignSupplierModalOpen,
    isSavingSupplierMapping,
    productToMap,
    setProductToMap,
    selectedSupplierForMapping,
    setSelectedSupplierForMapping,
    selectedProductForMapping,
    setSelectedProductForMapping,
    handleSaveSupplierMapping,
    handleRemoveSupplierFromProduct,
    openAssignSupplierModal,
    closeAssignSupplierModal
  };
};

