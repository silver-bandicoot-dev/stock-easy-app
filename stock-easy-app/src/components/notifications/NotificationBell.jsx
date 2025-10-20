import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = ({ variant = 'default' }) => {
  const { currentUser } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to notifications in real-time
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const promises = notifications.map(notif =>
        updateDoc(doc(db, 'notifications', notif.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Styles selon la variante
  const buttonStyles = variant === 'mobile' 
    ? "relative p-2 rounded-lg bg-[#40403E] hover:bg-[#666663] transition-colors focus:outline-none focus:ring-2 focus:ring-white shrink-0"
    : "relative p-2.5 rounded-lg bg-white hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-black shrink-0";
  
  const iconStyles = variant === 'mobile'
    ? "w-6 h-6 text-white shrink-0"
    : "w-5 h-5 text-black shrink-0";

  return (
    <>
      <button
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className={buttonStyles}
        aria-label="Notifications"
      >
        <Bell className={iconStyles} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF1C43] text-white text-xs rounded-full flex items-center justify-center font-bold">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9998]"
              onClick={() => setNotificationsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-4 top-20 w-96 bg-white rounded-xl shadow-2xl border border-[#E5E4DF] z-[9999]"
            >
              <div className="p-4 border-b border-[#E5E4DF] flex justify-between items-center">
                <h3 className="font-bold text-[#191919]">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-black hover:underline flex items-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Aucune notification</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E4DF]">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#191919]">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            {notification.createdAt && (
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notification.createdAt).toLocaleString('fr-FR')}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            aria-label="Marquer comme lu"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationBell;

