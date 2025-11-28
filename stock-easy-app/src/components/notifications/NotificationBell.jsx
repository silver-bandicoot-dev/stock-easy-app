import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Settings, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getGroupedNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markMultipleAsRead,
  deleteNotification,
  deleteMultipleNotifications,
  subscribeToNotifications
} from '../../services/notificationsService';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import NotificationPreferences from './NotificationPreferences';

const NotificationBell = ({ variant = 'floating' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const navigate = useNavigate();

  // Charger les notifications groupées
  const loadNotifications = useCallback(async ({ skipHighlight = false } = {}) => {
    setLoading(true);
    const { data } = await getGroupedNotifications(20);
    setNotifications(data || []);
    
    const { count } = await getUnreadCount();
    setUnreadCount(count || 0);
    if (!skipHighlight) {
      setHasNewNotification((data || []).some(notif => !notif.isRead));
    }
    setLoading(false);
  }, []);

  // Initialiser les notifications au chargement
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // S'abonner aux nouvelles notifications en temps réel
  useEffect(() => {
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = subscribeToNotifications(user.id, (newNotification) => {
        setUnreadCount(prev => prev + 1);
        setHasNewNotification(true);
        loadNotifications({ skipHighlight: true });

        toast.info(newNotification.title, {
          description: newNotification.message,
          duration: 4000
        });
        
        // Notification système du navigateur
        if (Notification.permission === 'granted') {
          new Notification(newNotification.title, {
            body: newNotification.message,
            icon: '/logo.png'
          });
        }
      });

      return () => {
        channel.unsubscribe();
      };
    };

    setupSubscription();
  }, [loadNotifications]);

  // Demander la permission pour les notifications système
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const toggleDropdown = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    if (isOpen) {
      setHasNewNotification(false);
      loadNotifications({ skipHighlight: true });
    }
  }, [isOpen, loadNotifications]);

  // Gérer le clic sur une notification (groupée ou non)
  const handleNotificationClick = async (notification) => {
    // Marquer toutes les notifications du groupe comme lues
    if (!notification.isRead) {
      if (notification.count > 1) {
        await markMultipleAsRead(notification.notificationIds);
      } else {
        await markAsRead(notification.notificationIds[0]);
      }
      setUnreadCount(prev => Math.max(0, prev - notification.count));
      setNotifications(prev =>
        prev.map(n => n.groupId === notification.groupId ? { ...n, isRead: true } : n)
      );
    }
    
    if (notification.latestLink) {
      navigate(notification.latestLink);
    }
    
    setIsOpen(false);
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Supprimer une notification ou un groupe
  const handleDelete = async (e, notification) => {
    e.stopPropagation();
    
    if (notification.count > 1) {
      await deleteMultipleNotifications(notification.notificationIds);
    } else {
      await deleteNotification(notification.notificationIds[0]);
    }
    
    setNotifications(prev => prev.filter(n => n.groupId !== notification.groupId));
    if (!notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - notification.count));
    }
  };

  // Formater la date relative
  const formatRelativeTime = (dateString) => {
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
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  // Icône selon le type de notification
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

  // Générer le titre pour les notifications groupées
  const getGroupTitle = (notification) => {
    if (notification.count === 1) {
      return notification.latestTitle;
    }
    
    // Pour les groupes, générer un titre résumé
    const typeLabels = {
      mention: 'mentions',
      ml_alert: 'alertes ML',
      ml_recommendation: 'recommandations ML',
      stock_alert: 'alertes stock',
      order_update: 'mises à jour commande'
    };
    
    const label = typeLabels[notification.type] || 'notifications';
    return `${notification.count} ${label}`;
  };

  const wrapperClass =
    variant === 'floating'
      ? 'fixed top-2 right-3 z-50'
      : 'relative';

  const buttonClass =
    variant === 'floating'
      ? 'relative flex items-center justify-center w-8 h-8 text-white bg-black hover:bg-gray-900 rounded-full transition-colors shadow-md'
      : 'relative flex items-center justify-center w-9 h-9 rounded-full bg-[#E5E4DF] hover:bg-[#D6D5CF] transition-colors';

  const iconClass =
    variant === 'floating'
      ? 'text-white'
      : 'text-[#191919]';

  return (
    <>
      <div className={wrapperClass}>
        {/* Bouton cloche */}
        <button
          onClick={toggleDropdown}
          className={buttonClass}
          aria-label="Notifications"
        >
          <Bell size={16} className={iconClass} />
          {hasNewNotification && (
            <span className="absolute top-1 right-1 inline-flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-500"></span>
            </span>
          )}
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown des notifications */}
        {isOpen && (
          <>
            {/* Overlay pour fermer le dropdown */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel des notifications */}
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Tout marquer lu
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setShowPreferences(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Préférences"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>

              {/* Liste des notifications */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    Chargement...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.groupId}
                        onClick={() => handleNotificationClick(notification)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Icône */}
                          <div className="text-2xl flex-shrink-0 relative">
                            {getNotificationIcon(notification.type)}
                            {notification.count > 1 && (
                              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-blue-600 rounded-full">
                                {notification.count}
                              </span>
                            )}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {getGroupTitle(notification)}
                              </p>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.latestMessage}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(notification.latestCreatedAt)}
                              </span>
                              <button
                                onClick={(e) => handleDelete(e, notification)}
                                className="text-xs text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1"
                              >
                                <Trash2 size={12} />
                                {notification.count > 1 ? 'Supprimer tout' : 'Supprimer'}
                              </button>
                            </div>
                          </div>

                          {/* Flèche pour les groupes */}
                          {notification.count > 1 && (
                            <ChevronRight size={16} className="text-gray-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-200 text-center">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/notifications');
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </div>
          </>
        )}
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

export default NotificationBell;
