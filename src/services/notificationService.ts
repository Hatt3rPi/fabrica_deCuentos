import { createClient } from '@supabase/supabase-js';
import { 
  NotificationType, 
  NotificationPriority,
  NotificationFilterOptions
} from '../types/notification';
// Rename the imported interface to avoid conflict with browser's Notification API
import type { Notification as AppNotification } from '../types/notification';
import { v4 as uuidv4 } from 'uuid';
import { useNotificationStore } from '../stores/notificationStore';

// Supabase client initialization would typically be imported from a central location
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class NotificationService {
  private static instance: NotificationService;
  private notificationListeners: ((notification: AppNotification) => void)[] = [];
  private dbAvailable: boolean = true;

  private constructor() {
    // Initialize service worker registration
    this.registerServiceWorker();
    // Check if the notifications table exists
    this.checkDbAvailability();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async checkDbAvailability() {
    try {
      const { error } = await supabase
        .from('notifications')
        .select('id')
        .limit(1);
      
      if (error && error.code === '42P01') { // Table doesn't exist
        console.warn('Notifications table does not exist. Using local storage only.');
        this.dbAvailable = false;
      }
    } catch (error) {
      console.warn('Error checking database availability:', error);
      this.dbAvailable = false;
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Set up message listener for service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
            this.handleNotificationClick(event.data.notification);
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private handleNotificationClick(notification: AppNotification) {
    // Handle notification click based on notification type
    console.log('Notification clicked:', notification);
    // Implement navigation or action based on notification type and data
  }

  public async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  public async getNotifications(
    userId: string, 
    options: NotificationFilterOptions = {}
  ): Promise<AppNotification[]> {
    if (!this.dbAvailable) {
      // Return notifications from local store if DB is not available
      const store = useNotificationStore.getState();
      let notifications = [...store.notifications];
      
      // Apply filters
      if (options.read !== undefined) {
        notifications = notifications.filter(n => n.read === options.read);
      }
      
      if (options.type && options.type.length > 0) {
        notifications = notifications.filter(n => options.type!.includes(n.type));
      }
      
      return notifications;
    }

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (options.type && options.type.length > 0) {
      query = query.in('type', options.type);
    }

    if (options.read !== undefined) {
      query = query.eq('read', options.read);
    }

    if (options.dateFrom) {
      query = query.gte('created_at', options.dateFrom.toISOString());
    }

    if (options.dateTo) {
      query = query.lte('created_at', options.dateTo.toISOString());
    }

    if (options.priority && options.priority.length > 0) {
      query = query.in('priority', options.priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    // Mapear los resultados para convertir snake_case a camelCase
    return data.map((item: any) => ({
      id: item.id,
      userId: item.user_id,
      type: item.type,
      title: item.title,
      message: item.message,
      data: item.data,
      priority: item.priority,
      read: item.read,
      createdAt: new Date(item.created_at),
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      actions: item.actions
    }));
  }

  public async getUnreadCount(userId: string): Promise<number> {
    if (!this.dbAvailable) {
      // Return unread count from local store if DB is not available
      const store = useNotificationStore.getState();
      return store.notifications.filter(n => !n.read).length;
    }

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.dbAvailable) {
      // Mark as read in local store if DB is not available
      useNotificationStore.getState().markAsRead(notificationId);
      return true;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    return !error;
  }

  public async markAllAsRead(userId: string): Promise<boolean> {
    if (!this.dbAvailable) {
      // Mark all as read in local store if DB is not available
      useNotificationStore.getState().markAllAsRead();
      return true;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    return !error;
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    if (!this.dbAvailable) {
      // Delete from local store if DB is not available
      useNotificationStore.getState().deleteNotification(notificationId);
      return true;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return !error;
  }

  public async deleteMultipleNotifications(notificationIds: string[]): Promise<boolean> {
    if (!this.dbAvailable) {
      // Delete multiple from local store if DB is not available
      useNotificationStore.getState().deleteMultipleNotifications(notificationIds);
      return true;
    }

    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    return !error;
  }

  public async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: Record<string, any>,
    actions?: any[]
  ): Promise<AppNotification | null> {
    const notification: AppNotification = {
      id: uuidv4(),
      userId,
      type,
      title,
      message,
      priority,
      data,
      actions,
      read: false,
      createdAt: new Date(),
    };

    // Always add to local store for immediate feedback
    useNotificationStore.getState().addNotification(notification);

    // Notify listeners
    this.notifyListeners(notification);

    // Send browser notification if permission is granted
    this.sendBrowserNotification(notification);

    if (!this.dbAvailable) {
      return notification;
    }

    // Convertir a formato snake_case para la base de datos
    const dbNotification = {
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      priority: notification.priority,
      read: notification.read,
      created_at: notification.createdAt.toISOString(),
      expires_at: notification.expiresAt ? notification.expiresAt.toISOString() : null,
      actions: notification.actions
    };

    // Also save to database if available
    const { error } = await supabase
      .from('notifications')
      .insert(dbNotification);

    if (error) {
      console.error('Error creating notification in database:', error);
      // Still return the notification since it's in local store
      return notification;
    }

    return notification;
  }

  private async sendBrowserNotification(notification: AppNotification) {
    if (Notification.permission === 'granted') {
      try {
        const browserNotification = new Notification(notification.title, {
          body: notification.message,
          icon: '/notification-icon.png', // Add your notification icon
          data: {
            notificationId: notification.id,
            url: this.getNotificationUrl(notification),
          },
        });

        browserNotification.onclick = () => {
          window.focus();
          this.handleNotificationClick(notification);
          browserNotification.close();
        };
      } catch (error) {
        console.error('Error sending browser notification:', error);
      }
    }
  }

  private getNotificationUrl(notification: AppNotification): string {
    // Determine URL based on notification type and data
    switch (notification.type) {
      case NotificationType.CHARACTER_GENERATION_COMPLETE:
        return `/personaje/${notification.data?.characterId}`;
      case NotificationType.CONTENT_INTERACTION:
        return `/contenido/${notification.data?.contentId}`;
      case NotificationType.SYSTEM_UPDATE:
        return '/actualizaciones';
      case NotificationType.COMMUNITY_ACTIVITY:
        return '/comunidad';
      default:
        return '/notificaciones';
    }
  }

  public addNotificationListener(listener: (notification: AppNotification) => void) {
    this.notificationListeners.push(listener);
  }

  public removeNotificationListener(listener: (notification: AppNotification) => void) {
    this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
  }

  private notifyListeners(notification: AppNotification) {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Method to subscribe to real-time notifications
  public subscribeToRealtimeNotifications(userId: string, callback: (notification: AppNotification) => void) {
    if (!this.dbAvailable) {
      // Return a no-op function if DB is not available
      return () => {};
    }

    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        // Convertir de snake_case a camelCase
        const notification: AppNotification = {
          id: payload.new.id,
          userId: payload.new.user_id,
          type: payload.new.type,
          title: payload.new.title,
          message: payload.new.message,
          data: payload.new.data,
          priority: payload.new.priority,
          read: payload.new.read,
          createdAt: new Date(payload.new.created_at),
          expiresAt: payload.new.expires_at ? new Date(payload.new.expires_at) : undefined,
          actions: payload.new.actions
        };
        callback(notification);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Method to update user notification preferences
  public async updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
    if (!this.dbAvailable) {
      // Update preferences in local store if DB is not available
      useNotificationStore.getState().updatePreferences(preferences);
      return true;
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        notification_preferences: preferences,
      });

    return !error;
  }

  // Method to get user notification preferences
  public async getNotificationPreferences(userId: string): Promise<any> {
    if (!this.dbAvailable) {
      // Return preferences from local store if DB is not available
      return useNotificationStore.getState().preferences;
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .select('notification_preferences')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data?.notification_preferences;
  }
}

export default NotificationService.getInstance();
