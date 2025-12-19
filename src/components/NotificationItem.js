import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const NotificationItem = ({ notification, onPress }) => {
  const isHotdeck = notification.type === 'hotdeck_received';
  
  return (
    <TouchableOpacity
      style={[styles.container, !notification.isRead && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <FontAwesome 
          name={isHotdeck ? "home" : "bell"} 
          size={24} 
          color="#fc565b" 
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.body}>{notification.body}</Text>
        
        {isHotdeck && notification.data?.deckName && (
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>
              📋 {notification.data.deckName}
            </Text>
            {notification.data.propertyCount > 0 && (
              <Text style={styles.metaText}>
                {' • '}{notification.data.propertyCount} properties
              </Text>
            )}
          </View>
        )}
        
        <Text style={styles.timestamp}>
          {formatTimestamp(notification.createdAt)}
        </Text>
      </View>
      
      {!notification.isRead && (
        <View style={styles.unreadDot} />
      )}
    </TouchableOpacity>
  );
};

const formatTimestamp = (timestamp) => {
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  unread: {
    backgroundColor: '#fff5f5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fc565b',
    marginLeft: 8,
  },
});

export default NotificationItem;

