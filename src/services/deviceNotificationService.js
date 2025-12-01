import * as Notifications from 'expo-notifications';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import native modules
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class DeviceNotificationService {
  static instance;
  isInitialized = false;

  static getInstance() {
    if (!DeviceNotificationService.instance) {
      DeviceNotificationService.instance = new DeviceNotificationService();
    }
    return DeviceNotificationService.instance;
  }

  /**
   * Initialize notification services
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing device notification service...');

      // Request permissions
      console.log('📱 Requesting notification permissions...');
      const permissionGranted = await this.requestPermissions();
      console.log('📱 Permission granted:', permissionGranted);

      // Register for push notifications
      console.log('🔗 Registering for push notifications...');
      await this.registerForPushNotifications();

      // Set up notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log('✅ Device notification service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize device notifications:', error);
    }
  }

  /**
   * Request notification permissions
   */
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error requesting notification permissions:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get device token
   */
  async registerForPushNotifications() {
    try {
      // Check if on physical device
      if (!Device?.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return null;
      }

      // Get project ID
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                       Constants?.easConfig?.projectId ||
                       'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';

      console.log('📱 Getting push token with projectId:', projectId?.substring(0, 8) + '...');

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        const token = tokenData.data;
        console.log('📱 Device push token:', token);

        // Save token locally
        await AsyncStorage.setItem('@homerunn_pending_notification_token', token);
        console.log('💾 Token saved locally');

        return token;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      console.error('Error details:', error.message);
      return null;
    }
  }

  /**
   * Get unique device identifier
   */
  async getDeviceIdentifier() {
    try {
      let deviceId = await AsyncStorage.getItem('@homerunn_device_id');
      
      if (!deviceId) {
        deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        await AsyncStorage.setItem('@homerunn_device_id', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      return `${Platform.OS}-${Date.now()}`;
    }
  }

  /**
   * Save device token for current user
   */
  async saveDeviceTokenForCurrentUser(userId, token) {
    console.log('💾 Saving device token for user:', userId);

    try {
      if (!userId || !token) {
        console.log('⚠️ Missing userId or token');
        return;
      }

      const deviceId = await this.getDeviceIdentifier();
      const deviceInfo = {
        Token: token,
        DeviceId: deviceId,
        Platform: Platform.OS,
        DeviceName: Device?.deviceName || `${Platform.OS === 'ios' ? 'iPhone' : 'Android'} Device`,
        ModelName: Device?.modelName || 'Unknown Model',
        AddedAt: new Date(),
        LastUpdatedAt: new Date()
      };

      const userRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const existingData = userDoc.data();
        const existingTokens = existingData?.DevicePushNotificationIDs || [];

        // Check if token already exists
        const existingTokenIndex = existingTokens.findIndex(
          (t) => t.Token === token || t.DeviceId === deviceId
        );

        let updatedTokens;
        if (existingTokenIndex >= 0) {
          updatedTokens = [...existingTokens];
          updatedTokens[existingTokenIndex] = deviceInfo;
        } else {
          updatedTokens = [...existingTokens, deviceInfo];
        }

        await updateDoc(userRef, {
          DevicePushNotificationIDs: updatedTokens,
          AppNotificationsEnabled: true,
          DeviceNotificationToken: token,
          pushTokenUpdatedAt: new Date(),
        });

        await AsyncStorage.removeItem('@homerunn_pending_notification_token');

        console.log('✅ Device token saved successfully', {
          userId,
          totalDevices: updatedTokens.length,
          deviceId
        });
        return;
      }

      console.log('⚠️ User document not found');
    } catch (error) {
      console.error('❌ Error saving device token:', error);
    }
  }

  /**
   * Remove device token for current user
   */
  async removeDeviceTokenForCurrentUser(userId) {
    console.log('🔕 Removing device token for user:', userId);

    try {
      if (!userId) {
        console.log('⚠️ No userId provided');
        return;
      }

      const deviceId = await this.getDeviceIdentifier();
      const userRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const existingData = userDoc.data();
        const existingTokens = existingData?.DevicePushNotificationIDs || [];

        const updatedTokens = existingTokens.filter(
          (t) => t.DeviceId !== deviceId
        );

        await updateDoc(userRef, {
          DevicePushNotificationIDs: updatedTokens,
          AppNotificationsEnabled: updatedTokens.length > 0,
          DeviceNotificationToken: updatedTokens.length > 0 ? updatedTokens[0].Token : null,
        });

        console.log('✅ Device token removed', {
          userId,
          remainingDevices: updatedTokens.length
        });
        return;
      }

      console.log('⚠️ User document not found');
    } catch (error) {
      console.error('❌ Error removing device token:', error);
    }
  }

  /**
   * Update device token when user signs in
   */
  async updateDeviceTokenOnSignIn(userId) {
    try {
      console.log('🔄 Updating device token on sign in for user:', userId);

      // Check for pending token
      const pendingToken = await AsyncStorage.getItem('@homerunn_pending_notification_token');
      
      let token;
      if (pendingToken) {
        console.log('📱 Found pending notification token');
        token = pendingToken;
      } else {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                         Constants?.easConfig?.projectId ||
                         'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';
        
              const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
              token = tokenData.data;
        console.log('📱 Got push token:', token.substring(0, 20) + '...');
      }

      await this.saveDeviceTokenForCurrentUser(userId, token);
      console.log('✅ Device token updated successfully');
    } catch (error) {
      console.error('❌ Error updating device token on sign in:', error);
    }
  }

  /**
   * Enable notifications for current user
   */
  async enableNotificationsForCurrentUser(userId) {
    try {
      console.log('🔔 Enabling notifications for user:', userId);

      const permissionGranted = await this.requestPermissions();
      if (!permissionGranted) {
        console.log('⚠️ Notification permissions not granted');
        throw new Error('Notification permissions not granted');
      }

      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                       Constants?.easConfig?.projectId ||
                       'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';
      
            const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenData.data;
      
      console.log('📱 Got push token for enabling:', token.substring(0, 20) + '...');

      await this.saveDeviceTokenForCurrentUser(userId, token);

      console.log('✅ Notifications enabled successfully');
      return true;
    } catch (error) {
      console.error('❌ Error enabling notifications:', error);
      throw error;
    }
  }

  /**
   * Set up notification event listeners
   */
  setupNotificationListeners() {
    // Handle notification received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('📨 Notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Handle notification response (when user taps notification)
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification response:', response);
      this.handleNotificationResponse(response);
    });

    this.subscriptions = [receivedSubscription, responseSubscription];
  }

  /**
   * Handle notification received
   */
  async handleNotificationReceived(notification) {
    console.log('📨 NOTIFICATION RECEIVED WHILE APP IS OPEN');
    const data = notification.request.content.data;
    const badgeFromPayload = notification.request.content.badge;

    if (badgeFromPayload !== undefined) {
      console.log('🏷️ Badge from notification payload:', badgeFromPayload);
    }

    // Handle specific notification types
    switch (data?.type) {
      case 'new_listing':
        console.log('🏠 New listing notification received');
        break;
      case 'price_change':
        console.log('💰 Price change notification received');
        break;
      case 'message':
        console.log('💬 Message notification received');
        break;
      case 'offer':
        console.log('📝 Offer notification received');
        break;
      default:
        console.log('📄 Generic notification received');
    }
  }

  /**
   * Handle notification response (user tapped notification)
   */
  async handleNotificationResponse(response) {
    console.log('👆 NOTIFICATION TAPPED');
    const data = response.notification.request.content.data;

    // Clear badge when user interacts
    await this.clearBadgeCount();

    // Handle navigation based on notification type
    switch (data?.type) {
      case 'new_listing':
        console.log('🏠 Navigating to listing:', data.listingId);
        break;
      case 'price_change':
        console.log('💰 Navigating to price change:', data.listingId);
        break;
      case 'message':
        console.log('💬 Navigating to messages:', data.conversationId);
        break;
      case 'offer':
        console.log('📝 Navigating to offer:', data.offerId);
        break;
    }
  }

  /**
   * Update badge count
   */
  async updateBadgeCount(increment = 1) {
    try {
      const currentBadge = await Notifications.getBadgeCountAsync();
      const newBadge = Math.max(0, currentBadge + increment);
      await Notifications.setBadgeCountAsync(newBadge);
      console.log('🏷️ Badge count updated to:', newBadge);
    } catch (error) {
      console.error('❌ Error updating badge count:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount() {
    try {
      await Notifications.setBadgeCountAsync(0);
      console.log('🧹 Badge count cleared');
    } catch (error) {
      console.error('❌ Error clearing badge count:', error);
    }
  }

  /**
   * Sync badge with total unread
   */
  async syncBadgeWithTotalUnread(totalUnread) {
    try {
      console.log('🔄 Syncing device badge with total unread:', totalUnread);
      await Notifications.setBadgeCountAsync(totalUnread);
      console.log('✅ Device badge synced to:', totalUnread);
    } catch (error) {
      console.error('❌ Error syncing device badge:', error);
    }
  }

  /**
   * Get current badge count
   */
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Check notification permissions
   */
  async checkPermissions() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
      return 'undetermined';
    }
  }

  /**
   * Get notification status
   */
  async getNotificationStatus(userId) {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const permissionsGranted = status === 'granted';

      let pushToken = null;
      let appNotificationsEnabled = false;

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                         Constants?.easConfig?.projectId ||
                         'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';
        
              const token = await Notifications.getExpoPushTokenAsync({ projectId });
              pushToken = token.data;
      } catch (error) {
        console.log('⚠️ Could not get push token:', error.message);
      }

      if (userId) {
        try {
          const userRef = doc(db, 'Users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            appNotificationsEnabled = userData.AppNotificationsEnabled === true;
          }
        } catch (error) {
          console.log('⚠️ Could not check user document:', error);
        }
      }

      let badgeCount = 0;
      try {
        badgeCount = await Notifications.getBadgeCountAsync();
      } catch (error) {
        console.log('⚠️ Could not get badge count:', error);
      }

      return {
        permissionsGranted,
        pushToken,
        badgeCount,
        appNotificationsEnabled
      };
    } catch (error) {
      console.error('❌ Error getting notification status:', error);
      return {
        permissionsGranted: false,
        pushToken: null,
        badgeCount: 0,
        appNotificationsEnabled: false
      };
    }
  }

  /**
   * Test notification delivery
   */
  async testNotificationDelivery() {
    try {
      console.log('🧪 Testing notification delivery...');
      
      const { status } = await Notifications.getPermissionsAsync();
      console.log('📱 Notification permissions:', status);

      const badgeCount = await Notifications.getBadgeCountAsync();
      console.log('🏷️ Current badge count:', badgeCount);

      try {
        const token = await Notifications.getExpoPushTokenAsync();
        console.log('🔑 Device push token exists:', !!token.data);
      } catch (err) {
        console.log('⚠️ Could not get push token for test');
      }

      console.log('✅ Notification delivery test completed');
    } catch (error) {
      console.error('❌ Error testing notification delivery:', error);
    }
  }

  /**
   * Log notification status for debugging
   */
  async logNotificationStatus() {
    try {
      console.log('📊 NOTIFICATION STATUS REPORT');
      console.log('================================');

      const { status } = await Notifications.getPermissionsAsync();
      console.log('📱 Permissions:', status);

      const badgeCount = await Notifications.getBadgeCountAsync();
      console.log('🏷️ Badge count:', badgeCount);

      console.log('🔧 Service initialized:', this.isInitialized);
      console.log('🔧 Device module available:', !!Device);
      console.log('🔧 Constants module available:', !!Constants);

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                         Constants?.easConfig?.projectId ||
                         'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';
        
        const token = await Notifications.getExpoPushTokenAsync({ projectId });
        console.log('🔑 Push token exists:', !!token.data);
        console.log('🔑 Token preview:', token.data.substring(0, 20) + '...');
      } catch (err) {
        console.log('⚠️ Could not get push token for status report:', err.message);
      }

      console.log('================================');
    } catch (error) {
      console.error('❌ Error logging notification status:', error);
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.subscriptions) {
      this.subscriptions.forEach((subscription) => {
        subscription.remove();
      });
      this.subscriptions = [];
    }
    this.isInitialized = false;
  }
}

export const deviceNotificationService = DeviceNotificationService.getInstance();
export default deviceNotificationService;

