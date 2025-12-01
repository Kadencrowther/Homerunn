import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { auth } from '../config/firebase';
import { deviceNotificationService } from '../services/deviceNotificationService';

const NotificationDebugScreen = ({ navigation }) => {
  const [status, setStatus] = useState({
    permissions: 'checking...',
    isDevice: 'checking...',
    token: 'checking...',
    projectId: 'checking...',
    userId: 'checking...',
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check permissions
      const { status: permStatus } = await Notifications.getPermissionsAsync();
      
      // Check if real device
      const isRealDevice = Device?.isDevice ?? false;
      
      // Get project ID
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                       Constants?.easConfig?.projectId ||
                       'c9d6dcde-524c-4058-b8d0-2ba7c32d1219';
      
      // Get user ID
      const userId = auth.currentUser?.uid || 'Not signed in';
      
      // Try to get token
      let token = 'Not available';
      if (isRealDevice && permStatus === 'granted') {
        try {
          const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
          token = tokenData.data;
        } catch (err) {
          token = `Error: ${err.message}`;
        }
      }
      
      setStatus({
        permissions: permStatus,
        isDevice: isRealDevice ? 'Yes (Real Device)' : 'No (Simulator)',
        token: token,
        projectId: projectId,
        userId: userId,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      Alert.alert('Permissions', `Status: ${status}`);
      await checkStatus();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const registerDevice = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'Please sign in first');
        return;
      }
      
      await deviceNotificationService.enableNotificationsForCurrentUser(userId);
      Alert.alert('Success', 'Device registered for notifications!');
      await checkStatus();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const copyToken = () => {
    if (status.token && !status.token.includes('Error')) {
      Clipboard.setString(status.token);
      Alert.alert('Copied!', 'Token copied to clipboard');
    }
  };

  const sendTestNotification = async () => {
    try {
      if (!status.token || status.token.includes('Error')) {
        Alert.alert('Error', 'No valid token available');
        return;
      }

      const message = {
        to: status.token,
        sound: 'default',
        title: 'Test Notification',
        body: 'This is a test notification from Homerunn!',
        data: { type: 'test' },
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.ok) {
        Alert.alert('Success', 'Test notification sent! Check your device.');
      } else {
        const error = await response.text();
        Alert.alert('Error', error);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const StatusRow = ({ label, value, emoji }) => (
    <View style={styles.statusRow}>
      <Text style={styles.statusLabel}>
        {emoji} {label}:
      </Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Debug</Text>
        <TouchableOpacity onPress={checkStatus}>
          <Ionicons name="refresh" size={24} color="#FC565B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          
          <StatusRow 
            label="Permissions" 
            value={status.permissions}
            emoji="🔐"
          />
          <StatusRow 
            label="Device Type" 
            value={status.isDevice}
            emoji="📱"
          />
          <StatusRow 
            label="Platform" 
            value={Platform.OS.toUpperCase()}
            emoji="🖥️"
          />
          <StatusRow 
            label="User ID" 
            value={status.userId}
            emoji="👤"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuration</Text>
          
          <StatusRow 
            label="Project ID" 
            value={status.projectId?.substring(0, 20) + '...'}
            emoji="🔑"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Token</Text>
          
          <View style={styles.tokenContainer}>
            <Text style={styles.tokenLabel}>Token:</Text>
            <Text style={styles.tokenText} numberOfLines={3}>
              {status.token}
            </Text>
          </View>
          
          {status.token && !status.token.includes('Error') && !status.token.includes('checking') && (
            <TouchableOpacity style={styles.copyButton} onPress={copyToken}>
              <Ionicons name="copy-outline" size={18} color="#FC565B" />
              <Text style={styles.copyButtonText}>Copy Token</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={requestPermissions}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Request Permissions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]} 
            onPress={registerDevice}
          >
            <Ionicons name="phone-portrait-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Register This Device</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.tertiaryButton]} 
            onPress={sendTestNotification}
          >
            <Ionicons name="send-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.outlineButton]} 
            onPress={checkStatus}
          >
            <Ionicons name="refresh-outline" size={24} color="#FC565B" />
            <Text style={[styles.actionButtonText, styles.outlineButtonText]}>
              Refresh Status
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Use this screen to debug notification issues. Check the Xcode console or 
            terminal logs for detailed error messages.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  statusValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  tokenContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  tokenText: {
    fontSize: 11,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FC565B',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FC565B',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC565B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButton: {
    backgroundColor: '#4CAF50',
  },
  tertiaryButton: {
    backgroundColor: '#2196F3',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FC565B',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  outlineButtonText: {
    color: '#FC565B',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default NotificationDebugScreen;

