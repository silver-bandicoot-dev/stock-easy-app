import React, { useState, useEffect } from 'react';
import { Bell, Trash2, CheckCheck, RefreshCw, Settings, Filter, ChevronDown } from 'lucide-react';
import {
  getGroupedNotifications,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  deleteReadNotifications
} from '../../services/notificationsService';
import { useNavigate } from 'react-router-dom';
import NotificationPreferences from './NotificationPreferences';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState('all'); // Filtre par type
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' ou 'flat'
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    
    if (viewMode === 'grouped') {
      const { data } = await getGroupedNotifications(100);
      setNotifications(data || []);
    } else {
      const { data } = await getUserNotifications(100);
      // Convertir au format groupé pour uniformiser l'affichage
      const grouped = (data || []).map(n => ({
        groupId: n.id,
        type: n.type,
        count: 1,
        latestTitle: n.title,
        latestMessage: n.message,
        latestLink: n.link,
        latestCreatedAt: n.createdAt,
        isRead: n.read,
        notificationIds: [n.id],
        metadata: n.metadata
      }));
      setNotifications(grouped);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [viewMode]);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      if (notification.count > 1) {
        await markMultipleAsRead(notification.notificationIds);
      } else {
        await markAsRead(notification.notificationIds[0]);
      }
      setNotifications(prev =>
        prev.map(n => n.groupId === notification.groupId ? { ...n, isRead: true } : n)
      );
    }
    
    if (notification.latestLink) {
      navigate(notification.latestLink);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDeleteNotification = async (notification) => {
    if (notification.count > 1) {
      await deleteMultipleNotifications(notification.notificationIds);
    } else {
      await deleteNotification(notification.notificationIds[0]);
    }
    setNotifications(prev => prev.filter(n => n.groupId !== notification.groupId));
  };

  const handleDeleteAllRead = async () => {
    await deleteReadNotifications();
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const getNotificationIcon = (type) => {
    const icons = {
      mention: '💬',
      order_update: '📦',
      alert: '⚠️',
      stock_alert: '🚨',
      unmapped_product: '📦',
      weekly_report: '📊',
      order_delayed: '⏰',
      order_discrepancy: '⚠️',
      surstock_alert: '📦',
      missing_supplier_info: '⚠️',
      ml_alert: '🚨',
      ml_weekly: '🧠',
      ml_recommendation: '🤖'
    };
    return icons[type] || '🔔';
  };

  const getTypeLabel = (type) => {
    const labels = {
      mention: 'Mentions',
      order_update: 'Commandes',
      stock_alert: 'Stock',
      ml_alert: 'Alertes ML',
      ml_weekly: 'Rapport ML',
      ml_recommendation: 'Recommandations ML'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filtres
  const filteredNotifications = notifications.filter(n => {
    // Filtre lecture
    if (filter === 'unread' && n.isRead) return false;
    if (filter === 'read' && !n.isRead) return false;
    
    // Filtre type
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const totalUnreadNotifs = notifications.reduce((sum, n) => sum + (n.isRead ? 0 : n.count), 0);

  // Types disponibles pour le filtre
  const availableTypes = [...new Set(notifications.map(n => n.type))];

  return (
    <>
      <div className="min-h-screen bg-[#FAFAF7] p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Notifications
              </h1>
              <p className="text-gray-600">
                {totalUnreadNotifs > 0
                  ? `${totalUnreadNotifs} notification${totalUnreadNotifs > 1 ? 's' : ''} non lue${totalUnreadNotifs > 1 ? 's' : ''}`
                  : 'Toutes vos notifications sont à jour'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Settings size={16} />
                Préférences
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-900 transition-colors"
              >
                Retour à la plateforme
              </button>
            </div>
          </div>

          {/* Actions et filtres */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Filtres */}
              <div className="flex flex-wrap gap-2">
                {/* Filtre lecture */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === 'all'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === 'unread'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Non lues ({unreadCount})
                  </button>
                  <button
                    onClick={() => setFilter('read')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      filter === 'read'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lues
                  </button>
                </div>

                {/* Filtre type */}
                <div className="relative">
                  <button
                    onClick={() => setShowTypeFilter(!showTypeFilter)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter size={14} />
                    {typeFilter === 'all' ? 'Tous les types' : getTypeLabel(typeFilter)}
                    <ChevronDown size={14} className={`transition-transform ${showTypeFilter ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showTypeFilter && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowTypeFilter(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                        <button
                          onClick={() => { setTypeFilter('all'); setShowTypeFilter(false); }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${typeFilter === 'all' ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                        >
                          Tous les types
                        </button>
                        {availableTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => { setTypeFilter(type); setShowTypeFilter(false); }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${typeFilter === type ? 'font-medium text-blue-600' : 'text-gray-700'}`}
                          >
                            <span>{getNotificationIcon(type)}</span>
                            {getTypeLabel(type)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Toggle groupement */}
                <button
                  onClick={() => setViewMode(viewMode === 'grouped' ? 'flat' : 'grouped')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    viewMode === 'grouped'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {viewMode === 'grouped' ? '📦 Groupées' : '📋 Liste'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={loadNotifications}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw size={16} />
                  Actualiser
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CheckCheck size={16} />
                    Tout marquer lu
                  </button>
                )}
                {notifications.some(n => n.isRead) && (
                  <button
                    onClick={handleDeleteAllRead}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 size={16} />
                    Supprimer les lues
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Liste des notifications */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Bell size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'}
              </h3>
              <p className="text-gray-600">
                {filter === 'unread'
                  ? 'Toutes vos notifications sont à jour !'
                  : 'Vous n\'avez pas encore de notifications.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.groupId}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 p-5 cursor-pointer transition-all hover:shadow-md ${
                    !notification.isRead ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icône */}
                    <div className="text-3xl flex-shrink-0 relative">
                      {getNotificationIcon(notification.type)}
                      {notification.count > 1 && (
                        <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-600 rounded-full">
                          {notification.count}
                        </span>
                      )}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.count > 1 
                              ? `${notification.count} ${getTypeLabel(notification.type).toLowerCase()}`
                              : notification.latestTitle
                            }
                          </h3>
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mt-1">
                            {getNotificationIcon(notification.type)} {getTypeLabel(notification.type)}
                          </span>
                        </div>
                        {!notification.isRead && (
                          <span className="flex-shrink-0 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                            Nouveau
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">
                        {notification.latestMessage}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.latestCreatedAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(notification);
                          }}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={14} />
                          {notification.count > 1 ? 'Supprimer tout' : 'Supprimer'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal des préférences */}
      {showPreferences && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <NotificationPreferences onClose={() => setShowPreferences(false)} />
        </div>
      )}
    </>
  );
};

export default NotificationsPage;
