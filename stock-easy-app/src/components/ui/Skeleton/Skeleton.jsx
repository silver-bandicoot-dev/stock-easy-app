import React from 'react';

/**
 * Composant Skeleton de base avec animation pulse
 */
export const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-[#E5E4DF] via-[#d5d4cf] to-[#E5E4DF] bg-[length:200%_100%] rounded ${className}`}
    style={{ 
      animation: 'shimmer 1.5s ease-in-out infinite',
    }}
    {...props}
  />
);

/**
 * Skeleton pour une carte KPI
 */
export const SkeletonKPICard = () => (
  <div className="bg-white rounded-xl border border-[#E5E4DF] p-5 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-8 w-32" />
    <div className="flex items-center gap-2">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-20" />
    </div>
  </div>
);

/**
 * Skeleton pour une ligne de tableau produit
 */
export const SkeletonProductRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-[#E5E4DF]">
    <Skeleton className="h-12 w-12 rounded-lg shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
    <Skeleton className="h-8 w-20 rounded-lg" />
  </div>
);

/**
 * Skeleton pour une carte produit (grid view)
 */
export const SkeletonProductCard = () => (
  <div className="bg-white rounded-xl border border-[#E5E4DF] p-4 space-y-3">
    <div className="flex items-start gap-3">
      <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
    <div className="flex items-center justify-between pt-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-4 w-16" />
    </div>
    <Skeleton className="h-2 w-full rounded-full" />
  </div>
);

/**
 * Skeleton pour une commande
 */
export const SkeletonOrderCard = () => (
  <div className="bg-white rounded-xl border border-[#E5E4DF] p-5 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <div className="flex gap-4">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-4 w-16" />
    </div>
    <div className="flex gap-2 pt-2">
      <Skeleton className="h-9 w-full rounded-lg" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
  </div>
);

/**
 * Skeleton pour le graphique
 */
export const SkeletonChart = ({ height = 200 }) => (
  <div className="bg-white rounded-xl border border-[#E5E4DF] p-5 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-32 rounded-lg" />
    </div>
    <div 
      className="relative overflow-hidden rounded-lg bg-[#FAFAF7]"
      style={{ height }}
    >
      {/* Barres simulées */}
      <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full px-4 pb-4">
        {[0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3].map((h, i) => (
          <Skeleton 
            key={i} 
            className="w-8 rounded-t-md" 
            style={{ height: `${h * 80}%` }}
          />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton pour le Dashboard complet
 */
export const SkeletonDashboard = () => (
  <div className="space-y-8 animate-in fade-in duration-300">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>

    {/* KPIs */}
    <div>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
        <SkeletonKPICard />
      </div>
    </div>

    {/* Charts */}
    <div>
      <Skeleton className="h-5 w-36 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height={250} />
        <SkeletonChart height={250} />
      </div>
    </div>

    {/* Products */}
    <div>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#E5E4DF] overflow-hidden">
          <div className="p-4 border-b border-[#E5E4DF]">
            <Skeleton className="h-5 w-40" />
          </div>
          <SkeletonProductRow />
          <SkeletonProductRow />
          <SkeletonProductRow />
        </div>
        <div className="bg-white rounded-xl border border-[#E5E4DF] overflow-hidden">
          <div className="p-4 border-b border-[#E5E4DF]">
            <Skeleton className="h-5 w-36" />
          </div>
          <SkeletonProductRow />
          <SkeletonProductRow />
          <SkeletonProductRow />
        </div>
      </div>
    </div>
  </div>
);

/**
 * Skeleton pour la page Stock
 */
export const SkeletonStockPage = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Filtres */}
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-32 rounded-lg" />
      <Skeleton className="h-10 w-40 rounded-lg" />
      <Skeleton className="h-10 w-48 rounded-lg" />
    </div>

    {/* Grid de produits */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton pour la page Commandes
 */
export const SkeletonOrdersPage = () => (
  <div className="space-y-6 animate-in fade-in duration-300">
    {/* Filtres */}
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-10 w-28 rounded-lg" />
      <Skeleton className="h-10 w-36 rounded-lg" />
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>

    {/* Liste de commandes */}
    <div className="space-y-4">
      <SkeletonOrderCard />
      <SkeletonOrderCard />
      <SkeletonOrderCard />
    </div>
  </div>
);

// Ajout du keyframe shimmer dans le CSS global (via style tag)
if (typeof document !== 'undefined') {
  const styleId = 'skeleton-shimmer-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
  }
}

export default Skeleton;

