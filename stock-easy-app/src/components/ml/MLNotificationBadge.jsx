/**
 * Badge de notification pour les alertes ML
 * @module components/ml/MLNotificationBadge
 */

import React from 'react';
import { useMLNotifications } from '../../hooks/ml/useMLNotifications';

export function MLNotificationBadge({ products, forecasts, isReady }) {
  const { unreadCount } = useMLNotifications(products, forecasts, isReady);

  if (unreadCount === 0) return null;

  return (
    <span className="ml-auto bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
      {unreadCount}
    </span>
  );
}

