import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications
} from '../../services/notificationsService';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

const NotificationBell = ({ variant = 'floating' }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const navigate = useNavigate();

  // Charger les notifications
  const loadNotifications = useCallback(async ({ skipHighlight = false } = {}) => {
    setLoading(true);
    const { data } = await getUserNotifications(20);
    setNotifications(data || []);
    
    const { count } = await getUnreadCount();
    setUnreadCount(count || 0);
    if (!skipHighlight) {
      setHasNewNotification((data || []).some(notif => !notif.read));
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
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        setHasNewNotification(true);
        loadNotifications({ skipHighlight: true });

        toast.info(newNotification.title, {
          description: newNotification.message,
          duration: 4000
        });
        
        // Optionnel : afficher une notification système
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

  // Marquer une notification comme lue et naviguer
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
    
    setIsOpen(false);
  };

  // Marquer toutes comme lues
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Supprimer une notification
  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    const deletedNotif = notifications.find(n => n.id === notificationId);
    if (deletedNotif && !deletedNotif.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
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
    switch (type) {
      case 'mention':
        return '💬';
      case 'order_update':
        return '📦';
      case 'alert':
        return '⚠️';
      case 'stock_alert':
        return '🚨';
      case 'unmapped_product':
        return '📦';
      case 'weekly_report':
        return '📊';
      case 'order_delayed':
        return '⏰';
      case 'order_discrepancy':
        return '⚠️';
      case 'surstock_alert':
        return '📦';
      case 'missing_supplier_info':
        return '⚠️';
      default:
        return '🔔';
    }
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
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Tout marquer comme lu
                </button>
              )}
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
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icône */}
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Contenu */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                            <button
                              onClick={(e) => handleDelete(e, notification.id)}
                              className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
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
  );
};

export default NotificationBell;
