import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  workoutReminders: boolean;
  mealReminders: boolean;
  progressUpdates: boolean;
  socialNotifications: boolean;
  challengeUpdates: boolean;
  coachMessages: boolean;
}

export const notificationService = {
  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return false;
      }

      // Get push token
      const token = await this.getPushToken();
      if (token) {
        await this.savePushToken(token);
      }

      return true;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  },

  // Get push notification token
  async getPushToken(): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        console.log('Push notifications not supported on web');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  },

  // Save push token to database
  async savePushToken(token: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('push_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  },

  // Schedule workout reminder
  async scheduleWorkoutReminder(workoutTime: Date, workoutName: string): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Workout Time!',
          body: `Time for your ${workoutName} workout. Let\'s get stronger!`,
          sound: 'default',
          data: {
            type: 'workout_reminder',
            workoutName
          }
        },
        trigger: {
          date: workoutTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling workout reminder:', error);
      return null;
    }
  },

  // Schedule meal reminder
  async scheduleMealReminder(mealTime: Date, mealType: string): Promise<string | null> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🍽️ Meal Time!',
          body: `Don\'t forget to log your ${mealType}. Nutrition matters!`,
          sound: 'default',
          data: {
            type: 'meal_reminder',
            mealType
          }
        },
        trigger: {
          date: mealTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling meal reminder:', error);
      return null;
    }
  },

  // Schedule daily motivation
  async scheduleDailyMotivation(): Promise<void> {
    try {
      const motivationalMessages = [
        'Start your day strong! Your body can do it. Your mind controls it. 💪',
        'Every workout gets you closer to your goals. You\'ve got this! 🔥',
        'Consistency beats perfection. Show up today! ⭐',
        'Your only limit is you. Push beyond your comfort zone! 🚀',
        'Progress, not perfection. Every step counts! 👟',
        'Believe in yourself. You\'re stronger than you think! 💎',
        'Champions train, losers complain. What will you do today? 🏆'
      ];

      // Schedule for next 7 days at 8 AM
      for (let i = 0; i < 7; i++) {
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + i + 1);
        triggerDate.setHours(8, 0, 0, 0);

        const message = motivationalMessages[i % motivationalMessages.length];

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Daily Motivation 🌟',
            body: message,
            sound: 'default',
            data: {
              type: 'daily_motivation'
            }
          },
          trigger: {
            date: triggerDate,
          },
        });
      }
    } catch (error) {
      console.error('Error scheduling daily motivation:', error);
    }
  },

  // Send push notification via server
  async sendPushNotification(
    userId: string, 
    title: string, 
    body: string, 
    data?: any
  ): Promise<boolean> {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-notification', {
        body: {
          userId,
          title,
          body,
          data
        }
      });

      if (error) throw error;
      return result?.success || false;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  },

  // Get notification settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.getDefaultSettings();
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return this.getDefaultSettings();
      }

      return {
        workoutReminders: data.workout_reminders,
        mealReminders: data.meal_reminders,
        progressUpdates: data.progress_updates,
        socialNotifications: data.social_notifications,
        challengeUpdates: data.challenge_updates,
        coachMessages: data.coach_messages
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return this.getDefaultSettings();
    }
  },

  // Update notification settings
  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          workout_reminders: settings.workoutReminders,
          meal_reminders: settings.mealReminders,
          progress_updates: settings.progressUpdates,
          social_notifications: settings.socialNotifications,
          challenge_updates: settings.challengeUpdates,
          coach_messages: settings.coachMessages,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Default notification settings
  getDefaultSettings(): NotificationSettings {
    return {
      workoutReminders: true,
      mealReminders: true,
      progressUpdates: true,
      socialNotifications: true,
      challengeUpdates: true,
      coachMessages: true
    };
  },

  // Cancel all scheduled notifications
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  },

  // Cancel specific notification
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  },

  // Handle notification received
  addNotificationReceivedListener(listener: (notification: any) => void) {
    return Notifications.addNotificationReceivedListener(listener);
  },

  // Handle notification response (user tapped notification)
  addNotificationResponseReceivedListener(listener: (response: any) => void) {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },

  // Send workout completion celebration
  async sendWorkoutCompletionNotification(workoutName: string, caloriesBurned: number): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Workout Complete!',
          body: `Great job on ${workoutName}! You burned ${caloriesBurned} calories. You\'re crushing it!`,
          sound: 'default',
          data: {
            type: 'workout_completion'
          }
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending workout completion notification:', error);
    }
  },

  // Send streak milestone notification
  async sendStreakMilestoneNotification(streakDays: number): Promise<void> {
    try {
      let message = '';
      if (streakDays === 7) {
        message = 'One week strong! You\'re building incredible habits! 🔥';
      } else if (streakDays === 30) {
        message = 'One month streak! You\'re unstoppable! 💪';
      } else if (streakDays === 100) {
        message = '100 days! You\'re a fitness legend! 🏆';
      } else {
        message = `${streakDays} day streak! Keep the momentum going! ⚡`;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Streak Milestone!',
          body: message,
          sound: 'default',
          data: {
            type: 'streak_milestone',
            streakDays
          }
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending streak milestone notification:', error);
    }
  },

  // Send challenge invitation
  async sendChallengeInvitation(challengeName: string, inviterName: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Challenge Invitation!',
          body: `${inviterName} invited you to join the ${challengeName} challenge. Are you up for it?`,
          sound: 'default',
          data: {
            type: 'challenge_invitation',
            challengeName,
            inviterName
          }
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Error sending challenge invitation:', error);
    }
  }
};