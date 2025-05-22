import { createClient } from '@supabase/supabase-js';
import { 
  Notification, 
  NotificationType, 
  NotificationPriority,
  NotificationFilterOptions
} from '../types/notification';
import { v4 as uuidv4 } from 'uuid';

// Supabase client initialization would typically be imported from a central location
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class NotificationService {
  private static instance: NotificationService;
  private notificationListeners: ((notification: Notification) => void)[] = [];

  private constructor() {
    // Initialize service worker registration
    this.registerServiceWorker();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
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

  private handleNotificationClick(notification: Notification) {
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
  ): Promise<Notification[]> {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });

    // Apply filters
    if (options.type && options.type.length > 0) {
      query = query.in('type', options.type);
    }

    if (options.read !== undefined) {
      query = query.eq('read', options.read);
    }

    if (options.dateFrom) {
      query = query.gte('createdAt', options.dateFrom.toISOString());
    }

    if (options.dateTo) {
      query = query.lte('createdAt', options.dateTo.toISOString());
    }

    if (options.priority && options.priority.length > 0) {
      query = query.in('priority', options.priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as Notification[];
  }

  public async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    return !error;
  }

  public async markAllAsRead(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('userId', userId)
      .eq('read', false);

    return !error;
  }

  public async deleteNotification(notificationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return !error;
  }

  public async deleteMultipleNotifications(notificationIds: string[]): Promise<boolean> {
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
  ): Promise<Notification | null> {
    const notification: Notification = {
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

    const { error } = await supabase
      .from('notifications')
      .insert(notification);

    if (error) {
      console.error('Error creating notification:', error);
      return null;
    }

    // Notify listeners
    this.notifyListeners(notification);

    // Send browser notification if permission is granted
    this.sendBrowserNotification(notification);

    return notification;
  }

  private async sendBrowserNotification(notification: Notification) {
    if (Notification.permission === 'granted') {
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
    }
  }

  private getNotificationUrl(notification: Notification): string {
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

  public addNotificationListener(listener: (notification: Notification) => void) {
    this.notificationListeners.push(listener);
  }

  public removeNotificationListener(listener: (notification: Notification) => void) {
    this.notificationListeners = this.notificationListeners.filter(l => l !== listener);
  }

  private notifyListeners(notification: Notification) {
    this.notificationListeners.forEach(listener => {
      try {
        listener(notification);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Method to subscribe to real-time notifications
  public subscribeToRealtimeNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `userId=eq.${userId}`,
      }, (payload) => {
        callback(payload.new as Notification);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Method to update user notification preferences
  public async updateNotificationPreferences(userId: string, preferences: any): Promise<boolean> {
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        userId,
        notificationPreferences: preferences,
      });

    return !error;
  }

  // Method to get user notification preferences
  public async getNotificationPreferences(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('notificationPreferences')
      .eq('userId', userId)
      .single();

    if (error) {
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data?.notificationPreferences;
  }
}

export default NotificationService.getInstance();

