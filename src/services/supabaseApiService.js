export default {
  getAllData,
  getSalesHistory,
  createOrder,
  updateOrderStatus,
  processOrderReconciliation,
  updateStock,
  updateProduct,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  saveKPISnapshot,
  updateParameter,
  confirmOrderReconciliation
};

function formatDateForRpc(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}
