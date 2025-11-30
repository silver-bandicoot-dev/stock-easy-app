import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Warehouse, Plus, Edit2, Trash2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '', 
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-black text-white hover:bg-[#333333] focus:ring-black shadow-lg',
    secondary: 'bg-[#40403E] text-[#FAFAF7] hover:bg-[#666663] focus:ring-[#40403E]',
    ghost: 'bg-transparent text-black hover:bg-black/10 focus:ring-black',
    danger: 'bg-[#EF1C43] text-white hover:bg-red-700 focus:ring-[#EF1C43] shadow-sm',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2.5 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-lg',
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

export const GestionWarehouses = ({ 
  warehouses = {}, 
  onCreateWarehouse, 
  onUpdateWarehouse, 
  onDeleteWarehouse 
}) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    notes: ''
  });

  const handleOpenModal = (warehouse = null) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        address: warehouse.address,
        city: warehouse.city,
        postalCode: warehouse.postalCode,
        country: warehouse.country || 'France',
        notes: warehouse.notes || ''
      });
    } else {
      setEditingWarehouse(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'France',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWarehouse(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: 'France',
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error(t('settings.warehouses.nameRequired'));
      return;
    }
    if (!formData.address.trim()) {
      toast.error(t('settings.warehouses.addressRequired'));
      return;
    }
    if (!formData.city.trim()) {
      toast.error(t('settings.warehouses.cityRequired'));
      return;
    }
    if (!formData.postalCode.trim()) {
      toast.error(t('settings.warehouses.postalCodeRequired'));
      return;
    }

    try {
      if (editingWarehouse) {
        // Utiliser l'ID si disponible, sinon utiliser le nom
        const warehouseId = editingWarehouse.id || editingWarehouse.name;
        await onUpdateWarehouse(warehouseId, formData);
        toast.success(t('settings.warehouses.messages.updated'));
      } else {
        await onCreateWarehouse(formData);
        toast.success(t('settings.warehouses.messages.created'));
      }
      handleCloseModal();
    } catch (error) {
      toast.error(t('settings.warehouses.messages.saveError', { error: error.message }));
    }
  };

  const handleDelete = async (warehouse) => {
    if (window.confirm(t('settings.warehouses.deleteConfirm', { name: warehouse.name }))) {
      try {
        await onDeleteWarehouse(warehouse);
        toast.success(t('settings.warehouses.messages.deleted'));
      } catch (error) {
        toast.error(t('settings.warehouses.messages.saveError', { error: error.message }));
      }
    }
  };

  // Filtrer les doublons et utiliser l'ID comme clé unique
  const warehousesList = useMemo(() => {
    const seen = new Set();
    const unique = [];
    
    for (const warehouse of Object.values(warehouses)) {
      // Utiliser l'ID si disponible, sinon le nom
      const key = warehouse.id || warehouse.name;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(warehouse);
      }
    }
    
    return unique;
  }, [warehouses]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#191919]">{t('settings.warehouses.title')}</h2>
          <p className="text-[#666663] mt-1">{t('settings.warehouses.subtitle')}</p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => handleOpenModal()}
        >
          {t('settings.warehouses.addWarehouse')}
        </Button>
      </div>

      {/* Liste des warehouses */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E5E4DF] overflow-hidden">
        {warehousesList.length === 0 ? (
          <div className="p-8 text-center">
            <Warehouse className="w-12 h-12 text-[#666663] mx-auto mb-3" />
            <p className="text-[#666663] mb-4">{t('settings.warehouses.noWarehouses')}</p>
            <Button
              variant="secondary"
              icon={Plus}
              onClick={() => handleOpenModal()}
            >
              {t('settings.warehouses.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E4DF]">
            {warehousesList.map((warehouse) => (
              <div key={warehouse.id || warehouse.name} className="p-6 hover:bg-[#FAFAF7] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Warehouse className="w-5 h-5 text-[#191919] shrink-0" />
                      <h3 className="text-lg font-bold text-[#191919]">{warehouse.name}</h3>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-[#666663] ml-8">
                      <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p>{warehouse.address}</p>
                        <p>{warehouse.postalCode} {warehouse.city}, {warehouse.country}</p>
                      </div>
                    </div>
                    {warehouse.notes && (
                      <p className="text-sm text-[#666663] mt-2 ml-8 italic">{warehouse.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenModal(warehouse)}
                    >
                      {t('settings.warehouses.modify')}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => handleDelete(warehouse)}
                    >
                      {t('settings.warehouses.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#E5E4DF]">
              <h3 className="text-xl font-bold text-[#191919]">
                {editingWarehouse ? t('settings.warehouses.editWarehouse') : t('settings.warehouses.addWarehouse')}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  {t('settings.warehouses.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('settings.warehouses.namePlaceholder')}
                  className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={!!editingWarehouse}
                />
                {editingWarehouse && (
                  <p className="text-xs text-[#666663] mt-1">{t('settings.warehouses.nameCannotBeModified')}</p>
                )}
              </div>

              {/* Adresse */}
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  {t('settings.warehouses.address')} *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t('settings.warehouses.addressPlaceholder')}
                  className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Ville et Code Postal */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    {t('settings.warehouses.postalCode')} *
                  </label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder={t('settings.warehouses.postalCodePlaceholder')}
                    className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#191919] mb-2">
                    {t('settings.warehouses.city')} *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder={t('settings.warehouses.cityPlaceholder')}
                    className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Pays */}
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  {t('settings.warehouses.country')} *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder={t('settings.warehouses.countryPlaceholder')}
                  className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-[#191919] mb-2">
                  {t('settings.warehouses.notes')}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t('settings.warehouses.notesPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#E5E4DF] rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  {t('settings.warehouses.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                >
                  {editingWarehouse ? t('settings.warehouses.modify') : t('settings.warehouses.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionWarehouses;

