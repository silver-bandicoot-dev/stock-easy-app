import * as WarehouseHandlers from '../handlers/warehouseHandlers';

export const useWarehouseActions = (api, loadData) => {
  const handleCreateWarehouse = async (warehouseData) => {
    return await WarehouseHandlers.handleCreateWarehouse(warehouseData, api, loadData);
  };

  const handleUpdateWarehouse = async (warehouseName, warehouseData) => {
    return await WarehouseHandlers.handleUpdateWarehouse(warehouseName, warehouseData, api, loadData);
  };

  const handleDeleteWarehouse = async (warehouse) => {
    return await WarehouseHandlers.handleDeleteWarehouse(warehouse, api, loadData);
  };

  return {
    handleCreateWarehouse,
    handleUpdateWarehouse,
    handleDeleteWarehouse
  };
};

