import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Notification } from '../types/notification';

interface NotificationStore {
  notifications: Notification[];
  preferences: any;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteMultipleNotifications: (ids: string[]) => void;
  updatePreferences: (preferences: any) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      preferences: {
        enablePushNotifications: true,
        enableInAppNotifications: true,
        enableEmailNotifications: false,
        enableSounds: true,
        soundChoice: 'default',
        mutedUntil: null,
        notificationTypes: {
          CHARACTER_GENERATION_COMPLETE: {
            enabled: true,
            channels: {
              push: true,
              inApp: true,
              email: false
            }
          },
          CONTENT_INTERACTION: {
            enabled: true,
            channels: {
              push: true,
              inApp: true,
              email: false
            }
          },
          SYSTEM_UPDATE: {
            enabled: true,
            channels: {
              push: false,
              inApp: true,
              email: false
            }
          },
          COMMUNITY_ACTIVITY: {
            enabled: true,
            channels: {
              push: false,
              inApp: true,
              email: false
            }
          },
          INACTIVITY_REMINDER: {
            enabled: true,
            channels: {
              push: true,
              inApp: true,
              email: false
            }
          },
          SYSTEM_SUCCESS: {
            enabled: true,
            channels: {
              push: false,
              inApp: true,
              email: false
            }
          },
          SYSTEM_ERROR: {
            enabled: true,
            channels: {
              push: false,
              inApp: true,
              email: false
            }
          }
        }
      },
      addNotification: (notification: Notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications]
        })),
      markAsRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true
          }))
        })),
      deleteNotification: (id: string) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          )
        })),
      deleteMultipleNotifications: (ids: string[]) =>
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => !ids.includes(notification.id)
          )
        })),
      updatePreferences: (preferences: any) =>
        set(() => ({
          preferences
        }))
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50), // Guardar solo las últimas 50 notificaciones
        preferences: state.preferences
      })
    }
  )
);

