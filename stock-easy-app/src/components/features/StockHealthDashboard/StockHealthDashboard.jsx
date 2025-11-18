import React from 'react';
import { AlertTriangle, Eye, CheckCircle, TrendingUp } from 'lucide-react';
import { InfoTooltip } from '../../ui/InfoTooltip';

export function StockHealthDashboard({ 
  totalUrgent, 
  totalWarning, 
  totalHealthy, 
  totalProducts,
  urgentSKUList = [],
  warningSKUList = [],
  healthySKUList = []
}) {
  const healthScore = totalProducts > 0 ? Math.round((totalHealthy / totalProducts) * 100) : 0;

  // Formater les listes de SKU pour les tooltips
  const formatSKUList = (skuList, maxDisplay = 10) => {
    if (!skuList || skuList.length === 0) return '';
    const displayed = skuList.slice(0, maxDisplay).join(', ');
    const remaining = skuList.length > maxDisplay ? ` (+ ${skuList.length - maxDisplay} autres)` : '';
    return ` : ${displayed}${remaining}`;
  };

  const cards = [
    {
      title: "Action immédiate",
      value: totalUrgent,
      description: "produits à commander maintenant",
      tooltip: `Produits nécessitant une commande immédiate${formatSKUList(urgentSKUList)}`,
      icon: AlertTriangle,
      accentColor: "text-[#EF1C43]",
      badgeBg: "bg-[#FEE2E7]",
    },
    {
      title: "À surveiller",
      value: totalWarning,
      description: "produits approchant le seuil",
      tooltip: `Produits à surveiller de près${formatSKUList(warningSKUList)}`,
      icon: Eye,
      accentColor: "text-[#F97316]",
      badgeBg: "bg-[#FFF1E5]",
    },
    {
      title: "En bonne santé",
      value: totalHealthy,
      description: "produits avec stock suffisant",
      tooltip: `Produits avec stock optimal${formatSKUList(healthySKUList)}`,
      icon: CheckCircle,
      accentColor: "text-[#10B981]",
      badgeBg: "bg-[#D1FAE5]",
    },
    {
      title: "Score de santé",
      value: `${healthScore}%`,
      description: "de l'inventaire en bonne santé",
      tooltip: `Pourcentage de produits avec un stock optimal`,
      icon: TrendingUp,
      accentColor: "text-[#1D4ED8]",
      badgeBg: "bg-[#EFF6FF]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={index}
            className="group relative rounded-xl border border-[#E5E4DF] bg-white p-5 hover:shadow-md transition-all duration-200"
          >
            {/* Header avec icône */}
            <div className="flex items-center gap-3 mb-3 pl-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-[#F9F8F5]`}>
                <Icon className={`w-5 h-5 ${card.accentColor}`} />
              </div>
              <div className="flex items-center gap-1 flex-1">
                <h3 className="font-medium text-[#191919] text-xs tracking-wide uppercase">
                  {card.title}
                </h3>
                {card.tooltip && <InfoTooltip content={card.tooltip} />}
              </div>
            </div>

            {/* Valeur principale */}
            <div className="pl-3 mb-1">
              <div className="inline-flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-[#191919]">
                  {card.value}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="pl-3">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${card.badgeBg} ${card.accentColor}`}
              >
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StockHealthDashboard;

