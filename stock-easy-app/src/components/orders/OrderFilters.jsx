import React from 'react';
import { Calendar, X } from 'lucide-react';

export const OrderFilters = ({
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd,
  onClear
}) => {
  const hasFilters = dateStart || dateEnd;

  return (
    <div className="pt-3 mt-3 border-t border-[#E5E4DF]">
      <div className="flex flex-wrap items-end gap-3">
        {/* Date de début */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-[#666663] mb-1.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date de début
            </div>
          </label>
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
          />
        </div>

        {/* Date de fin */}
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-[#666663] mb-1.5">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Date de fin
            </div>
          </label>
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#E5E4DF] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#191919]"
          />
        </div>

        {/* Bouton Clear */}
        {hasFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Effacer
          </button>
        )}
      </div>

      {/* Raccourcis de dates */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={() => {
            const today = new Date();
            setDateStart(today.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors"
        >
          Aujourd'hui
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            setDateStart(weekAgo.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors"
        >
          7 derniers jours
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            setDateStart(monthAgo.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors"
        >
          30 derniers jours
        </button>
        <button
          onClick={() => {
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            setDateStart(startOfMonth.toISOString().split('T')[0]);
            setDateEnd(today.toISOString().split('T')[0]);
          }}
          className="px-3 py-1.5 text-xs font-medium bg-[#FAFAF7] border border-[#E5E4DF] rounded-lg hover:bg-[#E5E4DF] transition-colors"
        >
          Ce mois
        </button>
      </div>
    </div>
  );
};

