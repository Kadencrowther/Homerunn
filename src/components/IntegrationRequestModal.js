import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const IntegrationRequestModal = ({ visible, onClose, onRequest, city, state, isLoading }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconContainer}>
            <Ionicons name="location-outline" size={50} color="#fc565b" />
          </View>
          
          <Text style={styles.title}>Not Available Yet</Text>
          
          <Text style={styles.message}>
            We are not currently integrated with <Text style={styles.highlight}>{state}</Text> yet.
          </Text>
          
          <Text style={styles.submessage}>
            But we're always expanding! Request integration for <Text style={styles.highlight}>{city}, {state}</Text> and we'll prioritize it.
          </Text>
          
          <TouchableOpacity 
            style={[styles.requestButton, isLoading && styles.buttonDisabled]}
            onPress={onRequest}
            disabled={isLoading}
          >
            <Text style={styles.requestButtonText}>
              {isLoading ? 'Submitting...' : 'Request Integration'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Go Back</Text>
          </TouchableOpacity>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color="#666" />
            <Text style={styles.infoText}>
              Currently available in: Mississippi
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: width * 0.85,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: '700',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: width * 0.042,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 22,
  },
  submessage: {
    fontSize: width * 0.038,
    color: '#888',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  highlight: {
    fontWeight: '700',
    color: '#fc565b',
  },
  requestButton: {
    backgroundColor: '#fc565b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#fc565b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  requestButtonText: {
    color: '#fff',
    fontSize: width * 0.042,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    gap: 8,
  },
  infoText: {
    fontSize: width * 0.032,
    color: '#666',
    flex: 1,
  },
});

export default IntegrationRequestModal;

