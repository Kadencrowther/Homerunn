import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inviteAgentToHomerunn } from '../services/pendingInvitesService';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const InviteAgentModal = ({ visible, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter the agent\'s name');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Error', 'Please enter at least an email or phone number');
      return;
    }
    if (email.trim() && !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Get current user info
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to invite an agent');
        return;
      }

      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();
      
      const userName = userData?.Profile?.FirstName && userData?.Profile?.LastName
        ? `${userData.Profile.FirstName} ${userData.Profile.LastName}`
        : 'Homerunn User';
      const userEmail = userData?.Email || auth.currentUser.email;

      // Send invite
      const result = await inviteAgentToHomerunn(
        userId,
        userName,
        userEmail,
        {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim()
        }
      );

      setLoading(false);

      if (result.type === 'existing') {
        Alert.alert(
          'Connection Sent!',
          `${name} is already on Homerunn! A connection request has been sent to them.`,
          [{ text: 'OK', onPress: () => handleSuccess() }]
        );
      } else {
        Alert.alert(
          'Invite Sent!',
          `We've sent an invitation to ${name} to join Homerunn. They'll be connected with you once they sign up.`,
          [{ text: 'OK', onPress: () => handleSuccess() }]
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('Error inviting agent:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    }
  };

  const handleSuccess = () => {
    // Reset form
    setName('');
    setEmail('');
    setPhone('');
    
    // Call success callback
    if (onSuccess) onSuccess();
    
    // Close modal
    onClose();
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Your Agent</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDescription}>
                Don't see your agent? Invite them to join Homerunn and connect with you!
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Agent Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Smith"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="agent@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.noteText}>
                * At least an email or phone number is required
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.inviteButton, loading && styles.inviteButtonDisabled]}
                onPress={handleInvite}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.inviteButtonText}>Send Invite</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: width * 0.05,
    borderTopRightRadius: width * 0.05,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.025,
    paddingBottom: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: width * 0.01,
  },
  modalBody: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
    maxHeight: height * 0.55,
  },
  modalDescription: {
    fontSize: width * 0.04,
    color: '#666',
    marginBottom: height * 0.025,
    lineHeight: width * 0.055,
  },
  inputContainer: {
    marginBottom: height * 0.02,
  },
  inputLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.008,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    fontSize: width * 0.04,
    color: '#333',
  },
  noteText: {
    fontSize: width * 0.033,
    color: '#999',
    fontStyle: 'italic',
    marginTop: height * 0.01,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: width * 0.03,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#666',
  },
  inviteButton: {
    flex: 1,
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.6,
  },
  inviteButtonText: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default InviteAgentModal;

