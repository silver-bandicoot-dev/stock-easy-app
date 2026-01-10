import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Loader2,
  Package,
  ChevronRight,
  CheckCircle,
  Truck,
  PackageCheck,
  FileCheck,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { formatConfirmedDate, formatETA, calculateETA } from '../../utils/dateUtils';
import { ORDER_STATUS_COLORS } from '../../constants/stockEasyConstants';

export const OrdersTable = ({
  orders,
  loading,
  suppliers,
  products,
  warehouses,
  selectedOrders,
  onSelectAll,
  onSelectOne,
  onSelectOrder,
  selectedOrder,
  sortConfig,
  onSort,
  formatCurrency,
  // Nouveaux handlers pour les actions
  onConfirmOrder,
  onShipOrder,
  onReceiveOrder,
  onStartReconciliation,
  onConfirmReconciliation
}) => {
  const { t } = useTranslation();
  
  const columns = [
    { key: 'select', label: '', sortable: false, width: 'w-12' },
    { key: 'id', label: t('ordersTable.columns.poNumber'), sortable: true, width: 'w-32' },
    { key: 'createdAt', label: t('ordersTable.columns.date'), sortable: true, width: 'w-28' },
    { key: 'supplier', label: t('ordersTable.columns.supplier'), sortable: true, width: 'w-40' },
    { key: 'eta', label: t('ordersTable.columns.eta', 'ETA'), sortable: true, width: 'w-44' },
    { key: 'warehouse', label: t('ordersTable.columns.warehouse'), sortable: false, width: 'w-28 hidden lg:table-cell' },
    { key: 'total', label: t('ordersTable.columns.total'), sortable: true, width: 'w-24' },
    { key: 'status', label: t('ordersTable.columns.status'), sortable: true, width: 'w-32' },
    { key: 'items', label: t('ordersTable.columns.items'), sortable: false, width: 'w-20 hidden md:table-cell' },
    { key: 'actions', label: t('ordersTable.columns.actions'), sortable: false, width: 'w-40' },
    { key: 'chevron', label: '', sortable: false, width: 'w-10' }
  ];

  // Fonction pour obtenir le badge ETA avec couleur selon le statut
  const getETABadge = (order) => {
    // Utiliser order.eta en priorité, sinon calculer
    // Cela garantit la cohérence avec OrderDetailPanel
    const calculatedETA = order.eta || calculateETA(
      order.confirmedAt || order.createdAt,
      null,
      suppliers,
      order.supplier
    );

    if (!calculatedETA) {
      return (
        <span className="text-xs text-[#999999] italic">
          {t('ordersTable.eta.pendingConfirmation', 'En attente')}
        </span>
      );
    }

    // Pour les commandes complétées, utiliser receivedAt comme référence
    const isCompleted = order.status === 'completed';
    const referenceDate = isCompleted ? order.receivedAt : null;
    const etaInfo = formatETA(calculatedETA, true, { referenceDate, isCompleted });

    if (!etaInfo) {
      return (
        <span className="text-xs text-[#999999] italic">
          —
        </span>
      );
    }

    // Formatage court de la date avec année (ex: "25 déc. 2025")
    const etaDate = new Date(calculatedETA);
    const shortDate = etaDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    // Déterminer le style du badge selon le statut
    let badgeClass, icon, statusText;

    if (isCompleted) {
      if (etaInfo.isPast) {
        // Livré en retard
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
        icon = <AlertTriangle className="w-3 h-3" />;
        statusText = t('ordersTable.eta.deliveredLate', { count: Math.abs(etaInfo.daysRemaining) });
      } else if (etaInfo.daysRemaining === 0) {
        // Livré à temps
        badgeClass = 'bg-green-50 text-green-700 border-green-200';
        icon = <CheckCircle2 className="w-3 h-3" />;
        statusText = t('ordersTable.eta.onTime', 'À temps');
      } else {
        // Livré en avance
        badgeClass = 'bg-green-50 text-green-700 border-green-200';
        icon = <CheckCircle2 className="w-3 h-3" />;
        statusText = t('ordersTable.eta.deliveredEarly', { count: etaInfo.daysRemaining });
      }
    } else {
      // Commande en cours
      if (etaInfo.isPast) {
        // En retard
        badgeClass = 'bg-red-50 text-red-700 border-red-200';
        icon = <AlertTriangle className="w-3 h-3" />;
        statusText = t('ordersTable.eta.late', { count: Math.abs(etaInfo.daysRemaining) });
      } else if (etaInfo.daysRemaining === 0) {
        // Aujourd'hui
        badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = <Clock className="w-3 h-3" />;
        statusText = t('ordersTable.eta.today', "Aujourd'hui");
      } else if (etaInfo.daysRemaining <= 3) {
        // Urgent (dans les 3 jours)
        badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
        icon = <Clock className="w-3 h-3" />;
        statusText = t('ordersTable.eta.inDays', { count: etaInfo.daysRemaining });
      } else {
        // Normal
        badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
        icon = <Clock className="w-3 h-3" />;
        statusText = t('ordersTable.eta.inDays', { count: etaInfo.daysRemaining });
      }
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium text-[#191919]">{shortDate}</span>
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${badgeClass}`}>
          {icon}
          <span>{statusText}</span>
        </span>
      </div>
    );
  };

  // Bouton d'action selon le statut
  const getActionButton = (order) => {
    const buttonStyles = {
      base: "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95",
      confirm: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700",
      ship: "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
      receive: "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700",
      reconcile: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700",
      complete: "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
    };

    switch (order.status) {
      case 'pending_confirmation':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirmOrder?.(order.id);
            }}
            className={`${buttonStyles.base} ${buttonStyles.confirm}`}
            title={t('ordersTable.tooltips.confirmOrder')}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.confirm')}</span>
          </button>
        );
      
      case 'preparing':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShipOrder?.(order.id);
            }}
            className={`${buttonStyles.base} ${buttonStyles.ship}`}
            title={t('ordersTable.tooltips.markAsShipped')}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.ship')}</span>
          </button>
        );
      
      case 'in_transit':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReceiveOrder?.(order.id);
            }}
            className={`${buttonStyles.base} ${buttonStyles.receive}`}
            title={t('ordersTable.tooltips.validateReceipt')}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.receive')}</span>
          </button>
        );
      
      case 'received':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStartReconciliation?.(order);
            }}
            className={`${buttonStyles.base} ${buttonStyles.reconcile}`}
            title={t('ordersTable.tooltips.startReconciliation')}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.reconcile')}</span>
          </button>
        );
      
      case 'reconciliation':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfirmReconciliation?.(order.id);
            }}
            className={`${buttonStyles.base} ${buttonStyles.complete}`}
            title={t('ordersTable.tooltips.confirmReconciliation')}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.complete')}</span>
          </button>
        );
      
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{t('ordersTable.actions.archived')}</span>
          </span>
        );
      
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const colors = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.pending_confirmation;
    const label = t(`orders.status.${status}`) || status;
    
    const statusDots = {
      pending_confirmation: '🟡',
      preparing: '🔵',
      in_transit: '🟣',
      received: '🟢',
      completed: '⚫',
      reconciliation: '🔴'
    };
    
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}>
        <span>{statusDots[status] || '⚪'}</span>
        <span>{label}</span>
      </span>
    );
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 text-[#999999]" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 text-[#191919]" />
      : <ArrowDown className="w-3 h-3 text-[#191919]" />;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#191919]" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
        <Package className="w-12 h-12 text-[#E5E4DF] mb-4" />
        <h3 className="text-lg font-medium text-[#191919] mb-2">{t('ordersTable.empty.title')}</h3>
        <p className="text-sm text-[#666663]">{t('ordersTable.empty.description')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full">
        {/* Header */}
        <thead className="bg-[#FAFAF7] border-b border-[#E5E4DF] sticky top-0 z-10">
          <tr>
            {columns.map(col => (
              <th 
                key={col.key}
                className={`px-3 py-3 text-left text-xs font-semibold text-[#666663] uppercase tracking-wider ${col.width}`}
              >
                {col.key === 'select' ? (
                  <input
                    type="checkbox"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onChange={(e) => onSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-[#E5E4DF] text-[#191919] focus:ring-[#191919]"
                  />
                ) : col.sortable ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-1.5 hover:text-[#191919] transition-colors"
                  >
                    {col.label}
                    <SortIcon columnKey={col.key} />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="divide-y divide-[#E5E4DF]">
          {orders.map((order, index) => {
            const isSelected = selectedOrders.includes(order.id);
            const isActive = selectedOrder?.id === order.id;
            const warehouseName = order.warehouseId && warehouses[order.warehouseId]
              ? warehouses[order.warehouseId].name
              : (order.warehouseName || '—');

            return (
              <motion.tr
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                onClick={() => onSelectOrder(order)}
                className={`cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-[#191919] bg-opacity-5' 
                    : isSelected 
                      ? 'bg-blue-50' 
                      : 'hover:bg-[#FAFAF7]'
                }`}
              >
                {/* Checkbox */}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectOne(order.id)}
                    className="w-4 h-4 rounded border-[#E5E4DF] text-[#191919] focus:ring-[#191919]"
                  />
                </td>

                {/* N° PO */}
                <td className="px-3 py-3">
                  <span className="font-semibold text-[#191919] text-sm">{order.id}</span>
                </td>

                {/* Date */}
                <td className="px-3 py-3">
                  <span className="text-sm text-[#666663]">{formatConfirmedDate(order.createdAt)}</span>
                </td>

                {/* Fournisseur */}
                <td className="px-3 py-3">
                  {(!order.supplier || order.supplier === 'undefined' || order.supplier === '__unassigned__') ? (
                    <span className="text-sm text-amber-600 font-medium truncate block max-w-[150px]">
                      {t('suppliers.unassigned', 'Fournisseur non assigné')}
                    </span>
                  ) : (
                    <span className="text-sm text-[#191919] font-medium truncate block max-w-[150px]">
                      {order.supplier}
                    </span>
                  )}
                </td>

                {/* ETA */}
                <td className="px-3 py-3">
                  {getETABadge(order)}
                </td>

                {/* Entrepôt */}
                <td className="px-3 py-3 hidden lg:table-cell">
                  <span className="text-sm text-[#666663] truncate block max-w-[100px]">
                    {warehouseName}
                  </span>
                </td>

                {/* Total */}
                <td className="px-3 py-3">
                  <span className="text-sm font-semibold text-[#191919]">
                    {formatCurrency(order.total)}
                  </span>
                </td>

                {/* Statut */}
                <td className="px-3 py-3">
                  {getStatusBadge(order.status)}
                </td>

                {/* Articles */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-sm text-[#666663]">
                    {order.items?.length || 0} {t('ordersTable.items')}
                  </span>
                </td>

                {/* Actions - Boutons d'avancement */}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  {getActionButton(order)}
                </td>

                {/* Chevron pour ouvrir le panel */}
                <td className="px-3 py-3">
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-[#191919] rotate-90' : 'text-[#999999]'}`} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

