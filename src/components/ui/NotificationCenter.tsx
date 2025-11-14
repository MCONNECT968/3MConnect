import React, { useState } from 'react';
import { Notification } from './Notification';
import { useNotifications } from '../../contexts/NotificationContext';
import { Bell, X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

export const NotificationCenter: React.FC = () => {
  const { notifications } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);
  const { i18n } = useTranslation();

  if (notifications.length === 0 && !isExpanded) {
    return null;
  }

  return (
    <div className={`fixed top-20 ${i18n.language === 'ar' ? 'left-4' : 'right-4'} z-50 w-80 max-w-full transition-all`}>
      {notifications.map((notification) => (
        <Notification key={notification.id} {...notification} />
      ))}
    </div>
  );
};

export const NotificationBadge: React.FC = () => {
  const { notifications } = useNotifications();
  const { i18n } = useTranslation();
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <div className={`absolute -top-1 ${i18n.language === 'ar' ? '-left-1' : '-right-1'} flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full`}>
      {notifications.length}
    </div>
  );
};

export const NotificationDrawer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const { i18n, t } = useTranslation();
  const { darkMode } = useTheme();

  const toggleDrawer = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className={`${i18n.language === 'ar' ? 'left-4' : 'right-4'}`}>
        <button
          onClick={toggleDrawer}
          className="fixed bottom-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={24} />
          {notifications.length > 0 && (
            <span className={`absolute -top-1 ${i18n.language === 'ar' ? '-left-1' : '-right-1'} bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleDrawer}
      />

      <div 
        className={`fixed ${i18n.language === 'ar' ? 'left-0' : 'right-0'} top-0 bottom-0 w-full sm:w-96 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl z-50 transform transition-transform ${isOpen ? 'translate-x-0' : i18n.language === 'ar' ? '-translate-x-full' : 'translate-x-full'}`}
      >
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h2>
          <button 
            onClick={toggleDrawer}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100%-4rem)]">
          {notifications.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'} p-6`}>
              <Bell size={48} className={`mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
              <p className="text-center">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {notifications.map(notification => (
                <div key={notification.id} className={`p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {notification.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                      {notification.type === 'warning' && <AlertCircle className="h-5 w-5 text-amber-500" />}
                      {notification.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{notification.title}</p>
                      <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{notification.message}</p>
                    </div>
                    <button 
                      onClick={() => removeNotification(notification.id)}
                      className={`ml-3 flex-shrink-0 p-1 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <X size={16} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};