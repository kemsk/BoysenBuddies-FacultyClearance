import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePopupNotifications } from '../stories/components/PopupNotification';

interface NotificationContextType {
  isConnected: boolean;
  lastNotificationCount: number;
  checkForNewNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { showNotification, PopupNotificationsContainer } = usePopupNotifications();
  const [lastNotificationCount, setLastNotificationCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const checkForNewNotifications = async () => {
    try {
      console.log('[Global Notifications] Checking for new notifications...');
      const response = await fetch("/admin/xu-faculty-clearance/api/notifications/unread-count", {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentCount = data.unreadCount || 0;
        console.log('[Global Notifications] Current count:', currentCount, 'Previous count:', lastNotificationCount);
        
        // If we have more notifications than before, fetch the new ones
        if (currentCount > lastNotificationCount && lastNotificationCount > 0) {
          console.log('[Global Notifications] New notifications detected!');
          
          // Fetch the latest notifications
          const notifResponse = await fetch("/admin/xu-faculty-clearance/api/notifications", {
            credentials: "include"
          });
          
          if (notifResponse.ok) {
            const notifData = await notifResponse.json();
            const allNotifications = notifData.items || [];
            const newNotifications = allNotifications.slice(0, currentCount - lastNotificationCount);
            
            console.log('[Global Notifications] New notifications to show:', newNotifications.length);
            
            // Show popup for each new notification
            newNotifications.forEach((notif: any, index: number) => {
              setTimeout(() => {
                console.log('[Global Notifications] Showing popup for:', notif.title);
                showNotification(
                  notif.title || 'New Notification',
                  notif.description || notif.details?.[0] || 'You have a new notification'
                );
              }, index * 1000); // Stagger multiple notifications
            });
          }
        }
        
        setLastNotificationCount(currentCount);
        setIsConnected(true);
      } else {
        console.log('[Global Notifications] Failed to fetch unread count:', response.status);
      }
    } catch (error) {
      console.error('[Global Notifications] Failed to check notifications:', error);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkForNewNotifications();

    // Set up periodic checking every 30 seconds
    const interval = setInterval(checkForNewNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      isConnected,
      lastNotificationCount,
      checkForNewNotifications
    }}>
      {children}
      <PopupNotificationsContainer />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
