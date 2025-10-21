import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';

/**
 * InsightAlert - Composant pour afficher des alertes contextuelles sous les KPIs
 * @param {string} type - Type d'alerte ('warning' | 'danger' | 'success' | 'info')
 * @param {string} message - Message à afficher
 * @param {string} actionLabel - Label du bouton d'action (optionnel)
 * @param {function} onActionClick - Callback pour le clic sur l'action (optionnel)
 */
export function InsightAlert({ 
  type = 'info', 
  message, 
  actionLabel = null,
  onActionClick = null 
}) {
  // Configuration selon le type
  const typeConfig = {
    warning: {
      bgClass: 'bg-yellow-50 border-yellow-400',
      textClass: 'text-yellow-800',
      iconClass: 'text-yellow-600',
      buttonClass: 'text-yellow-700 hover:text-yellow-900',
      Icon: AlertTriangle
    },
    danger: {
      bgClass: 'bg-red-50 border-red-400',
      textClass: 'text-red-800',
      iconClass: 'text-red-600',
      buttonClass: 'text-red-700 hover:text-red-900',
      Icon: XCircle
    },
    success: {
      bgClass: 'bg-green-50 border-green-400',
      textClass: 'text-green-800',
      iconClass: 'text-green-600',
      buttonClass: 'text-green-700 hover:text-green-900',
      Icon: CheckCircle
    },
    info: {
      bgClass: 'bg-blue-50 border-blue-400',
      textClass: 'text-blue-800',
      iconClass: 'text-blue-600',
      buttonClass: 'text-blue-700 hover:text-blue-900',
      Icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.Icon;

  return (
    <div className={`p-4 rounded-lg border-l-4 flex items-start justify-between gap-4 ${config.bgClass} animate-fadeIn`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textClass}`}>
            {message}
          </p>
        </div>
      </div>
      
      {actionLabel && onActionClick && (
        <button
          onClick={onActionClick}
          className={`
            text-sm font-medium underline shrink-0 transition-colors
            ${config.buttonClass}
          `}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

InsightAlert.propTypes = {
  type: PropTypes.oneOf(['warning', 'danger', 'success', 'info']).isRequired,
  message: PropTypes.string.isRequired,
  actionLabel: PropTypes.string,
  onActionClick: PropTypes.func
};

InsightAlert.defaultProps = {
  type: 'info',
  actionLabel: null,
  onActionClick: null
};

