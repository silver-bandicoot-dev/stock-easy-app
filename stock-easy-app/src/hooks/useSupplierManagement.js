import { useState } from 'react';
import api from '../services/apiService';
import { toast } from 'sonner';

/**
 * Hook pour gérer les fournisseurs
 * Extrait de StockEasy.jsx
 */
export const useSupplierManagement = (suppliers, loadData) => {
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    email: '',
    leadTimeDays: 30,
    moq: 50,
    notes: ''
  });

  const handleOpenSupplierModal = (supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setSupplierFormData({
        name: supplier.name,
        email: supplier.email,
        leadTimeDays: supplier.leadTimeDays,
        moq: supplier.moq || 50,
        notes: supplier.notes || ''
      });
    } else {
      setEditingSupplier(null);
      setSupplierFormData({
        name: '',
        email: '',
        leadTimeDays: 30,
        moq: 50,
        notes: ''
      });
    }
    setSupplierModalOpen(true);
  };

  const handleCloseSupplierModal = () => {
    setSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierFormData({
      name: '',
      email: '',
      leadTimeDays: 30,
      moq: 50,
      notes: ''
    });
  };

  const handleSupplierFormChange = (field, value) => {
    setSupplierFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateSupplierForm = () => {
    const errors = [];
    
    if (!supplierFormData.name.trim()) {
      errors.push('Le nom du fournisseur est obligatoire');
    }
    
    if (!supplierFormData.email.trim()) {
      errors.push('L\'email est obligatoire');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplierFormData.email)) {
      errors.push('L\'email n\'est pas valide');
    }
    
    if (supplierFormData.leadTimeDays <= 0) {
      errors.push('Le délai doit être supérieur à 0');
    }
    
    if (supplierFormData.moq <= 0) {
      errors.push('Le MOQ doit être supérieur à 0');
    }
    
    if (!editingSupplier) {
      const existingSupplier = Object.values(suppliers).find(
        s => s.name.toLowerCase() === supplierFormData.name.toLowerCase()
      );
      if (existingSupplier) {
        errors.push('Un fournisseur avec ce nom existe déjà');
      }
    }
    
    return errors;
  };

  const handleSaveSupplier = async () => {
    const errors = validateSupplierForm();
    
    if (errors.length > 0) {
      toast.error('Erreurs : ' + errors.join(', '));
      return;
    }
    
    try {
      if (editingSupplier) {
        await api.updateSupplier(editingSupplier.name, supplierFormData);
        toast.success('Fournisseur mis à jour !');
      } else {
        await api.createSupplier(supplierFormData);
        toast.success('Fournisseur créé !');
      }
      
      await loadData();
      handleCloseSupplierModal();
    } catch (error) {
      console.error('❌ Erreur sauvegarde fournisseur:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteSupplier = async (supplier) => {
    try {
      await api.deleteSupplier(supplier.name);
      toast.success('Fournisseur supprimé !');
      await loadData();
    } catch (error) {
      console.error('❌ Erreur suppression fournisseur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  return {
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
    handleDeleteSupplier
  };
};
