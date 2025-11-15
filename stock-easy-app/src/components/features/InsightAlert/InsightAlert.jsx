import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { AlertTriangle, XCircle, CheckCircle, Info, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

/**
 * InsightAlert - Composant amélioré pour afficher des alertes contextuelles
 * @param {string} type - Type d'alerte ('warning' | 'danger' | 'success' | 'info')
 * @param {string|ReactNode} message - Message à afficher (string ou composant React)
 * @param {string} title - Titre de l'insight (optionnel)
 * @param {string|number} value - Valeur à afficher (optionnel)
 * @param {string} actionLabel - Label du bouton d'action (optionnel)
 * @param {function} onActionClick - Callback pour le clic sur l'action (optionnel)
 * @param {ReactNode} icon - Icône personnalisée (optionnel)
 */
export function InsightAlert({ 
  type = 'info', 
  message, 
  title = null,
  value = null,
  actionLabel = null,
  onActionClick = null,
  icon = null
}) {
  // Configuration selon le type
  const typeConfig = {
    warning: {
      bgClass: 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-300',
      borderClass: 'border-l-4 border-yellow-500',
      textClass: 'text-yellow-900',
      titleClass: 'text-yellow-800',
      iconClass: 'text-yellow-600',
      iconBgClass: 'bg-yellow-100',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      valueClass: 'text-yellow-700',
      Icon: AlertTriangle
    },
    danger: {
      bgClass: 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-300',
      borderClass: 'border-l-4 border-red-500',
      textClass: 'text-red-900',
      titleClass: 'text-red-800',
      iconClass: 'text-red-600',
      iconBgClass: 'bg-red-100',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
      valueClass: 'text-red-700',
      Icon: XCircle
    },
    success: {
      bgClass: 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-300',
      borderClass: 'border-l-4 border-green-500',
      textClass: 'text-green-900',
      titleClass: 'text-green-800',
      iconClass: 'text-green-600',
      iconBgClass: 'bg-green-100',
      buttonClass: 'bg-green-500 hover:bg-green-600 text-white',
      valueClass: 'text-green-700',
      Icon: CheckCircle
    },
    info: {
      bgClass: 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-300',
      borderClass: 'border-l-4 border-blue-500',
      textClass: 'text-blue-900',
      titleClass: 'text-blue-800',
      iconClass: 'text-blue-600',
      iconBgClass: 'bg-blue-100',
      buttonClass: 'bg-blue-500 hover:bg-blue-600 text-white',
      valueClass: 'text-blue-700',
      Icon: Info
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = icon || config.Icon;
  
  // Si le message est déjà un composant React, l'utiliser tel quel, sinon l'envelopper dans un paragraphe
  const messageContent = typeof message === 'string' ? (
    <p className={`text-xs leading-snug ${config.textClass}`}>
      {message}
    </p>
  ) : message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative overflow-hidden rounded-xl shadow-sm border ${config.bgClass} ${config.borderClass}
        transition-all duration-300 hover:shadow-md
      `}
    >
      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 -translate-x-full hover:translate-x-full" 
           style={{ transition: 'transform 0.6s ease' }} />
      
      <div className="relative p-3">
        <div className="flex items-start gap-3">
          {/* Icône */}
          <div className={`w-8 h-8 rounded-lg ${config.iconBgClass} flex items-center justify-center shrink-0`}>
            <Icon className={`w-4 h-4 ${config.iconClass}`} />
          </div>
          
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            {/* Titre et valeur */}
            <div className="flex items-start justify-between gap-2 mb-1">
              {title && (
                <h4 className={`font-semibold text-sm ${config.titleClass}`}>
                  {title}
                </h4>
              )}
              {value !== null && (
                <div className={`text-base font-bold ${config.valueClass} shrink-0`}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </div>
              )}
            </div>
            
            {/* Message */}
            <div className="mb-2">
              {messageContent}
            </div>
            
            {/* Bouton d'action */}
            {actionLabel && onActionClick && (
              <button
                onClick={onActionClick}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
                  transition-all duration-200 shadow-sm hover:shadow-md
                  ${config.buttonClass}
                `}
              >
                {actionLabel}
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

InsightAlert.propTypes = {
  type: PropTypes.oneOf(['warning', 'danger', 'success', 'info']).isRequired,
  message: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  title: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  actionLabel: PropTypes.string,
  onActionClick: PropTypes.func,
  icon: PropTypes.elementType
};

InsightAlert.defaultProps = {
  type: 'info',
  title: null,
  value: null,
  actionLabel: null,
  onActionClick: null,
  icon: null
};

