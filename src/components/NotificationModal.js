import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import {
  getRegisteredDevices,
  enableNotifications,
  disableNotifications,
  areNotificationsEnabled,
  removeDeviceToken,
} from '../services/NotificationService';

const NotificationModal = ({ visible, onClose }) => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotificationData();
    }
  }, [visible]);

  const loadNotificationData = async () => {
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.warn('No user authenticated');
        setLoading(false);
        return;
      }

      const [devicesData, enabled] = await Promise.all([
        getRegisteredDevices(userId),
        areNotificationsEnabled(userId),
      ]);
      
      setDevices(devicesData);
      setNotificationsEnabled(enabled);
      
      console.log('Loaded notification data:', {
        devices: devicesData.length,
        enabled,
      });
    } catch (error) {
      console.error('Error loading notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnableNotifications = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in to enable notifications');
        return;
      }

      const success = await enableNotifications(userId);
      
      if (success) {
        Alert.alert('Success', 'Notifications enabled for this device');
        await loadNotificationData();
      } else {
        Alert.alert('Error', 'Failed to enable notifications. Please try again.');
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      Alert.alert('Error', 'Failed to enable notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableDevice = async (token, deviceName) => {
    Alert.alert(
      'Remove Device',
      `Are you sure you want to stop receiving notifications on "${deviceName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const userId = auth.currentUser?.uid;
              if (!userId) {
                Alert.alert('Error', 'You must be signed in');
                return;
              }

              const success = await removeDeviceToken(userId, token);
              
              if (success) {
                Alert.alert('Success', 'Device removed from notifications');
                await loadNotificationData();
              } else {
                Alert.alert('Error', 'Failed to remove device. Please try again.');
              }
            } catch (error) {
              console.error('Error disabling device:', error);
              Alert.alert('Error', 'Failed to remove device. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAllNotifications = async (value) => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be signed in');
        return;
      }

      if (value) {
        // If no devices registered, prompt to register this device
        if (devices.length === 0) {
          Alert.alert(
            'Enable Notifications',
            'You need to register at least one device. Would you like to enable notifications on this device?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
              {
                text: 'Enable',
                onPress: async () => {
                  await handleEnableNotifications();
                },
              },
            ]
          );
          return;
        }
        
        const success = await enableNotifications(userId);
        if (success) {
          Alert.alert('Success', 'Notifications enabled');
        }
      } else {
        const success = await disableNotifications(userId);
        if (success) {
          Alert.alert('Success', 'Notifications disabled');
        }
      }
      
      await loadNotificationData();
    } catch (error) {
      console.error('Error toggling notifications:', error);
      Alert.alert('Error', 'Failed to update notification settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Unknown';
    
    // Handle Firestore Timestamp objects
    let date;
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue.seconds) {
      date = new Date(dateValue.seconds * 1000);
    } else {
      date = new Date(dateValue);
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (platform) => {
    if (!platform) return 'phone-portrait';
    const os = platform.toLowerCase();
    if (os === 'ios') return 'phone-portrait';
    if (os === 'android') return 'phone-portrait-outline';
    return 'tablet-portrait';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FC565B" />
              <Text style={styles.loadingText}>Loading notification settings...</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Master Toggle */}
              <View style={styles.section}>
                <View style={styles.masterToggle}>
                  <View style={styles.toggleLeft}>
                    <Ionicons name="notifications" size={24} color="#FC565B" />
                    <View style={styles.toggleTextContainer}>
                      <Text style={styles.toggleTitle}>Push Notifications</Text>
                      <Text style={styles.toggleSubtitle}>
                        {notificationsEnabled
                          ? `Enabled on ${devices.length} device${devices.length !== 1 ? 's' : ''}`
                          : 'Currently disabled'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={handleToggleAllNotifications}
                    trackColor={{ false: '#ccc', true: '#FC565B' }}
                    thumbColor="#fff"
                    disabled={loading}
                  />
                </View>
              </View>

              {/* Devices List */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Registered Devices</Text>
                  <Text style={styles.deviceCount}>{devices.length}</Text>
                </View>

                {devices.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="phone-portrait-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No devices registered</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Enable notifications on this device to get started
                    </Text>
                  </View>
                ) : (
                  devices.map((device, index) => (
                    <View key={index} style={styles.deviceCard}>
                      <View style={styles.deviceHeader}>
                        <View style={styles.deviceIconContainer}>
                          <Ionicons
                            name={getDeviceIcon(device.Platform || device.DeviceOS)}
                            size={24}
                            color="#FC565B"
                          />
                        </View>
                        <View style={styles.deviceInfo}>
                          <Text style={styles.deviceName}>{device.DeviceName}</Text>
                          <Text style={styles.deviceModel}>
                            {device.ModelName || device.DeviceModel} • {(device.Platform || device.DeviceOS || 'unknown').toUpperCase()}
                          </Text>
                          {(device.DeviceManufacturer) && device.DeviceManufacturer !== 'Unknown' && (
                            <Text style={styles.deviceManufacturer}>
                              {device.DeviceManufacturer}
                            </Text>
                          )}
                          <Text style={styles.deviceDate}>
                            Registered {formatDate(device.AddedAt || device.RegisteredAt)}
                          </Text>
                        </View>
                      </View>

                      {/* Token Display */}
                      <View style={styles.tokenContainer}>
                        <Text style={styles.tokenLabel}>Token:</Text>
                        <Text style={styles.tokenText} numberOfLines={2} ellipsizeMode="middle">
                          {device.Token}
                        </Text>
                      </View>

                      {/* Remove Button */}
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => handleDisableDevice(device.Token, device.DeviceName)}
                        disabled={loading}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ff3b30" />
                        <Text style={styles.removeButtonText}>Remove Device</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>

              {/* Add Current Device Button */}
              <TouchableOpacity
                style={styles.addDeviceButton}
                onPress={handleEnableNotifications}
                disabled={loading}
              >
                <Ionicons name="add-circle" size={24} color="#fff" />
                <Text style={styles.addDeviceText}>Enable on This Device</Text>
              </TouchableOpacity>

              {/* Info Section */}
              <View style={styles.infoSection}>
                <Ionicons name="information-circle-outline" size={20} color="#666" />
                <Text style={styles.infoText}>
                  You'll receive notifications about new home matches, price changes, and updates on your saved properties.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '75%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  masterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  deviceCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FC565B',
    backgroundColor: '#fff0f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  deviceCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
  },
  deviceHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  deviceIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  deviceModel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  deviceManufacturer: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  deviceDate: {
    fontSize: 12,
    color: '#999',
  },
  tokenContainer: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  tokenText: {
    fontSize: 11,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  removeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff3b30',
    marginLeft: 6,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC565B',
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 16,
    borderRadius: 12,
  },
  addDeviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f8ff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    marginLeft: 10,
    lineHeight: 18,
  },
});

export default NotificationModal;
