import React from 'react';
import { Package, User, ShoppingCart, History, ChevronRight, Mail, FileText, TrendingUp, Edit, Truck, ExternalLink, Warehouse } from 'lucide-react';

/**
 * Composant SearchItem - Affiche un élément de résultat de recherche
 * @param {Object} item - Données de l'élément
 * @param {boolean} isActive - Si l'élément est sélectionné (navigation clavier)
 * @param {Function} onClick - Callback lors du clic
 * @param {string} highlightText - Texte à surligner
 * @param {Object} quickActions - Actions rapides pour ce type d'élément
 */
export const SearchItem = ({ item, isActive, onClick, highlightText, quickActions }) => {
  // Obtenir l'icône selon le type
  const getIcon = () => {
    switch (item.type) {
      case 'product':
        return <Package className="w-5 h-5 text-primary-500" />;
      case 'supplier':
        return <User className="w-5 h-5 text-success-500" />;
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-warning-500" />;
      case 'warehouse':
        return <Warehouse className="w-5 h-5 text-blue-500" />;
      case 'history':
        return <History className="w-5 h-5 text-neutral-400" />;
      default:
        return <Package className="w-5 h-5 text-neutral-500" />;
    }
  };

  // Fonction pour surligner le texte correspondant
  const highlightMatch = (text) => {
    if (!highlightText || !text) return text;

    const regex = new RegExp(`(${highlightText})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (part.toLowerCase() === highlightText.toLowerCase()) {
        return (
          <mark
            key={index}
            className="bg-warning-200 text-warning-900 rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <button
      onClick={() => onClick(item)}
      className={`
        w-full flex items-center gap-3 px-4 py-3 text-left transition-all
        ${
          isActive
            ? 'bg-primary-50 border-l-2 border-primary-500'
            : 'hover:bg-neutral-50 border-l-2 border-transparent'
        }
        focus:outline-none group
      `}
    >
      {/* Icône ou Image */}
      <div className="shrink-0">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-10 h-10 object-cover rounded border border-neutral-200"
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-neutral-100 rounded">
            {getIcon()}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        {/* Titre avec badge */}
        <div className="flex items-center gap-2 mb-1">
          <div className="font-semibold text-sm text-neutral-900 truncate">
            {highlightMatch(item.title)}
          </div>
          {/* Badge de statut */}
          {item.healthStatus && (
            <span className={`
              px-2 py-0.5 text-[10px] font-bold rounded uppercase shrink-0
              ${item.healthStatus === 'critical' ? 'bg-red-100 text-red-700' : ''}
              ${item.healthStatus === 'warning' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${item.healthStatus === 'good' ? 'bg-green-100 text-green-700' : ''}
              ${item.healthStatus === 'excellent' ? 'bg-blue-100 text-blue-700' : ''}
            `}>
              {item.healthStatus === 'critical' && '🔴 Critique'}
              {item.healthStatus === 'warning' && '⚠️ Attention'}
              {item.healthStatus === 'good' && '✅ Bon'}
              {item.healthStatus === 'excellent' && '⭐ Excellent'}
            </span>
          )}
          {/* Badge urgent pour commandes */}
          {item.urgent && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase shrink-0 bg-red-100 text-red-700">
              🔥 Urgent
            </span>
          )}
        </div>
        
        {item.subtitle && (
          <div className="text-xs text-neutral-600 truncate">
            {highlightMatch(item.subtitle)}
          </div>
        )}
        {item.meta && (
          <div className="text-xs text-neutral-500 mt-0.5 truncate">
            {item.meta}
          </div>
        )}
        
        {/* Actions Rapides */}
        {quickActions && quickActions.length > 0 && (
          <div className="flex gap-1.5 mt-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(item);
                }}
                className="
                  flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded
                  bg-neutral-100 text-neutral-700 hover:bg-neutral-200
                  transition-colors
                "
                title={action.label}
              >
                {action.icon && <action.icon className="w-3 h-3" />}
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Flèche de navigation */}
      <ChevronRight
        className={`
          w-4 h-4 text-neutral-400 shrink-0 transition-transform
          ${isActive ? 'translate-x-1 text-primary-500' : 'group-hover:translate-x-1'}
        `}
      />
    </button>
  );
};

