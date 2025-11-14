import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationProps {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (duration > 0 && !isPaused) {
      const startTime = Date.now();
      const endTime = startTime + duration;
      
      const timer = setInterval(() => {
        const now = Date.now();
        const remaining = endTime - now;
        const newProgress = (remaining / duration) * 100;
        
        if (remaining <= 0) {
          clearInterval(timer);
          handleClose();
        } else {
          setProgress(newProgress);
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [duration, isPaused]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 300); // Wait for animation to complete
    }
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div
      className={`flex flex-col p-0 mb-3 rounded-lg border shadow-md ${getBgColor()} animate-fade-in overflow-hidden dark:border-gray-700`}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 mr-2">
          <h3 className="text-sm font-medium">{title}</h3>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</div>
        </div>
        <button
          type="button"
          className="flex-shrink-0 ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-300 inline-flex items-center justify-center h-8 w-8 transition-colors"
          onClick={handleClose}
          aria-label="Close"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>
      
      {duration > 0 && (
        <div className="h-1 w-full bg-gray-200 dark:bg-gray-700">
          <div 
            className={`h-full ${getProgressColor()} transition-all duration-300 ease-linear`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};