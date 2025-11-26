import { collection, getDocs, query, where, doc, serverTimestamp, getDoc, setDoc, writeBatch, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationsService {
  /**
   * Get total unread notification count for a user
   */
  async GetTotalUnreadCount(userId) {
    try {
      console.log('🔢 Calculating total unread count for user:', userId);

      const userRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const unreadCount = userData.UnreadNotificationsCount || 0;
        console.log('🔢 Total unread count:', unreadCount);
        return unreadCount;
      }

      return 0;
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async MarkAllAsRead(userId) {
    try {
      console.log('✅ Marking all notifications as read for user:', userId);

      const userRef = doc(db, 'Users', userId);
      await setDoc(userRef, {
        UnreadNotificationsCount: 0,
        LastReadAt: serverTimestamp(),
        UpdatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw new Error('Failed to mark all as read');
    }
  }

  /**
   * Increment unread count for a user
   */
  async IncrementUnreadCount(userId, increment = 1) {
    try {
      console.log('➕ Incrementing unread count for user:', userId, 'by', increment);

      const userRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userRef);

      let currentCount = 0;
      if (userDoc.exists()) {
        const userData = userDoc.data();
        currentCount = userData.UnreadNotificationsCount || 0;
      }

      const newCount = currentCount + increment;

      await setDoc(userRef, {
        UnreadNotificationsCount: newCount,
        UpdatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Unread count incremented to:', newCount);
      return newCount;
    } catch (error) {
      console.error('Error incrementing unread count:', error);
      throw new Error('Failed to increment unread count');
    }
  }

  /**
   * Subscribe to unread count changes for a user
   * Returns an unsubscribe function
   */
  SubscribeToUnreadCount(userId, onCountUpdate, onError) {
    try {
      const userRef = doc(db, 'Users', userId);
      
      console.log('🔔 Setting up unread count subscription for user:', userId);

      const unsubscribe = onSnapshot(
        userRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            console.log('📭 User document does not exist');
            onCountUpdate(0);
            return;
          }

          const data = snapshot.data();
          const unreadCount = data.UnreadNotificationsCount || 0;

          console.log('📊 Unread count update:', unreadCount);
          onCountUpdate(unreadCount);
        },
        (error) => {
          console.error('❌ Error in unread count listener:', error);
          onError?.(error);
        }
      );

      console.log('✅ Unread count subscription set up');
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up unread count listener:', error);
      return () => {};
    }
  }

  /**
   * Get user's notification preferences
   */
  async GetNotificationPreferences(userId) {
    try {
      const userRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          newListings: userData.NotifyNewListings ?? true,
          priceChanges: userData.NotifyPriceChanges ?? true,
          messages: userData.NotifyMessages ?? true,
          offers: userData.NotifyOffers ?? true,
          favorites: userData.NotifyFavorites ?? true,
        };
      }

      return {
        newListings: true,
        priceChanges: true,
        messages: true,
        offers: true,
        favorites: true,
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  /**
   * Update user's notification preferences
   */
  async UpdateNotificationPreferences(userId, preferences) {
    try {
      console.log('🔧 Updating notification preferences for user:', userId);

      const userRef = doc(db, 'Users', userId);
      await setDoc(userRef, {
        NotifyNewListings: preferences.newListings,
        NotifyPriceChanges: preferences.priceChanges,
        NotifyMessages: preferences.messages,
        NotifyOffers: preferences.offers,
        NotifyFavorites: preferences.favorites,
        UpdatedAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Notification preferences updated');
      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  /**
   * Create a notification record
   */
  async CreateNotification(userId, notificationData) {
    try {
      console.log('📝 Creating notification for user:', userId);

      const notificationsRef = collection(db, 'Users', userId, 'Notifications');
      const notificationRef = doc(notificationsRef);

      await setDoc(notificationRef, {
        Type: notificationData.type,
        Title: notificationData.title,
        Body: notificationData.body,
        Data: notificationData.data || {},
        IsRead: false,
        CreatedAt: serverTimestamp(),
        ReadAt: null
      });

      // Increment unread count
      await this.IncrementUnreadCount(userId, 1);

      console.log('✅ Notification created:', notificationRef.id);
      return notificationRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  /**
   * Get user's notifications
   */
  async GetNotifications(userId, limit = 50) {
    try {
      console.log('📋 Getting notifications for user:', userId);

      const notificationsRef = collection(db, 'Users', userId, 'Notifications');
      const notificationsQuery = query(notificationsRef);
      
      const querySnapshot = await getDocs(notificationsQuery);
      
      const notifications = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        notifications.push({
          id: doc.id,
          type: data.Type,
          title: data.Title,
          body: data.Body,
          data: data.Data || {},
          isRead: data.IsRead || false,
          createdAt: data.CreatedAt?.toDate() || new Date(),
          readAt: data.ReadAt?.toDate() || null
        });
      });

      // Sort by createdAt descending
      notifications.sort((a, b) => b.createdAt - a.createdAt);

      console.log('✅ Found notifications:', notifications.length);
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async MarkNotificationAsRead(userId, notificationId) {
    try {
      console.log('✅ Marking notification as read:', notificationId);

      const notificationRef = doc(db, 'Users', userId, 'Notifications', notificationId);
      await setDoc(notificationRef, {
        IsRead: true,
        ReadAt: serverTimestamp()
      }, { merge: true });

      console.log('✅ Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * Delete notification
   */
  async DeleteNotification(userId, notificationId) {
    try {
      console.log('🗑️ Deleting notification:', notificationId);

      const notificationRef = doc(db, 'Users', userId, 'Notifications', notificationId);
      await deleteDoc(notificationRef);

      console.log('✅ Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * Subscribe to notifications for a user
   */
  SubscribeToNotifications(userId, onNotificationsUpdate, onError) {
    try {
      const notificationsRef = collection(db, 'Users', userId, 'Notifications');
      
      console.log('🔔 Setting up notifications subscription for user:', userId);

      const unsubscribe = onSnapshot(
        notificationsRef,
        (snapshot) => {
          const notifications = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            notifications.push({
              id: doc.id,
              type: data.Type,
              title: data.Title,
              body: data.Body,
              data: data.Data || {},
              isRead: data.IsRead || false,
              createdAt: data.CreatedAt?.toDate() || new Date(),
              readAt: data.ReadAt?.toDate() || null
            });
          });

          // Sort by createdAt descending
          notifications.sort((a, b) => b.createdAt - a.createdAt);

          console.log('📊 Notifications update:', notifications.length);
          onNotificationsUpdate(notifications);
        },
        (error) => {
          console.error('❌ Error in notifications listener:', error);
          onError?.(error);
        }
      );

      console.log('✅ Notifications subscription set up');
      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up notifications listener:', error);
      return () => {};
    }
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;

