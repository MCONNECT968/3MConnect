import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NotificationProps, NotificationType } from '../components/ui/Notification';
import { v4 as uuidv4 } from 'uuid';

interface NotificationContextType {
  notifications: NotificationProps[];
  addNotification: (notification: Omit<NotificationProps, 'id'>) => string;
  removeNotification: (id: string) => void;
  success: (title: string, message: string, duration?: number) => string;
  error: (title: string, message: string, duration?: number) => string;
  warning: (title: string, message: string, duration?: number) => string;
  info: (title: string, message: string, duration?: number) => string;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  maxNotifications?: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  maxNotifications = 5
}) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((notification: Omit<NotificationProps, 'id'>) => {
    const id = uuidv4();
    setNotifications(prev => {
      // If we have too many notifications, remove the oldest ones
      const newNotifications = [...prev];
      if (newNotifications.length >= maxNotifications) {
        newNotifications.splice(0, newNotifications.length - maxNotifications + 1);
      }
      return [...newNotifications, { ...notification, id, onClose: () => removeNotification(id) }];
    });
    return id;
  }, [maxNotifications, removeNotification]);

  const createNotification = useCallback((type: NotificationType, title: string, message: string, duration?: number) => {
    return addNotification({ type, title, message, duration });
  }, [addNotification]);

  const success = useCallback((title: string, message: string, duration?: number) => {
    return createNotification('success', title, message, duration);
  }, [createNotification]);

  const error = useCallback((title: string, message: string, duration?: number) => {
    return createNotification('error', title, message, duration);
  }, [createNotification]);

  const warning = useCallback((title: string, message: string, duration?: number) => {
    return createNotification('warning', title, message, duration);
  }, [createNotification]);

  const info = useCallback((title: string, message: string, duration?: number) => {
    return createNotification('info', title, message, duration);
  }, [createNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info,
    clearAll
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};