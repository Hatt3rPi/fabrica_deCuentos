import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import notificationService from '../services/notificationService';
import { 
  NotificationType, 
  NotificationPriority,
  NotificationFilterOptions,
  NotificationGroup
} from '../types/notification';
import type { Notification } from '../types/notification';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (options?: NotificationFilterOptions) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const fetchedNotifications = await notificationService.getNotifications(user.id, options);
      setNotifications(fetchedNotifications);
      
      // Update unread count
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
      
      setError(null);
    } catch (err) {
      setError('Error al cargar notificaciones');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user) return false;
    
    try {
      const success = await notificationService.markAsRead(notificationId);
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      return success;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      return false;
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return false;
    
    try {
      const success = await notificationService.markAllAsRead(user.id);
      if (success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
      }
      return success;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      return false;
    }
  }, [user]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return false;
    
    try {
      const success = await notificationService.deleteNotification(notificationId);
      if (success) {
        // Update local state
        const deletedNotification = notifications.find(n => n.id === notificationId);
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return success;
    } catch (err) {
      console.error('Error deleting notification:', err);
      return false;
    }
  }, [user, notifications]);

  // Delete multiple notifications
  const deleteMultipleNotifications = useCallback(async (notificationIds: string[]) => {
    if (!user) return false;
    
    try {
      const success = await notificationService.deleteMultipleNotifications(notificationIds);
      if (success) {
        // Update local state
        const deletedNotifications = notifications.filter(n => notificationIds.includes(n.id));
        setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
        
        // Update unread count
        const unreadDeleted = deletedNotifications.filter(n => !n.read).length;
        setUnreadCount(prev => Math.max(0, prev - unreadDeleted));
      }
      return success;
    } catch (err) {
      console.error('Error deleting multiple notifications:', err);
      return false;
    }
  }, [user, notifications]);

  // Create a new notification
  const createNotification = useCallback(async (
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: Record<string, any>,
    actions?: any[]
  ) => {
    if (!user) return null;
    
    try {
      const notification = await notificationService.createNotification(
        user.id,
        type,
        title,
        message,
        priority,
        data,
        actions
      );
      
      if (notification) {
        // Update local state
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
      
      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      return null;
    }
  }, [user]);

  // Group notifications by date
  const groupNotificationsByDate = useCallback((): NotificationGroup[] => {
    const groups: Record<string, Notification[]> = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(notification);
    });
    
    return Object.entries(groups).map(([date, notifications]) => ({
      date,
      notifications
    }));
  }, [notifications]);

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    return await notificationService.requestNotificationPermission();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;
    
    // Initial fetch
    fetchNotifications();
    
    // Subscribe to real-time updates
    const unsubscribe = notificationService.subscribeToRealtimeNotifications(
      user.id,
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    );
    
    // Add notification listener for in-app notifications
    const notificationListener = (notification) => {
      // Handle in-app notification display
      console.log('New notification received:', notification);
      // You could trigger a toast or other UI element here
    };
    
    notificationService.addNotificationListener(notificationListener);
    
    return () => {
      unsubscribe();
      notificationService.removeNotificationListener(notificationListener);
    };
  }, [user]); // Removida dependencia de fetchNotifications para evitar loops

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteMultipleNotifications,
    createNotification,
    groupNotificationsByDate,
    requestNotificationPermission
  };
};
