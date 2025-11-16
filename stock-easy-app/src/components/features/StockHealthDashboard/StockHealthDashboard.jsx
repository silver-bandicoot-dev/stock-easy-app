import React from 'react';
import { AlertTriangle, Eye, CheckCircle, TrendingUp } from 'lucide-react';

export function StockHealthDashboard({ totalUrgent, totalWarning, totalHealthy, totalProducts }) {
  const healthScore = totalProducts > 0 ? Math.round((totalHealthy / totalProducts) * 100) : 0;

  const cards = [
    {
      title: "Action immédiate",
      value: totalUrgent,
      description: "produits à commander maintenant",
      icon: AlertTriangle,
      accentColor: "text-[#B3261E]",
      badgeBg: "bg-[#FDECEC]",
    },
    {
      title: "À surveiller",
      value: totalWarning,
      description: "produits approchant le seuil",
      icon: Eye,
      accentColor: "text-[#8A4A00]",
      badgeBg: "bg-[#FFF4E5]",
    },
    {
      title: "En bonne santé",
      value: totalHealthy,
      description: "produits avec stock suffisant",
      icon: CheckCircle,
      accentColor: "text-[#166534]",
      badgeBg: "bg-[#ECFDF3]",
    },
    {
      title: "Score de santé",
      value: `${healthScore}%`,
      description: "de l'inventaire en bonne santé",
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
              <h3 className="font-medium text-[#191919] text-xs tracking-wide uppercase">
                {card.title}
              </h3>
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

