import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface PopupNotificationProps {
  id: string;
  title: string;
  message: string;
  timestamp?: string;
  duration?: number;
  onClose?: (id: string) => void;
}

export function PopupNotification({
  id,
  title,
  message,
  timestamp,
  duration = 5000,
  onClose,
}: PopupNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.(id);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] bg-red-500 text-white rounded-lg shadow-lg p-4 min-w-[300px] border-4 border-yellow-400">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-1">{title}</h4>
          <p className="text-base">{message}</p>
          {timestamp && (
            <p className="text-sm mt-2">{timestamp}</p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-3 bg-white text-red-500 px-2 py-1 rounded font-bold hover:bg-gray-100"
          aria-label="Close notification"
        >
          X
        </button>
      </div>
    </div>
  );
}

// Hook for managing popup notifications
export function usePopupNotifications() {
  const [notifications, setNotifications] = useState<PopupNotificationProps[]>([]);

  const showNotification = (title: string, message: string, options?: Partial<Omit<PopupNotificationProps, 'id' | 'title' | 'message'>>) => {
    console.log('[Popup Hook] showNotification called:', { title, message });
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = { 
      ...options, 
      id, 
      title, 
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    console.log('[Popup Hook] Adding notification:', newNotification);
    setNotifications(prev => {
      console.log('[Popup Hook] Previous notifications:', prev.length);
      const updated = [...prev, newNotification];
      console.log('[Popup Hook] Updated notifications:', updated.length);
      return updated;
    });
    
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const PopupNotificationsContainer = () => (
    <>
      {notifications.map((notification) => (
        <PopupNotification
          key={notification.id}
          {...notification}
          onClose={removeNotification}
        />
      ))}
    </>
  );

  return {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    PopupNotificationsContainer,
  };
}
