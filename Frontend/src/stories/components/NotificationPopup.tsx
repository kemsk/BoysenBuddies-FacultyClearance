import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface NotificationPopupItem {
  id: string | number;
  title: string;
  message: string;
  timestamp?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
}

interface NotificationPopupProps {
  notification: NotificationPopupItem | null;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationPopup({
  notification,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000,
}: NotificationPopupProps) {
  useEffect(() => {
    if (isVisible && autoClose && notification) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, notification, onClose]);

  if (!isVisible || !notification) {
    return null;
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right fade-in duration-300 max-w-sm">
      <div className={`${getBackgroundColor()} text-white rounded-lg shadow-lg p-4 min-w-[300px]`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
            <p className="text-sm opacity-90">{notification.message}</p>
            {notification.timestamp && (
              <p className="text-xs opacity-75 mt-2">{notification.timestamp}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 text-white/80 hover:text-white transition-colors"
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for managing popup notifications
export function useNotificationPopup() {
  const [notification, setNotification] = useState<NotificationPopupItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const showNotification = (notif: NotificationPopupItem) => {
    setNotification(notif);
    setIsVisible(true);
  };

  const closeNotification = () => {
    setIsVisible(false);
    // Clear notification after animation
    setTimeout(() => {
      setNotification(null);
    }, 300);
  };

  const NotificationPopupComponent = () => (
    <NotificationPopup
      notification={notification}
      isVisible={isVisible}
      onClose={closeNotification}
    />
  );

  return {
    showNotification,
    closeNotification,
    NotificationPopupComponent,
  };
}
