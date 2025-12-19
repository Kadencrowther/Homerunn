# 🐛 Debugging Hotdeck Notifications

## Issue: No notifications showing up when hotdeck is sent

### What I've Added:

1. **Enhanced Logging** - Added `[HOTDECK LISTENER]` and `[HOTDECK NOTIFICATION]` tags to all console logs
2. **Detailed Debug Info** - Now logs:
   - Connection status
   - Agent ID
   - Listener setup
   - Snapshot events
   - SharedAt timestamps
   - Whether hotdeck is considered "new"

---

## Steps to Debug:

### 1. **Check Console for Listener Startup**

Look for these logs when you sign in:

```
🔔 [HOTDECK LISTENER] Starting for user: lWQZOltrYqTE1vdEO6oCf4kqiSQ2
🔍 [HOTDECK LISTENER] Connection found: {...}
✅ [HOTDECK LISTENER] Found agent connection: WbbpEmGOkqSVaU4NPzzrxDZFwwx2
👤 [HOTDECK LISTENER] Agent name: Kaden Crowther
📅 [HOTDECK LISTENER] Initial check time set: 2025-12-18T...
🎯 [HOTDECK LISTENER] Setting up listener on path: AgentUsers/WbbpEmGOkqSVaU4NPzzrxDZFwwx2/HotDecks
✅ [HOTDECK LISTENER] Listener active and waiting for new hotdecks!
```

### 2. **When You Send a Hotdeck**

You should see:

```
📊 [HOTDECK LISTENER] Snapshot received!
📊 [HOTDECK LISTENER] Total docs: 1
📊 [HOTDECK LISTENER] Doc changes: 1
🔄 [HOTDECK LISTENER] Change type: added
📦 [HOTDECK LISTENER] Hotdeck data: {...}
⏰ [HOTDECK LISTENER] SharedAt: 2025-12-18T...
⏰ [HOTDECK LISTENER] Check time: 2025-12-18T...
⏰ [HOTDECK LISTENER] Is new? true/false
```

### 3. **If It's NEW**

```
🆕 [HOTDECK LISTENER] NEW HOTDECK DETECTED: HOTDECKS
📝 [HOTDECK NOTIFICATION] Creating notification for hotdeck: HOTDECKS
✅ [HOTDECK NOTIFICATION] Notification created successfully in Firestore!
```

---

## Possible Issues & Solutions:

### ❌ **Issue 1: Listener not starting**

**Symptoms:**
- No `[HOTDECK LISTENER]` logs at all

**Solution:**
- Check if NotificationProvider is wrapping your app
- Check if user is signed in
- Check terminal logs for errors

### ❌ **Issue 2: Connection not found**

**Symptoms:**
```
⚠️ [HOTDECK LISTENER] No connection found at all
```

**Solution:**
- User needs to have an agent connection
- Check `AgentConnections` collection for a record where `UserId === currentUserId`
- Status should be "Accepted"

### ❌ **Issue 3: Hotdeck marked as "existing" not "new"**

**Symptoms:**
```
📋 [HOTDECK LISTENER] Existing hotdeck (skipping): HOTDECKS
⏰ [HOTDECK LISTENER] Is new? false
```

**Why this happens:**
- The hotdeck's `SharedAt` timestamp is BEFORE the listener started
- This prevents duplicate notifications for hotdecks that already exist

**Solution:**
- The listener only notifies for hotdecks sent AFTER the app starts
- To test: Close app → Reopen app → Agent sends NEW hotdeck
- **OR** use the manual test below

---

## 🧪 Manual Test Function

Add this to your app temporarily to test notifications:

```javascript
// In NotificationProvider or anywhere accessible
window.testHotdeckNotification = async () => {
  const userId = 'lWQZOltrYqTE1vdEO6oCf4kqiSQ2'; // Your test user
  const agentId = 'WbbpEmGOkqSVaU4NPzzrxDZFwwx2'; // Your test agent
  
  await notificationsService.CreateNotification(userId, {
    type: 'hotdeck_received',
    title: '🏠 New Hot Deck from Your Agent',
    body: 'TEST - Kaden Crowther sent you "Test Deck"',
    data: {
      hotdeckId: 'test123',
      agentId: agentId,
      deckName: 'Test Deck',
      propertyCount: 5,
      timestamp: new Date().toISOString()
    }
  });
  
  console.log('✅ Test notification created!');
};

// Then in console run:
testHotdeckNotification();
```

---

## 🔍 Check Firestore Directly

### Check if notifications are being created:

1. Open Firebase Console
2. Go to Firestore
3. Navigate to: `Users/{userId}/Notifications`
4. Look for documents with `Type: "hotdeck_received"`

If you see notifications there but not in the app, it's a display issue.
If you don't see them, it's a creation issue.

---

## 🎯 Next Steps:

1. **Reload your app** (to get the new logging)
2. **Check console** for `[HOTDECK LISTENER]` messages
3. **Send a test hotdeck** (after app loads)
4. **Share console output** with me

The enhanced logging will tell us exactly where it's failing!

