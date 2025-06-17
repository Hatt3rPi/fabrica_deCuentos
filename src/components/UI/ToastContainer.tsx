import React, { useState, useEffect } from 'react';
import Toast, { ToastType } from './Toast';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationType } from '../../types/notification';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { notifications } = useNotifications();

  // Listen for new notifications and convert them to toasts
  useEffect(() => {
    if (notifications.length === 0) return;

    // Get the latest notification (first in the array)
    const latestNotification = notifications[0];
    
    // Check if we already have a toast for this notification
    if (toasts.some(toast => toast.id === latestNotification.id)) return;
    
    // Map notification type to toast type
    let toastType: ToastType = 'notification';
    switch (latestNotification.type) {
      case NotificationType.CHARACTER_GENERATION_COMPLETE:
        toastType = 'success';
        break;
      case NotificationType.SYSTEM_UPDATE:
        toastType = 'info';
        break;
      case NotificationType.CONTENT_INTERACTION:
        toastType = 'notification';
        break;
      case NotificationType.COMMUNITY_ACTIVITY:
        toastType = 'notification';
        break;
      case NotificationType.INACTIVITY_REMINDER:
        toastType = 'info';
        break;
      default:
        toastType = 'notification';
    }
    
    // Add new toast
    setToasts(prev => [
      ...prev,
      {
        id: latestNotification.id,
        type: toastType,
        message: latestNotification.message
      }
    ]);
  }, [notifications]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <div className="fixed top-[calc(var(--header-height,4rem)+1rem)] right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <div key={toast.id} style={{ marginTop: `${index * 80}px` }}>
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
