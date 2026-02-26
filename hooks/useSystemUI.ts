
import { useState } from 'react';
import { Toast, Notification } from '../context/DataContext';
import { generateId } from '../utils/helpers';

export const useSystemUI = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([
      { id: '1', type: 'new_appointment', title: 'Nueva Cita', message: 'Maria Rodriguez agendó una cita para mañana.', time: 'Hace 10 min', read: false, link: '/admin/appointments' },
  ]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now() + Math.random(); 
      setToasts(prev => [...prev, { id, type, message }]);
      setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: number) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  const markAllNotificationsAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markNotificationAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markNotificationsAsRead = (ids: string[]) => {
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: true } : n));
  };

  const markNotificationsAsUnread = (ids: string[]) => {
      setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, read: false } : n));
  };

  const addNotification = (notif: Omit<Notification, 'id' | 'read'>) => {
      setNotifications(prev => [{
          id: generateId('NOT'),
          read: false,
          ...notif
      }, ...prev]);
  };

  return {
    toasts,
    addToast,
    removeToast,
    notifications,
    setNotifications,
    addNotification,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    markNotificationsAsRead,
    markNotificationsAsUnread
  };
};
