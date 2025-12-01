import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const AccountCreationScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [showExistingAccountModal, setShowExistingAccountModal] = useState(false);

  const validatePassword = (password) => {
    return {
      length: password.length >= 6,
      capital: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
  };

  const showPasswordValidationAlert = (validation) => {
    const requirements = [
      { key: 'length', text: 'At least 6 characters' },
      { key: 'capital', text: 'One capital letter' },
      { key: 'lowercase', text: 'One lowercase letter' },
      { key: 'special', text: 'One special character' },
      { key: 'match', text: 'Passwords match' }
    ];

    const metRequirements = requirements.filter(req => validation[req.key]);
    const unmetRequirements = requirements.filter(req => !validation[req.key]);

    let message = 'Password requirements:\n\n';
    
    if (metRequirements.length > 0) {
      message += '✅ Met requirements:\n';
      metRequirements.forEach(req => {
        message += `• ${req.text}\n`;
      });
      message += '\n';
    }
    
    if (unmetRequirements.length > 0) {
      message += '❌ Missing requirements:\n';
      unmetRequirements.forEach(req => {
        message += `• ${req.text}\n`;
      });
    }

    Alert.alert('Password Requirements', message);
  };

  const checkEmailExists = async (email) => {
    console.log('📧 Checking if email exists:', email);
    
    try {
      // Check Firebase Auth
      console.log('🔍 Checking Firebase Auth...');
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      console.log('🔍 Firebase Auth sign-in methods found:', signInMethods.length);
      
      if (signInMethods.length > 0) {
        console.log('✅ Email found in Firebase Auth:', signInMethods);
        return true;
      }

      // Check Firestore Users collection (with limit for efficiency)
      console.log('🔍 Checking Firestore Users collection...');
      const usersRef = collection(db, 'Users');
      
      // Check both possible email field locations (some users have it at top level, some in Credentials.Email)
      const q1 = query(usersRef, where('email', '==', email.toLowerCase()));
      const q2 = query(usersRef, where('Credentials.Email', '==', email));
      
      const [querySnapshot1, querySnapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);
      
      const totalResults = querySnapshot1.size + querySnapshot2.size;
      console.log('🔍 Firestore query results:', totalResults === 0 ? 'No documents found' : `${totalResults} document(s) found`);
      
      const emailExists = !querySnapshot1.empty || !querySnapshot2.empty;
      
      if (emailExists) {
        console.log('✅ Email found in Firestore Users collection');
      } else {
        console.log('✅ Email not found - available for registration');
      }
      
      return emailExists;
    } catch (error) {
      console.error('❌ Error checking email:', error);
      // If there's an error, allow them to continue
      // The actual account creation will fail if email exists
      return false;
    }
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const passwordValidation = validatePassword(password);
    passwordValidation.match = password === confirmPassword;
    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    if (!isPasswordValid) {
      showPasswordValidationAlert(passwordValidation);
      return;
    }

    // Check if email already exists
    setIsCheckingEmail(true);
    const emailExists = await checkEmailExists(email);
    setIsCheckingEmail(false);

    if (emailExists) {
      setShowExistingAccountModal(true);
      return;
    }

    navigation.navigate('UserInfo', {
      credentials: {
        email: email,
        password: password
      }
    });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      <View style={styles.topSection}>
        <View style={styles.salmonBackground}>
        </View>
        <View style={styles.halfCircle} />
      </View>

      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons 
            name={showPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity 
          style={styles.eyeButton}
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons 
            name={showConfirmPassword ? "eye-off" : "eye"} 
            size={20} 
            color="#666" 
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={handleSignUp}
        disabled={isCheckingEmail}
      >
        {isCheckingEmail ? (
          <ActivityIndicator color="#fff" />
        ) : (
        <Text style={styles.buttonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.orContainer}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <Text style={styles.loginPrompt}>Already have an account?</Text>
      <TouchableOpacity 
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginButtonText}>Log In</Text>
      </TouchableOpacity>

      {/* Existing Account Modal */}
      <Modal
        visible={showExistingAccountModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowExistingAccountModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={60} color="#fc565b" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Account Already Exists</Text>
            <Text style={styles.modalMessage}>
              An account with this email already exists. Please sign in instead.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowExistingAccountModal(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.modalButtonText}>Go to Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowExistingAccountModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: width * 0.05,
    paddingTop: height * 0.1,
    backgroundColor: '#fff',
  },
  topSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  salmonBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfCircle: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: height * 0.15,
    backgroundColor: '#fff',
    borderBottomLeftRadius: width * 0.5,
    borderBottomRightRadius: width * 0.5,
    transform: [{ scaleX: 1.1 }],
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '600',
    marginBottom: height * 0.04,
    color: '#333',
    marginTop: height * 0.05,
  },
  input: {
    width: width * 0.85,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: height * 0.016,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: height * 0.016,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    fontSize: width * 0.04,
    paddingRight: width * 0.02,
  },
  eyeButton: {
    padding: width * 0.02,
  },
  button: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.02,
    width: width * 0.85,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: width * 0.85,
    marginVertical: height * 0.03,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  orText: {
    color: '#666',
    paddingHorizontal: width * 0.04,
    fontSize: width * 0.04,
  },
  loginPrompt: {
    color: '#666',
    fontSize: width * 0.04,
    marginBottom: height * 0.02,
  },
  loginButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 1,
    borderColor: '#fc565b',
  },
  loginButtonText: {
    color: '#fc565b',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#fff',
    borderRadius: width * 0.04,
    padding: width * 0.06,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    marginBottom: height * 0.02,
  },
  modalTitle: {
    fontSize: width * 0.055,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.015,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.03,
    lineHeight: width * 0.055,
  },
  modalButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.015,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
  modalCancelButton: {
    paddingVertical: height * 0.015,
    alignItems: 'center',
    width: '100%',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: width * 0.04,
  },
});

export default AccountCreationScreen;
