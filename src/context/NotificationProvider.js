import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { deviceNotificationService } from '../services/deviceNotificationService';
import { notificationsService } from '../services/notificationsService';
import { hotdeckNotificationService } from '../services/HotdeckNotificationService';
import { auth } from '../config/firebase';

const NotificationContext = createContext(undefined);

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Sync badge count with unread notifications
   */
  const syncBadgeCount = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        console.log('🔄 Syncing badge count for user:', user.uid);
        const totalUnread = await notificationsService.GetTotalUnreadCount(user.uid);
        await deviceNotificationService.syncBadgeWithTotalUnread(totalUnread);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('❌ Error syncing badge count:', error);
      }
    }
  };

  /**
   * Debug notifications
   */
  const debugNotifications = async () => {
    console.log('🐛 DEBUGGING NOTIFICATIONS...');
    await deviceNotificationService.logNotificationStatus();
    
    const user = auth.currentUser;
    if (user) {
      console.log('🔍 Checking unread notifications...');
      const totalUnread = await notificationsService.GetTotalUnreadCount(user.uid);
      console.log('🔢 Total unread count:', totalUnread);
      
      const notifs = await notificationsService.GetNotifications(user.uid);
      console.log('📋 Notifications:', notifs);
    }
  };

  /**
   * Test delivery
   */
  const testDelivery = async () => {
    console.log('🧪 TESTING NOTIFICATION DELIVERY...');
    await deviceNotificationService.testNotificationDelivery();
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await notificationsService.MarkAllAsRead(user.uid);
        await syncBadgeCount();
      } catch (error) {
        console.error('❌ Error marking all as read:', error);
      }
    }
  };

  /**
   * Refresh notifications
   */
  const refreshNotifications = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        setIsLoading(true);
        const notifs = await notificationsService.GetNotifications(user.uid);
        setNotifications(notifs);
        await syncBadgeCount();
      } catch (error) {
        console.error('❌ Error refreshing notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Initialize notification service when app starts
  useEffect(() => {
    const initializeNotifications = async () => {
      await deviceNotificationService.initialize();
    };

    initializeNotifications();

    // Make debug functions globally available (for development)
    if (typeof window !== 'undefined') {
      window.debugNotifications = debugNotifications;
      window.testNotificationDelivery = testDelivery;
      window.syncBadgeCount = syncBadgeCount;
      window.resetHotdeckTimestamp = () => {
        hotdeckNotificationService.resetTimestamp();
        console.log('✅ Hotdeck timestamp reset - next hotdeck will trigger notification');
      };
      console.log('🐛 Debug functions available: debugNotifications(), testNotificationDelivery(), syncBadgeCount(), resetHotdeckTimestamp()');
    }
  }, []);

  // Subscribe to unread count and notifications when user changes
  useEffect(() => {
    const user = auth.currentUser;
    
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    console.log('🔔 NotificationProvider: User signed in:', user.uid);

    // Update device token on sign in (skip on simulator)
    const setupNotifications = async () => {
      try {
        await deviceNotificationService.updateDeviceTokenOnSignIn(user.uid);
      } catch (error) {
        console.log('⚠️ Push notifications not available (simulator?), continuing anyway');
      }
      
      // Recalculate unread count to fix any sync issues
      try {
        console.log('🔧 Recalculating unread count on app start...');
        await notificationsService.recalculateUnreadCount(user.uid);
      } catch (error) {
        console.error('⚠️ Error recalculating unread count:', error);
      }
      
      // Sync badge count after a short delay
      setTimeout(() => {
        syncBadgeCount();
      }, 1000);
    };

    setupNotifications();

    // Subscribe to unread count changes
    const unsubscribeUnreadCount = notificationsService.SubscribeToUnreadCount(
      user.uid,
      (count) => {
        console.log('📊 Unread count updated:', count);
        setUnreadCount(count);
        deviceNotificationService.syncBadgeWithTotalUnread(count).catch(() => {});
      },
      (error) => {
        console.error('❌ Error in unread count subscription:', error);
      }
    );

    // Subscribe to notifications
    const unsubscribeNotifications = notificationsService.SubscribeToNotifications(
      user.uid,
      (notifs) => {
        console.log('📊 Notifications updated:', notifs.length);
        setNotifications(notifs);
        setIsLoading(false);
      },
      (error) => {
        console.error('❌ Error in notifications subscription:', error);
        setIsLoading(false);
      }
    );

    // Start hotdeck notification listener (ALWAYS, even without push notifications)
    let unsubscribeHotdecks = null;
    console.log('🔔 Starting hotdeck notification listener...');
    hotdeckNotificationService.startListening(user.uid)
      .then(unsub => {
        unsubscribeHotdecks = unsub;
        console.log('✅ Hotdeck notification listener started successfully');
      })
      .catch(error => {
        console.error('❌ Error starting hotdeck listener:', error);
      });

    // Clean up subscriptions
    return () => {
      console.log('🛑 Cleaning up notification subscriptions');
      unsubscribeUnreadCount();
      unsubscribeNotifications();
      if (unsubscribeHotdecks) {
        unsubscribeHotdecks();
      }
      hotdeckNotificationService.stopListening();
    };
  }, [auth.currentUser?.uid]);

  return (
    <NotificationContext.Provider 
      value={{ 
        unreadCount,
        notifications,
        isLoading,
        syncBadgeCount,
        debugNotifications,
        testDelivery,
        markAllAsRead,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

