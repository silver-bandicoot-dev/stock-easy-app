import React from 'react';
import { AlertTriangle, Eye, CheckCircle, TrendingUp } from 'lucide-react';

export function StockHealthDashboard({ totalUrgent, totalWarning, totalHealthy, totalProducts }) {
  const healthScore = totalProducts > 0 ? Math.round((totalHealthy / totalProducts) * 100) : 0;

  const cards = [
    {
      title: "Action Immédiate",
      value: totalUrgent,
      description: "produits à commander maintenant",
      icon: AlertTriangle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-[#EF1C43]",
      valueColor: "text-[#EF1C43]",
    },
    {
      title: "À Surveiller",
      value: totalWarning,
      description: "produits approchant le seuil",
      icon: Eye,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      iconColor: "text-orange-600",
      valueColor: "text-orange-600",
    },
    {
      title: "En Bonne Santé",
      value: totalHealthy,
      description: "produits avec stock suffisant",
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-600",
      valueColor: "text-green-600",
    },
    {
      title: "Score de Santé",
      value: `${healthScore}%`,
      description: "de l'inventaire en bonne santé",
      icon: TrendingUp,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-600",
      valueColor: "text-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        
        return (
          <div
            key={index}
            className={`${card.bgColor} border-2 ${card.borderColor} rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
          >
            {/* Header avec icône */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center border-2 ${card.borderColor}`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              <h3 className="font-semibold text-[#191919] text-sm">{card.title}</h3>
            </div>

            {/* Valeur principale */}
            <div className={`text-3xl font-bold ${card.valueColor} mb-2`}>
              {card.value}
            </div>

            {/* Description */}
            <p className="text-xs text-[#666663]">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}

export default StockHealthDashboard;

