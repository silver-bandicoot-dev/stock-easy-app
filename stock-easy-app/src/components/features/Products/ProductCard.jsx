import React from 'react';
import { Package, TrendingUp, AlertCircle, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import Badge from '../../ui/Badge/Badge';
import { formatNumber, formatCurrency } from '../../../utils/formatting';
import { HEALTH_STATUS_COLORS } from '../../../utils/constants';

const ProductCard = ({ product, onEdit, currency = 'EUR' }) => {
  const healthColors = HEALTH_STATUS_COLORS[product.healthStatus];
  
  return (
    <Card hoverable className="h-full">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              {product.name}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              SKU: {product.sku}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            icon={Edit2}
            onClick={() => onEdit(product)}
            aria-label="Modifier le produit"
          />
        </div>

        {/* Health Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Santé du stock
            </span>
            <Badge variant={product.healthStatus === 'healthy' ? 'success' : product.healthStatus === 'warning' ? 'warning' : 'danger'}>
              {product.healthPercentage}%
            </Badge>
          </div>
          
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                product.healthStatus === 'healthy' ? 'bg-success-500' :
                product.healthStatus === 'warning' ? 'bg-warning-500' :
                'bg-danger-500'
              }`}
              style={{ width: `${Math.max(5, product.healthPercentage)}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Stock actuel
            </p>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatNumber(product.stock)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Autonomie
            </p>
            <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              {product.daysOfStock} j
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Ventes/jour
            </p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatNumber(product.salesPerDay, 1)}
            </p>
          </div>
          
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
              Prix
            </p>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {formatCurrency(product.price || 0, currency)}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {product.healthStatus === 'urgent' && (
          <div className="p-3 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-danger-600 dark:text-danger-400 flex-shrink-0" />
            <p className="text-xs text-danger-700 dark:text-danger-300">
              Stock critique ! À commander d'urgence
            </p>
          </div>
        )}
        
        {product.isDeepOverstock && (
          <div className="p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-warning-600 dark:text-warning-400 flex-shrink-0" />
            <p className="text-xs text-warning-700 dark:text-warning-300">
              Surstock profond détecté
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;
