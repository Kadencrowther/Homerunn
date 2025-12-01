# 🔔 Notification Debugging Guide for App Store Build

## 🚨 Issues Fixed

1. ✅ Fixed `expo-constants` and `expo-device` import issues
2. ✅ Added correct EAS project ID (`c9d6dcde-524c-4058-b8d0-2ba7c32d1219`)
3. ✅ Improved error logging with detailed messages
4. ✅ Added fallback values for all device info

## 📱 How to View Logs on Production (App Store Build)

### Method 1: Real Device Console Logs (RECOMMENDED)

**Using Mac Terminal:**
```bash
# Stream logs from your iPhone to Terminal
log stream --predicate 'processImagePath contains "Homerunn"' --level debug

# Or simpler version:
log stream --process Homerunn

# Save logs to a file for analysis:
log stream --process Homerunn > homerunn_logs.txt
```

**Using Xcode Console:**
1. Connect iPhone to Mac via USB
2. Open **Xcode**
3. **Window** → **Devices and Simulators**
4. Select your iPhone
5. Click **"Open Console"**
6. Filter by "Homerunn"
7. Look for notification-related logs with emojis:
   - `📱 Getting push token with projectId:`
   - `✅ Got Expo Push Token:`
   - `❌ Failed to get push token:`
   - `💾 Token saved locally`

### Method 2: Remote Logging to Firestore

Your app now has a `RemoteLogger` utility. To view logs remotely:

1. Go to Firebase Console
2. Navigate to **Firestore Database**
3. Look for the `AppLogs` collection
4. Filter by timestamp to see recent logs

**Usage in code:**
```javascript
import RemoteLogger from '../utils/remoteLogger';

RemoteLogger.info('User enabled notifications', { userId: 'abc123' });
RemoteLogger.error('Failed to get token', { error: err.message });
```

### Method 3: iOS Settings App

Check notification status:
1. Open **Settings** app on iPhone
2. Scroll to **Homerunn**
3. Tap **Notifications**
4. Verify **"Allow Notifications"** is ON
5. Check that banners/sounds/badges are enabled

## 🔍 What to Look For

### Success Indicators:
```
✅ Got Expo Push Token: ExponentPushToken[xxxxxxxxxxxxxx]
💾 Token saved locally
✅ Device token saved successfully
📱 Device push token: ExponentPushToken[...]
```

### Error Indicators:
```
❌ Failed to get push token: [error message]
❌ Error registering for push notifications
⚠️ Notification permissions not granted
⚠️ Push notifications only work on physical devices
```

## 🧪 Testing Notifications

### From Your App:
1. Sign in to your account
2. Go to **Profile** → **Settings**
3. Tap **Notifications**
4. Tap **"Enable on This Device"**
5. Watch the console logs for token generation

### Debug Functions (Development Only):

Open your app and in the console, run:
```javascript
// Check notification status
debugNotifications()

// Test delivery
testNotificationDelivery()

// Sync badge count
syncBadgeCount()
```

### Manual Test via Expo Push Tool:

1. Get your token from logs (format: `ExponentPushToken[...]`)
2. Go to https://expo.dev/notifications
3. Paste your token
4. Enter a title and message
5. Click **"Send a Notification"**
6. Check if notification appears on device

## 🔧 Common Issues & Solutions

### Issue 1: No Token Generated
**Symptoms:** `❌ Failed to get push token`

**Solutions:**
- Make sure you're on a **physical device** (not simulator)
- Check notification permissions in iOS Settings
- Rebuild the app with `eas build --platform ios --profile production`
- Ensure all expo packages are up to date

### Issue 2: Token Generated But No Notifications
**Symptoms:** Token exists but notifications don't arrive

**Solutions:**
- Check `AppNotificationsEnabled` field in Firestore Users collection
- Verify token is saved in `DevicePushNotificationIDs` array
- Test with Expo push tool to isolate issue
- Check if APNs certificates are valid in Apple Developer

### Issue 3: Permissions Denied
**Symptoms:** `⚠️ Notification permissions not granted`

**Solutions:**
- Delete app and reinstall to reset permissions
- Check iOS Settings → Homerunn → Notifications
- Request permissions again from app settings

### Issue 4: Module Not Found Errors
**Symptoms:** `No native ExponentConstants module found`

**Solutions:**
- Run `npx expo install expo-constants expo-device`
- Delete `node_modules` and reinstall: `npm install`
- Rebuild with `eas build`
- Check that plugins are in `app.json`:
  ```json
  "plugins": [
    "expo-notifications",
    "expo-dev-client"
  ]
  ```

## 📊 Firestore Data Structure

**Users Collection → User Document:**
```javascript
{
  AppNotificationsEnabled: true,
  DeviceNotificationToken: "ExponentPushToken[...]",
  DevicePushNotificationIDs: [
    {
      Token: "ExponentPushToken[...]",
      DeviceId: "ios-123456-abc",
      DeviceName: "iPhone 15 Pro",
      ModelName: "iPhone15,2",
      Platform: "ios",
      AddedAt: Timestamp,
      LastUpdatedAt: Timestamp
    }
  ]
}
```

## 🚀 Rebuilding for App Store

After these fixes, rebuild your app:

```bash
# Build for production
eas build --platform ios --profile production

# Or if you want to test first
eas build --platform ios --profile preview
```

## 📞 Still Having Issues?

Check logs in this order:
1. **Xcode Console** - Real-time device logs
2. **Firestore AppLogs** - Remote logs
3. **Terminal stream** - System-level logs

Look for the emoji indicators:
- 📱 = Token operations
- ✅ = Success
- ❌ = Error
- ⚠️ = Warning
- 💾 = Storage operations
- 🔧 = Configuration

## 📝 Key Files Changed

1. `src/services/NotificationService.js` - Main notification logic
2. `src/services/deviceNotificationService.js` - Device-specific operations
3. `src/utils/remoteLogger.js` - Remote logging utility
4. `app.json` - Contains EAS project ID

## 🎯 Next Steps

1. ✅ Code has been fixed
2. 🔄 Test in development build first
3. 🏗️ Build new version for App Store
4. 📱 Install on device and check logs
5. 🔔 Test notifications thoroughly
6. 🚀 Submit to App Store

---

**Last Updated:** December 1, 2025
**Version:** 3.1.3

