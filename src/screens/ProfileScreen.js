import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [password, setPassword] = useState('');

  const handleDeactivate = () => {
    setIsModalVisible(true);
  };

  const confirmDeactivate = () => {
    console.log('Account deactivated with password:', password);
    setIsModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="person-outline" size={24} color="#fc565b" />
          <Text style={styles.headerText}>KADEN CROWTHER</Text>
        </View>
        <TouchableOpacity style={styles.settingsIcon}>
          <Ionicons name="settings-outline" size={24} color="#fc565b" />
        </TouchableOpacity>
      </View>

      {/* Settings Options */}
      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.buttonText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.buttonText}>Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.buttonText}>App Settings</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.buttonText}>Help and feedback</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionButton}>
        <Text style={styles.buttonText}>Terms of use</Text>
      </TouchableOpacity>

      {/* Deactivate Account Button */}
      <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivate}>
        <Text style={styles.deactivateButtonText}>Deactivate Account</Text>
      </TouchableOpacity>

      {/* Deactivation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Are you sure you want to deactivate your account?</Text>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={confirmDeactivate}>
                <Text style={styles.confirmButtonText}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Version */}
      <Text style={styles.versionText}>ver 1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#fc565b',
  },
  settingsIcon: {
    padding: 8,
  },
  optionButton: {
    backgroundColor: '#fc565b',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  deactivateButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  deactivateButtonText: {
    color: '#fc565b',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  passwordInput: {
    width: '100%',
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  confirmButton: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fc565b',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  versionText: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    fontSize: 12,
    color: 'gray',
  },
});

export default ProfileScreen;
