import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { notificationsService } from '../services/notificationsService';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');

const NotificationDropdown = ({ visible, onClose, notifications = [] }) => {
  const navigation = useNavigation();
  
  if (!visible) return null;

  const handleNotificationPress = async (notification) => {
    console.log('🔔 Notification tapped:', notification);
    
    // Mark as read
    try {
      const userId = auth.currentUser?.uid;
      if (userId) {
        await notificationsService.MarkNotificationAsRead(userId, notification.id);
        console.log('✅ Notification marked as read');
      }
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }

    // Close dropdown
    onClose();

    // Navigate based on type
    if (notification.type === 'hotdeck_received' && notification.data?.hotdeckId) {
      navigation.navigate('HotdeckView', {
        hotdeckId: notification.data.hotdeckId,
        agentId: notification.data.agentId,
      });
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };
  
  return (
    <TouchableOpacity
      style={styles.overlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.dropdownContainer}>
        <View style={styles.dropdownHeader}>
          <Text style={styles.dropdownTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Content area with ScrollView */}
        <ScrollView 
          style={styles.contentArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color="#ccc" />
              <Text style={styles.emptyTitle}>No New Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You have no new notifications at this time
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationItem, !notification.isRead && styles.unreadItem]}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={styles.notificationIcon}>
                  <Ionicons 
                    name={notification.type === 'hotdeck_received' ? 'home' : 'notifications'} 
                    size={18} 
                    color="#fc565b" 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.body}
                  </Text>
                  {notification.data?.deckName && (
                    <Text style={styles.deckName} numberOfLines={1}>
                      📋 {notification.data.deckName}
                    </Text>
                  )}
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(notification.createdAt)}
                  </Text>
                </View>
                {!notification.isRead && (
                  <View style={styles.unreadDot} />
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1000,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 120, // Position below header
    paddingRight: 16,
  },
  dropdownContainer: {
    width: width * 0.85,
    height: 400, // Fixed height instead of maxHeight
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#fff8f8',
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    lineHeight: 16,
  },
  deckName: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 11,
    color: '#999',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fc565b',
    marginLeft: 8,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default NotificationDropdown; 