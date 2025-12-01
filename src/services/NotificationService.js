import { Platform } from 'react-native';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Notifications from 'expo-notifications';

// Import native modules
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * EXPO NOTIFICATIONS SERVICE
 * 
 * Uses expo-notifications to get REAL native push tokens from APNS (iOS) / FCM (Android)
 * Tokens are in format: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 */

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Get device information using expo-device
 * @returns {Promise<Object>} Device info object
 */
export const getDeviceInfo = async () => {
  try {
    const deviceName = Device?.deviceName || `${Platform.OS} Device`;
    const modelName = Device?.modelName || 'Unknown Model';
    const osName = Device?.osName || Platform.OS;
    const osVersion = Device?.osVersion || String(Platform.Version);
    const brand = Device?.brand || (Platform.OS === 'ios' ? 'Apple' : 'Unknown');
    const manufacturer = Device?.manufacturer || brand;
    
    return {
      DeviceName: deviceName,
      DeviceModel: modelName,
      DeviceOS: Platform.OS,
      DeviceOSVersion: osVersion,
      DeviceBrand: brand,
      DeviceManufacturer: manufacturer,
      IsDevice: Device?.isDevice ?? true,
      DeviceType: Device?.deviceType === Device?.DeviceType?.PHONE ? 'PHONE' : 
                  Device?.deviceType === Device?.DeviceType?.TABLET ? 'TABLET' : 'PHONE',
    };
  } catch (error) {
    console.error('Error getting device info:', error);
    return {
      DeviceName: `${Platform.OS} Device`,
      DeviceModel: 'Unknown',
      DeviceOS: Platform.OS,
      DeviceOSVersion: String(Platform.Version),
      DeviceBrand: Platform.OS === 'ios' ? 'Apple' : 'Android',
      DeviceManufacturer: Platform.OS === 'ios' ? 'Apple' : 'Unknown',
      IsDevice: true,
      DeviceType: 'PHONE',
    };
  }
};

/**
 * Request notification permissions and get REAL Expo Push Token
 * @returns {Promise<Object>} Permission status and token
 */
export const registerForPushNotifications = async () => {
  console.log('🔔 Requesting notification permissions...');
  
  try {
    // Check if running on a real device
    if (!Device?.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices, not simulators');
      return {
        status: 'simulator',
        token: null,
      };
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // If not granted, request permissions
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // If still not granted, return denied
    if (finalStatus !== 'granted') {
      console.warn('❌ Notification permission denied');
      return {
        status: 'denied',
        token: null,
      };
    }

    // Get project ID from app.json/eas.json
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                     Constants?.easConfig?.projectId ||
                     'c9d6dcde-524c-4058-b8d0-2ba7c32d1219'; // Your Homerunn project ID

    console.log('📱 Getting push token with projectId:', projectId?.substring(0, 8) + '...');

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      const token = tokenData.data;
      console.log('✅ Got Expo Push Token:', token);

      return {
        status: 'granted',
        token: token,
      };
    } catch (tokenError) {
      console.error('❌ Failed to get push token:', tokenError.message);
      console.error('Full error:', tokenError);
      
      return {
        status: 'error',
        token: null,
        error: tokenError.message,
      };
    }
  } catch (error) {
    console.error('❌ Error requesting permissions:', error);
    return {
      status: 'error',
      token: null,
    };
  }
};

/**
 * Save notification token and device info to Firestore
 * @param {string} userId - User ID
 * @param {string} token - Notification token
 * @param {Object} deviceData - Device information
 * @returns {Promise<boolean>} Success status
 */
export const saveNotificationToken = async (userId, token, deviceData) => {
  if (!userId) {
    console.error('User ID is required to save notification token.');
    return false;
  }
  if (!token) {
    console.error('Notification token is required.');
    return false;
  }

  try {
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      let notificationDevices = userData.DevicePushNotificationIDs || [];  // Use NEW field

      // Generate a simple device ID based on token
      const deviceId = `device-${Date.now()}-${token.substring(token.length - 8)}`;
      
      // Remove existing device with the same token if it exists
      notificationDevices = notificationDevices.filter(d => d.Token !== token);

      // Add the new device info (match format from deviceNotificationService)
      notificationDevices.push({
        Token: token,
        DeviceId: deviceId,  // Add DeviceId for consistency
        DeviceName: deviceData.DeviceName,
        ModelName: deviceData.DeviceModel,  // Map to ModelName for consistency
        Platform: deviceData.DeviceOS,  // Map to Platform for consistency
        DeviceBrand: deviceData.DeviceBrand,
        DeviceManufacturer: deviceData.DeviceManufacturer,
        IsDevice: deviceData.IsDevice,
        DeviceType: deviceData.DeviceType,
        AddedAt: new Date(),  // Use Date object for Firestore timestamp
        LastUpdatedAt: new Date(),  // Use Date object for Firestore timestamp
        // Keep old fields for backward compatibility
        DeviceModel: deviceData.DeviceModel,
        DeviceOS: deviceData.DeviceOS,
        DeviceOSVersion: deviceData.DeviceOSVersion,
        RegisteredAt: new Date().toISOString(),
        LastUpdated: new Date().toISOString(),
      });

      await updateDoc(userDocRef, {
        DevicePushNotificationIDs: notificationDevices,  // Use NEW field
        AppNotificationsEnabled: true,  // Use NEW field
        DeviceNotificationToken: token,  // Also set this for easy access
        LastNotificationUpdate: new Date().toISOString(),
      });
      
      console.log('✅ Notification token and device info saved successfully!');
      return true;
    } else {
      console.error('User document not found for ID:', userId);
      return false;
    }
  } catch (error) {
    console.error('❌ Error saving notification token:', error);
    return false;
  }
};

/**
 * Get all registered devices for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of device objects
 */
export const getRegisteredDevices = async (userId) => {
  if (!userId) {
    console.error('User ID is required.');
    return [];
  }

  try {
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Use NEW field name: DevicePushNotificationIDs (PascalCase)
      return userData.DevicePushNotificationIDs || [];
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error fetching registered devices:', error);
    return [];
  }
};

/**
 * Remove a device token from Firestore
 * @param {string} userId - User ID
 * @param {string} token - Token to remove
 * @returns {Promise<boolean>} Success status
 */
export const removeDeviceToken = async (userId, token) => {
  if (!userId || !token) {
    console.error('User ID and token are required.');
    return false;
  }

  try {
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      let notificationDevices = userData.DevicePushNotificationIDs || [];  // Use NEW field

      // Remove device with matching token
      notificationDevices = notificationDevices.filter(d => d.Token !== token);

      await updateDoc(userDocRef, {
        DevicePushNotificationIDs: notificationDevices,  // Use NEW field
        AppNotificationsEnabled: notificationDevices.length > 0,  // Use NEW field
        DeviceNotificationToken: notificationDevices.length > 0 ? notificationDevices[0].Token : null,
        LastNotificationUpdate: new Date().toISOString(),
      });

      console.log('✅ Device token removed successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error removing device token:', error);
    return false;
  }
};

/**
 * Enable notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const enableNotifications = async (userId) => {
  if (!userId) {
    console.error('User ID is required.');
    return false;
  }

  try {
    // Get permission and token
    const { status, token } = await registerForPushNotifications();
    
    if (status !== 'granted' || !token) {
      console.warn('Notification permission denied or token not available');
      return false;
    }

    // Get device info
    const deviceData = await getDeviceInfo();
    
    // Save to Firestore
    const saved = await saveNotificationToken(userId, token, deviceData);
    
    return saved;
  } catch (error) {
    console.error('❌ Error enabling notifications:', error);
    return false;
  }
};

/**
 * Disable notifications for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Success status
 */
export const disableNotifications = async (userId) => {
  if (!userId) {
    console.error('User ID is required.');
    return false;
  }

  try {
    const userDocRef = doc(db, 'Users', userId);
    await updateDoc(userDocRef, {
      AppNotificationsEnabled: false,  // Use NEW field name
      LastNotificationUpdate: new Date().toISOString(),
    });

    console.log('✅ Notifications disabled successfully');
    return true;
  } catch (error) {
    console.error('❌ Error disabling notifications:', error);
    return false;
  }
};

/**
 * Check if notifications are enabled for a user
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Enabled status
 */
export const areNotificationsEnabled = async (userId) => {
  if (!userId) return false;

  try {
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      // Use NEW field name: AppNotificationsEnabled (PascalCase)
      return userData.AppNotificationsEnabled || false;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking notification status:', error);
    return false;
  }
};

/**
 * Get push tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<string[]>} Array of push tokens
 */
export const getPushTokensForUser = async (userId) => {
  console.log('🔍 Looking up push tokens for user:', userId);

  try {
    const userRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('❌ User document not found');
      return [];
    }

    const userData = userDoc.data();

    // Check if notifications are enabled
    if (userData.AppNotificationsEnabled !== true) {
      console.log('⚠️ AppNotificationsEnabled is false, skipping notifications');
      return [];
    }

    // Get tokens from DevicePushNotificationIDs array
    const deviceTokens = userData.DevicePushNotificationIDs || [];
    const tokens = deviceTokens
      .filter((device) => device && device.Token)
      .map((device) => device.Token);

    console.log('✅ Found', tokens.length, 'active device token(s)');
    return tokens;
  } catch (error) {
    console.error('❌ Error getting push tokens:', error);
    return [];
  }
};

/**
 * Send a push notification to a user
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @param {number} badge - Badge count
 * @returns {Promise<boolean>} Success status
 */
export const sendNotificationToUser = async (userId, title, body, data = {}, badge) => {
  console.log('📨 Sending notification to user:', userId);

  try {
    const pushTokens = await getPushTokensForUser(userId);

    if (pushTokens.length === 0) {
      console.log('❌ User has no push tokens');
      return false;
    }

    console.log('📨 Sending notification to', pushTokens.length, 'device(s) via Expo API...');

    // Create notification messages for all devices
    const messages = pushTokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      badge: badge,
      priority: 'default',
      ttl: 86400, // 24 hours
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    console.log('📨 Expo API response status:', response.status);

    if (response.ok) {
      const responseData = await response.json();
      console.log('✅ Notification sent successfully to', pushTokens.length, 'devices:', responseData);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send notification:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
};

/**
 * Send notifications to multiple users
 * @param {string[]} userIds - Array of user IDs
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {Object} data - Additional data
 * @param {number} badge - Badge count
 * @returns {Promise<{successes: number, failures: number}>} Results
 */
export const sendNotificationToMultipleUsers = async (userIds, title, body, data = {}, badge) => {
  console.log('📢 Sending notification to', userIds.length, 'users');

  try {
    // Get push tokens for all users
    const tokens = [];
    for (const userId of userIds) {
      const userTokens = await getPushTokensForUser(userId);
      tokens.push(...userTokens);
    }

    if (tokens.length === 0) {
      console.log('❌ No push tokens found for any users');
      return { successes: 0, failures: userIds.length };
    }

    console.log('📢 Sending to', tokens.length, 'total devices across', userIds.length, 'users');

    // Send notifications to all tokens
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: data,
      badge: badge,
      priority: 'default',
      ttl: 86400,
    }));

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`✅ Notification sent to ${tokens.length} devices across ${userIds.length} users:`, responseData);
      return { successes: userIds.length, failures: 0 };
    } else {
      const errorText = await response.text();
      console.error('❌ Failed to send notifications:', response.status, errorText);
      return { successes: 0, failures: userIds.length };
    }
  } catch (error) {
    console.error('❌ Error sending notifications to multiple users:', error);
    return { successes: 0, failures: userIds.length };
  }
};

/**
 * Send notification for new listing
 * @param {string[]} userIds - Array of user IDs to notify
 * @param {Object} listing - Listing data
 * @returns {Promise<boolean>} Success status
 */
export const sendNewListingNotification = async (userIds, listing) => {
  const title = 'New Listing Available';
  const body = `${listing.address} - $${listing.price.toLocaleString()}`;
  const data = {
    type: 'new_listing',
    listingId: listing.id,
  };

  return await sendNotificationToMultipleUsers(userIds, title, body, data);
};

/**
 * Send notification for price change
 * @param {string[]} userIds - Array of user IDs to notify
 * @param {Object} listing - Listing data
 * @param {number} oldPrice - Old price
 * @param {number} newPrice - New price
 * @returns {Promise<boolean>} Success status
 */
export const sendPriceChangeNotification = async (userIds, listing, oldPrice, newPrice) => {
  const priceChange = newPrice - oldPrice;
  const changeText = priceChange > 0 ? `increased` : `decreased`;
  
  const title = 'Price Change Alert';
  const body = `${listing.address} price ${changeText} to $${newPrice.toLocaleString()}`;
  const data = {
    type: 'price_change',
    listingId: listing.id,
    oldPrice: oldPrice,
    newPrice: newPrice,
  };

  return await sendNotificationToMultipleUsers(userIds, title, body, data);
};

/**
 * Send notification for new message
 * @param {string} recipientUserId - Recipient user ID
 * @param {string} senderName - Sender name
 * @param {string} messagePreview - Message preview
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<boolean>} Success status
 */
export const sendMessageNotification = async (recipientUserId, senderName, messagePreview, conversationId) => {
  const title = `New message from ${senderName}`;
  const body = messagePreview;
  const data = {
    type: 'message',
    conversationId: conversationId,
    senderName: senderName,
  };

  return await sendNotificationToUser(recipientUserId, title, body, data);
};

/**
 * Send notification for new offer
 * @param {string} userId - User ID to notify
 * @param {Object} offer - Offer data
 * @returns {Promise<boolean>} Success status
 */
export const sendOfferNotification = async (userId, offer) => {
  const title = 'New Offer Received';
  const body = `You received an offer of $${offer.amount.toLocaleString()} on ${offer.listingAddress}`;
  const data = {
    type: 'offer',
    offerId: offer.id,
    listingId: offer.listingId,
  };

  return await sendNotificationToUser(userId, title, body, data);
};
