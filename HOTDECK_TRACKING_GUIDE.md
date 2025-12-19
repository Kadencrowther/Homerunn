# Hotdeck Swipe & View Tracking Guide

## Overview

This guide explains how hotdeck swipe and view tracking works in the Homerunn app. The system tracks both **property views** (when a property appears as the top card) and **swipes** (user actions: left, right, up).

---

## 🎯 What Gets Tracked

### 1. **Property Views**
- Triggered when a property becomes the top card in the deck
- Tracked even if the user doesn't swipe
- Only counted once per property (uses `viewedPropertyIds` Set)

### 2. **Property Swipes**
- Left swipe: Dislike
- Right swipe: Like (saves to user's saved properties)
- Up swipe: Love (saves with special "loved" flag)

---

## 📊 Data Storage Locations

### Location 1: Hotdeck Document (Agent's View)
**Path:** `AgentUsers/{agentId}/HotDecks/{deckId}`

```javascript
{
  // Existing hotdeck fields...
  Name: "Downtown Condos",
  ClientId: "user123",
  AgentId: "agent456",
  
  // NEW: Client Activity Tracking
  ClientActivity: {
    // Overall counts
    TotalViewed: 12,        // Properties viewed (appeared as top card)
    TotalSwipes: 8,         // Total swipes (any direction)
    LeftSwipes: 3,          // Disliked
    RightSwipes: 4,         // Liked
    UpSwipes: 1,            // Loved
    
    // Per-property details
    PropertyActivity: {
      "property123": {
        Viewed: true,
        ViewedAt: Timestamp,
        SwipeAction: "right",  // "left", "right", "up", or null
        SwipedAt: Timestamp
      },
      "property456": {
        Viewed: true,
        ViewedAt: Timestamp,
        SwipeAction: null     // Viewed but not swiped
      }
    },
    
    LastActivityAt: Timestamp
  },
  
  LastViewedAt: Timestamp  // When client last opened this hotdeck
}
```

### Location 2: User's Global Swipe Tracking
**Path:** `Users/{userId}/SwipeCount/Current`

```javascript
{
  LeftSwipes: 45,        // ALL swipes (home + hotdecks)
  RightSwipes: 120,
  UpSwipes: 25,
  TotalSwipes: 190,
  
  // Breakdown by source
  HomeSwipes: 150,       // Swipes from HomeScreen
  HotdeckSwipes: 40,     // Swipes from all hotdecks
  
  LastUpdated: Timestamp
}
```

### Location 3: User's Match Metric (Optional)
**Path:** `Users/{userId}/UserMatchMetric/Current`

Only updated if the property has a `propertyMatchMetric` field. Updates the user's learning algorithm based on their preferences.

---

## 🔧 Implementation Details

### Files Modified

1. **`src/services/HotdeckService.js`**
   - Added `trackHotdeckPropertyView()` - tracks when properties are viewed
   - Added `trackHotdeckSwipe()` - tracks swipe actions
   - Added `getInitialClientActivity()` - helper to initialize tracking structure

2. **`src/screens/HotdeckViewScreen.js`**
   - Added `viewedPropertyIds` state to prevent duplicate view tracking
   - Added `useEffect` to track views when card index changes
   - Updated `handleSwipe` to call `trackHotdeckSwipe()`

3. **`firestore.rules`**
   - Updated HotDecks rules to allow clients to update their activity
   - Clients can only modify: `ClientActivity`, `LastViewedAt`, `LastActivityAt`
   - Agents retain full read/write access

---

## 📱 How It Works

### View Tracking Flow

```javascript
// 1. User opens hotdeck → properties load into deck
// 2. First property appears as top card (index 0)
// 3. useEffect triggers with currentIndex = 0
// 4. Check if property.id is NOT in viewedPropertyIds Set
// 5. If new → Add to Set and call trackHotdeckPropertyView()
// 6. Firestore update:
//    - Increment ClientActivity.TotalViewed
//    - Set PropertyActivity[propertyId].Viewed = true
//    - Set PropertyActivity[propertyId].ViewedAt = timestamp
```

### Swipe Tracking Flow

```javascript
// 1. User swipes card left/right/up
// 2. handleSwipe() is called with (cardIndex, direction)
// 3. Call trackHotdeckSwipe() with user, agent, deck, property, direction
// 4. Three Firestore writes happen:
//    a) Update hotdeck document (agent sees this)
//    b) Update user's SwipeCount (global stats)
//    c) Update user's MatchMetric (if property has metric)
```

---

## 🚀 Usage Examples

### Initialize New Hotdeck (Agent Side)

When creating a new hotdeck, initialize the tracking structure:

```javascript
import { getInitialClientActivity } from '../services/HotdeckService';

const newHotdeck = {
  Name: "My Hotdeck",
  ClientId: userId,
  AgentId: agentId,
  // ... other fields ...
  ClientActivity: getInitialClientActivity(),
  LastViewedAt: null
};

// Save to Firestore
const deckRef = doc(db, 'AgentUsers', agentId, 'HotDecks', deckId);
await setDoc(deckRef, newHotdeck);
```

### View Activity (Agent Dashboard)

Query and display client activity:

```javascript
import { getHotdeck } from '../services/HotdeckService';

const hotdeck = await getHotdeck(agentId, deckId);

console.log('Total properties viewed:', hotdeck.ClientActivity.TotalViewed);
console.log('Total swipes:', hotdeck.ClientActivity.TotalSwipes);
console.log('Liked properties:', hotdeck.ClientActivity.RightSwipes);

// See specific property activity
Object.entries(hotdeck.ClientActivity.PropertyActivity).forEach(([propId, activity]) => {
  if (activity.SwipeAction === 'right') {
    console.log(`Property ${propId} was liked at ${activity.SwipedAt}`);
  }
});
```

### Get User's Total Stats

```javascript
import { getUserSwipeCount } from '../utils/UserMatchMetric';

const swipeCount = await getUserSwipeCount(userId);

console.log('Total swipes across all sources:', swipeCount.TotalSwipes);
console.log('Swipes from home screen:', swipeCount.HomeSwipes);
console.log('Swipes from hotdecks:', swipeCount.HotdeckSwipes);
```

---

## 🔒 Security (Firestore Rules)

### Agent Permissions
```javascript
// Full read/write access to their own hotdecks
allow read, write: if request.auth.uid == userId;
```

### Client Permissions
```javascript
// Can read hotdecks shared with them
allow read: if resource.data.ClientId == request.auth.uid;

// Can only update activity fields
allow update: if resource.data.ClientId == request.auth.uid &&
              request.resource.data.diff(resource.data).affectedKeys()
                .hasOnly(['ClientActivity', 'LastViewedAt', 'LastActivityAt']);
```

This prevents clients from modifying:
- Hotdeck name
- Property list
- Agent information
- Any other fields

---

## 🎨 Future Enhancements

### Possible Features

1. **Time-based Analytics**
   - Track how long properties are viewed
   - Session duration tracking
   - Peak engagement times

2. **Agent Notifications**
   - Real-time alerts when client likes a property
   - Daily activity summaries
   - Engagement reminders

3. **Property Recommendations**
   - Use swipe patterns to suggest similar properties
   - Cross-hotdeck learning
   - Collaborative filtering

4. **Export Analytics**
   - Generate PDF reports for agents
   - Export to CRM systems
   - Share insights with clients

---

## 🐛 Troubleshooting

### Views Not Being Tracked

**Check:**
1. Is `currentIndex` updating correctly?
2. Is the property ID valid?
3. Check console logs for error messages
4. Verify Firestore rules allow client updates

**Debug:**
```javascript
console.log('Current index:', currentIndex);
console.log('Current property:', currentDeck[currentIndex]);
console.log('Viewed IDs:', Array.from(viewedPropertyIds));
```

### Swipes Not Being Tracked

**Check:**
1. Is user authenticated? (`auth.currentUser`)
2. Are `agentId` and `hotdeckId` defined?
3. Check network tab for Firestore requests
4. Verify SwipeCount document exists

**Debug:**
```javascript
console.log('User ID:', auth.currentUser?.uid);
console.log('Agent ID:', agentId);
console.log('Hotdeck ID:', hotdeckId);
```

### Permission Denied Errors

**Check:**
1. Firestore rules are deployed: `firebase deploy --only firestore:rules`
2. Client is updating only allowed fields
3. User is authenticated
4. `ClientId` matches authenticated user

---

## 📝 Summary

### Key Benefits

✅ **Real-time tracking** - Agent sees activity immediately  
✅ **Offline support** - Syncs when connection restored  
✅ **Per-property details** - See exactly which properties clients liked  
✅ **Global analytics** - User stats across all hotdecks  
✅ **Secure** - Clients can't modify hotdeck structure  
✅ **Simple** - Direct Firestore writes, no API needed  

### Data Flow

```
User views/swipes property
         ↓
HotdeckViewScreen detects action
         ↓
Calls tracking function
         ↓
Writes to Firestore (1-3 locations)
         ↓
Agent dashboard updates in real-time
```

---

## 🔗 Related Files

- `/src/services/HotdeckService.js` - Tracking functions
- `/src/screens/HotdeckViewScreen.js` - Client UI implementation
- `/src/utils/UserMatchMetric.js` - Global swipe tracking
- `/firestore.rules` - Security rules
- `/HOTDECK_TRACKING_GUIDE.md` - This guide

---

*Last Updated: December 18, 2024*

