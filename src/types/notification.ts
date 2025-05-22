export enum NotificationType {
  CHARACTER_GENERATION_COMPLETE = 'CHARACTER_GENERATION_COMPLETE',
  CONTENT_INTERACTION = 'CONTENT_INTERACTION',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  COMMUNITY_ACTIVITY = 'COMMUNITY_ACTIVITY',
  INACTIVITY_REMINDER = 'INACTIVITY_REMINDER',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface NotificationPreferences {
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSounds: boolean;
  soundChoice: string;
  mutedUntil: Date | null;
  notificationTypes: {
    [key in NotificationType]: {
      enabled: boolean;
      channels: {
        push: boolean;
        inApp: boolean;
        email: boolean;
      };
    };
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  url?: string;
  data?: Record<string, any>;
}

export interface NotificationGroup {
  date: string;
  notifications: Notification[];
}

export interface NotificationFilterOptions {
  type?: NotificationType[];
  read?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  priority?: NotificationPriority[];
}

