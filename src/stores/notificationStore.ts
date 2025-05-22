import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  NotificationPreferences
} from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  
  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  deleteMultipleNotifications: (notificationIds: string[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  clearNotifications: () => void;
}

// Default notification preferences
const defaultPreferences: NotificationPreferences = {
  enablePushNotifications: true,
  enableInAppNotifications: true,
  enableEmailNotifications: false,
  enableSounds: true,
  soundChoice: 'default',
  mutedUntil: null,
  notificationTypes: {
    [NotificationType.CHARACTER_GENERATION_COMPLETE]: {
      enabled: true,
      channels: {
        push: true,
        inApp: true,
        email: false,
      },
    },
    [NotificationType.CONTENT_INTERACTION]: {
      enabled: true,
      channels: {
        push: true,
        inApp: true,
        email: false,
      },
    },
    [NotificationType.SYSTEM_UPDATE]: {
      enabled: true,
      channels: {
        push: false,
        inApp: true,
        email: false,
      },
    },
    [NotificationType.COMMUNITY_ACTIVITY]: {
      enabled: true,
      channels: {
        push: false,
        inApp: true,
        email: false,
      },
    },
    [NotificationType.INACTIVITY_REMINDER]: {
      enabled: true,
      channels: {
        push: true,
        inApp: true,
        email: false,
      },
    },
  },
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,
      preferences: defaultPreferences,
      
      addNotification: (notification) => set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      })),
      
      markAsRead: (notificationId) => set((state) => {
        const updatedNotifications = state.notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        );
        
        const wasUnread = state.notifications.some(n => n.id === notificationId && !n.read);
        
        return {
          notifications: updatedNotifications,
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      }),
      
      markAllAsRead: () => set((state) => ({
        notifications: state.notifications.map(notification => ({ ...notification, read: true })),
        unreadCount: 0,
      })),
      
      deleteNotification: (notificationId) => set((state) => {
        const notification = state.notifications.find(n => n.id === notificationId);
        const wasUnread = notification && !notification.read;
        
        return {
          notifications: state.notifications.filter(n => n.id !== notificationId),
          unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
        };
      }),
      
      deleteMultipleNotifications: (notificationIds) => set((state) => {
        const unreadDeleted = state.notifications.filter(
          n => notificationIds.includes(n.id) && !n.read
        ).length;
        
        return {
          notifications: state.notifications.filter(n => !notificationIds.includes(n.id)),
          unreadCount: Math.max(0, state.unreadCount - unreadDeleted),
        };
      }),
      
      setNotifications: (notifications) => set(() => ({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
      })),
      
      setUnreadCount: (count) => set(() => ({
        unreadCount: count,
      })),
      
      updatePreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences },
      })),
      
      clearNotifications: () => set(() => ({
        notifications: [],
        unreadCount: 0,
      })),
    }),
    {
      name: 'notification-storage',
      partialize: (state) => ({ 
        preferences: state.preferences,
      }),
    }
  )
);

