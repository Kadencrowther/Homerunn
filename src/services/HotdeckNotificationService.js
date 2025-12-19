import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationsService } from './notificationsService';
import { getUserConnection } from './agentUserConnectionService';
import { getAgentUser } from './AgentUserService';
import * as Notifications from 'expo-notifications';

class HotdeckNotificationService {
  constructor() {
    this.unsubscribe = null;
    this.lastCheckedTimestamp = null;
    this.notifiedHotdecks = new Set(); // Track which hotdecks we've notified about
  }

  /**
   * Start listening for new hotdecks sent to the current user
   */
  async startListening(userId) {
    try {
      console.log('🔔 [HOTDECK LISTENER] Starting for user:', userId);

      // Get user's agent connection
      const connection = await getUserConnection(userId);
      
      console.log('🔍 [HOTDECK LISTENER] Connection found:', connection);
      
      if (!connection) {
        console.log('⚠️ [HOTDECK LISTENER] No connection found at all');
        return () => {};
      }
      
      if (connection.Status !== 'Accepted') {
        console.log('⚠️ [HOTDECK LISTENER] Connection status is:', connection.Status, '(need Accepted)');
        return () => {};
      }

      const agentId = connection.AgentId;
      console.log('✅ [HOTDECK LISTENER] Found agent connection:', agentId);

      // Get agent details for notifications
      const agent = await getAgentUser(agentId);
      const agentName = agent?.FirstName 
        ? `${agent.FirstName} ${agent.LastName}` 
        : 'Your Agent';

      console.log('👤 [HOTDECK LISTENER] Agent name:', agentName);

      // Set initial timestamp (only notify for NEW hotdecks after this point)
      if (!this.lastCheckedTimestamp) {
        this.lastCheckedTimestamp = new Date();
        console.log('📅 [HOTDECK LISTENER] Initial check time set:', this.lastCheckedTimestamp);
      } else {
        console.log('📅 [HOTDECK LISTENER] Using existing check time:', this.lastCheckedTimestamp);
      }

      // Create listener on agent's HotDecks where ClientId matches
      const hotdecksRef = collection(db, 'AgentUsers', agentId, 'HotDecks');
      const q = query(
        hotdecksRef,
        where('ClientId', '==', userId),
        where('Status', '==', 'active')
      );

      console.log('🎯 [HOTDECK LISTENER] Setting up listener on path:', `AgentUsers/${agentId}/HotDecks`);
      console.log('🎯 [HOTDECK LISTENER] Filtering for ClientId:', userId);

      // Set up real-time listener
      this.unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          console.log('📊 [HOTDECK LISTENER] Snapshot received!');
          console.log('📊 [HOTDECK LISTENER] Total docs:', snapshot.size);
          console.log('📊 [HOTDECK LISTENER] Doc changes:', snapshot.docChanges().length);
          
          // Process only NEW or MODIFIED documents (to catch draft->active changes)
          for (const change of snapshot.docChanges()) {
            console.log('🔄 [HOTDECK LISTENER] Change type:', change.type);
            
            if (change.type === 'added' || change.type === 'modified') {
              const hotdeck = { id: change.doc.id, ...change.doc.data() };
              
              console.log('📦 [HOTDECK LISTENER] Hotdeck data:', {
                id: hotdeck.id,
                name: hotdeck.Name,
                sharedAt: hotdeck.SharedAt,
                status: hotdeck.Status,
                clientId: hotdeck.ClientId
              });
              
              // Check if we've already notified about this hotdeck
              if (this.notifiedHotdecks.has(hotdeck.id)) {
                console.log('📋 [HOTDECK LISTENER] Already notified about this hotdeck:', hotdeck.Name);
                continue;
              }
              
              // Strategy: Use SharedAt if available, otherwise treat all 'added' changes after startup as new
              const sharedAt = hotdeck.SharedAt?.toDate();
              let isNew = false;
              
              if (sharedAt) {
                // If SharedAt exists, use it to determine if new
                isNew = sharedAt > this.lastCheckedTimestamp;
                console.log('⏰ [HOTDECK LISTENER] Using SharedAt:', sharedAt);
              } else if (change.type === 'added') {
                // If no SharedAt but it's 'added' to our query, treat as new
                isNew = true;
                console.log('⏰ [HOTDECK LISTENER] No SharedAt, but newly added to query - treating as NEW');
              }
              
              console.log('⏰ [HOTDECK LISTENER] Check time:', this.lastCheckedTimestamp);
              console.log('⏰ [HOTDECK LISTENER] Is new?', isNew);
              
              if (isNew) {
                console.log('🆕 [HOTDECK LISTENER] NEW HOTDECK DETECTED:', hotdeck.Name);
                this.notifiedHotdecks.add(hotdeck.id); // Mark as notified
                await this.createHotdeckNotification(userId, agentId, hotdeck, agentName);
              } else {
                console.log('📋 [HOTDECK LISTENER] Existing hotdeck (skipping):', hotdeck.Name);
              }
            }
          }
        },
        (error) => {
          console.error('❌ [HOTDECK LISTENER] Error:', error);
        }
      );

      console.log('✅ [HOTDECK LISTENER] Listener active and waiting for new hotdecks!');
      return this.unsubscribe;

    } catch (error) {
      console.error('❌ Error starting hotdeck listener:', error);
      return () => {};
    }
  }

  /**
   * Create a notification for a new hotdeck
   */
  async createHotdeckNotification(userId, agentId, hotdeck, agentName) {
    try {
      console.log('📝 [HOTDECK NOTIFICATION] Creating notification for hotdeck:', hotdeck.Name);
      console.log('📝 [HOTDECK NOTIFICATION] User ID:', userId);
      console.log('📝 [HOTDECK NOTIFICATION] Agent ID:', agentId);

      // Check if notification already exists for this hotdeck
      const notificationsRef = collection(db, 'Users', userId, 'Notifications');
      const existingQuery = query(
        notificationsRef,
        where('Type', '==', 'hotdeck_received'),
        where('Data.hotdeckId', '==', hotdeck.id)
      );
      
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty) {
        console.log('⏭️ [HOTDECK NOTIFICATION] Notification already exists for this hotdeck, skipping');
        return;
      }

      // Create notification in Firestore
      await notificationsService.CreateNotification(userId, {
        type: 'hotdeck_received',
        title: '🏠 New Hot Deck from Your Agent',
        body: `${agentName} sent you "${hotdeck.Name}" with curated properties`,
        data: {
          hotdeckId: hotdeck.id,
          agentId: agentId,
          deckName: hotdeck.Name,
          propertyCount: hotdeck.PropertyIds?.length || 0,
          timestamp: new Date().toISOString()
        }
      });

      console.log('✅ [HOTDECK NOTIFICATION] Notification created successfully in Firestore!');

      // Skip local push notifications for now - just store in Firestore
      // User will see notification count on bell icon
      /*
      // Show local notification (if app is open)
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🏠 New Hot Deck',
            body: `${agentName} sent you "${hotdeck.Name}"`,
            data: {
              type: 'hotdeck_received',
              hotdeckId: hotdeck.id,
              agentId: agentId
            }
          },
          trigger: null, // Show immediately
        });
      } catch (notifError) {
        console.log('⚠️ Could not show local notification:', notifError.message);
      }
      */

    } catch (error) {
      console.error('❌ Error creating hotdeck notification:', error);
    }
  }

  /**
   * Stop listening for hotdecks
   */
  stopListening() {
    if (this.unsubscribe) {
      console.log('🛑 Stopping hotdeck notification listener');
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.notifiedHotdecks.clear(); // Clear tracking when stopping
  }

  /**
   * Reset timestamp check (for testing)
   * This will cause ALL existing hotdecks to be treated as "new"
   */
  resetTimestamp() {
    console.log('🔄 [HOTDECK LISTENER] Resetting timestamp check');
    this.lastCheckedTimestamp = null;
  }
}

export const hotdeckNotificationService = new HotdeckNotificationService();
export default hotdeckNotificationService;

