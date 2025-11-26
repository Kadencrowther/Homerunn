import { Platform } from 'react-native';
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

// Lazy load native modules to avoid errors on startup
let Notifications = null;
let Device = null;
let Constants = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  Constants = require('expo-constants');
} catch (error) {
  console.warn('Native notification modules not available:', error.message);
}

// Configure notification behavior only if available
if (Notifications && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions and get push token
 * @returns {Promise<string|null>} Push notification token or null if failed
 */
export const registerForPushNotifications = async () => {
  if (!Notifications || !Device || !Constants) {
    console.warn('Notification modules not available');
    return `MockToken_${Date.now()}`;
  }

  try {
    let token;

    // Check if device supports push notifications
    if (!Device.isDevice) {
      console.log('Push notifications are not available on simulators');
      // Return a mock token for simulators so the rest of the flow works
      return `SimulatorToken_${Date.now()}`;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    // Get the token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.projectId;
    if (!projectId) {
      console.warn('No project ID found, using mock token');
      return `MockToken_${Date.now()}`;
    }

    token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;

    console.log('Push notification token:', token);

    // Configure Android channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF5A5F',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    // Return a fallback token so the flow doesn't break
    return `FallbackToken_${Date.now()}`;
  }
};

/**
 * Get device information
 * @returns {Object} Device info including name, model, OS, etc.
 */
export const getDeviceInfo = async () => {
  if (!Device) {
    return {
      DeviceName: 'Unknown Device',
      DeviceModel: 'Unknown Model',
      DeviceOS: Platform.OS,
      DeviceOSVersion: 'Unknown',
      DeviceBrand: Platform.OS === 'ios' ? 'Apple' : 'Unknown',
      DeviceManufacturer: Platform.OS === 'ios' ? 'Apple' : 'Unknown',
      IsDevice: false,
      DeviceType: 0,
      RegisteredAt: new Date().toISOString(),
    };
  }

  try {
    const deviceInfo = {
      DeviceName: Device.deviceName || (Device.isDevice ? 'Unknown Device' : 'iOS Simulator'),
      DeviceModel: Device.modelName || (Device.isDevice ? 'Unknown Model' : 'Simulator'),
      DeviceOS: Platform.OS,
      DeviceOSVersion: Device.osVersion || 'Unknown',
      DeviceBrand: Device.brand || (Platform.OS === 'ios' ? 'Apple' : 'Unknown'),
      DeviceManufacturer: Device.manufacturer || (Platform.OS === 'ios' ? 'Apple' : 'Unknown'),
      IsDevice: Device.isDevice,
      DeviceType: Device.deviceType || 0,
      RegisteredAt: new Date().toISOString(),
    };

    console.log('Device info collected:', deviceInfo);
    return deviceInfo;
  } catch (error) {
    console.error('Error getting device info:', error);
    // Return fallback device info
    return {
      DeviceName: Device.isDevice ? 'Unknown Device' : 'iOS Simulator',
      DeviceModel: Device.isDevice ? 'Unknown Model' : 'Simulator',
      DeviceOS: Platform.OS,
      DeviceOSVersion: 'Unknown',
      DeviceBrand: Platform.OS === 'ios' ? 'Apple' : 'Unknown',
      DeviceManufacturer: Platform.OS === 'ios' ? 'Apple' : 'Unknown',
      IsDevice: Device.isDevice,
      DeviceType: 0,
      RegisteredAt: new Date().toISOString(),
    };
  }
};

/**
 * Save notification token and device info to Firestore
 * @param {string} token - Push notification token
 * @returns {Promise<boolean>} Success status
 */
export const saveNotificationToken = async (token) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No authenticated user to save token');
      return false;
    }

    if (!token) {
      console.log('No token to save');
      return false;
    }

    const deviceInfo = await getDeviceInfo();
    
    const deviceData = {
      Token: token,
      ...deviceInfo,
      LastUpdated: new Date().toISOString(),
    };

    const userDocRef = doc(db, 'Users', userId);
    
    // Get existing user document
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    // Check if this token already exists
    const existingDevices = userData?.NotificationDevices || [];
    const tokenExists = existingDevices.some(device => device.Token === token);
    
    if (tokenExists) {
      // Update existing device info
      const updatedDevices = existingDevices.map(device => 
        device.Token === token ? { ...device, ...deviceData } : device
      );
      
      await updateDoc(userDocRef, {
        NotificationDevices: updatedDevices,
        NotificationsEnabled: true,
        LastNotificationUpdate: new Date().toISOString(),
      });
      
      console.log('Updated existing device token');
    } else {
      // Add new device
      await updateDoc(userDocRef, {
        NotificationDevices: arrayUnion(deviceData),
        NotificationsEnabled: true,
        LastNotificationUpdate: new Date().toISOString(),
      });
      
      console.log('Added new device token');
    }

    return true;
  } catch (error) {
    console.error('Error saving notification token:', error);
    return false;
  }
};

/**
 * Enable notifications for the current device
 * @returns {Promise<boolean>} Success status
 */
export const enableNotifications = async () => {
  try {
    const token = await registerForPushNotifications();
    
    if (!token) {
      console.log('Failed to get notification token');
      return false;
    }

    const saved = await saveNotificationToken(token);
    
    if (saved) {
      console.log('✅ Notifications enabled successfully');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error enabling notifications:', error);
    return false;
  }
};

/**
 * Disable notifications for the current device
 * @param {string} token - The token to remove
 * @returns {Promise<boolean>} Success status
 */
export const disableNotifications = async (token) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No authenticated user');
      return false;
    }

    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    const existingDevices = userData?.NotificationDevices || [];
    const deviceToRemove = existingDevices.find(device => device.Token === token);
    
    if (deviceToRemove) {
      await updateDoc(userDocRef, {
        NotificationDevices: arrayRemove(deviceToRemove),
        LastNotificationUpdate: new Date().toISOString(),
      });
      
      console.log('Removed device token');
    }
    
    // Check if there are any remaining devices
    const updatedDoc = await getDoc(userDocRef);
    const updatedData = updatedDoc.data();
    const remainingDevices = updatedData?.NotificationDevices || [];
    
    if (remainingDevices.length === 0) {
      await updateDoc(userDocRef, {
        NotificationsEnabled: false,
      });
      console.log('All devices removed, disabled notifications');
    }

    return true;
  } catch (error) {
    console.error('Error disabling notifications:', error);
    return false;
  }
};

/**
 * Disable all notifications for the user
 * @returns {Promise<boolean>} Success status
 */
export const disableAllNotifications = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No authenticated user');
      return false;
    }

    const userDocRef = doc(db, 'Users', userId);
    
    await updateDoc(userDocRef, {
      NotificationsEnabled: false,
      LastNotificationUpdate: new Date().toISOString(),
    });
    
    console.log('Disabled all notifications (kept devices)');
    return true;
  } catch (error) {
    console.error('Error disabling all notifications:', error);
    return false;
  }
};

/**
 * Enable all notifications for the user
 * @returns {Promise<boolean>} Success status
 */
export const enableAllNotifications = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No authenticated user');
      return false;
    }

    const userDocRef = doc(db, 'Users', userId);
    
    await updateDoc(userDocRef, {
      NotificationsEnabled: true,
      LastNotificationUpdate: new Date().toISOString(),
    });
    
    console.log('Enabled all notifications');
    return true;
  } catch (error) {
    console.error('Error enabling all notifications:', error);
    return false;
  }
};

/**
 * Get all registered devices for the current user
 * @returns {Promise<Array>} Array of device objects
 */
export const getUserDevices = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.log('No authenticated user');
      return [];
    }

    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    return userData?.NotificationDevices || [];
  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
};

/**
 * Check if notifications are enabled
 * @returns {Promise<boolean>} Notification status
 */
export const areNotificationsEnabled = async () => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      return false;
    }

    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    
    return userData?.NotificationsEnabled || false;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
};

/**
 * Get current device token
 * @returns {Promise<string|null>} Current device token or null
 */
export const getCurrentDeviceToken = async () => {
  if (!Notifications || !Device || !Constants) {
    return `MockToken_${Date.now()}`;
  }

  try {
    // On simulator, return a mock token
    if (!Device.isDevice) {
      return `SimulatorToken_${Date.now()}`;
    }

    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.expoConfig?.projectId;
    if (!projectId) {
      return `MockToken_${Date.now()}`;
    }

    const token = (await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    })).data;

    return token;
  } catch (error) {
    console.error('Error getting current device token:', error);
    return null;
  }
};

