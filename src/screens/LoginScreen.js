import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions, Modal } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordModalVisible, setIsForgotPasswordModalVisible] = useState(false);

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Set IsActive to true when user logs in
      const userDocRef = doc(db, 'Users', userCredential.user.uid);
      await updateDoc(userDocRef, {
        IsActive: true
      });
      
      // Navigate to UserInfo
      navigation.replace('UserInfo');
    } catch (error) {
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Password Reset', 'Password reset email sent. Please check your inbox.');
      setIsForgotPasswordModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send password reset email.');
    }
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

      <Text style={styles.title}>Welcome Back</Text>
      
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

      <TouchableOpacity 
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <View style={styles.orContainer}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.orLine} />
      </View>

      <TouchableOpacity 
        style={styles.forgotPasswordButton}
        onPress={() => setIsForgotPasswordModalVisible(true)}
      >
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={styles.signupSection}>
        <Text style={styles.signupPrompt}>Don't have an account?</Text>
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => navigation.navigate('AccountCreation')}
        >
          <Text style={styles.signupButtonText}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isForgotPasswordModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsForgotPasswordModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.modalButton}
              onPress={handleForgotPassword}
            >
              <Text style={styles.modalButtonText}>Send Reset Link</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setIsForgotPasswordModalVisible(false)}
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
    paddingTop: height * 0.05,
    backgroundColor: '#fff',
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  salmonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.04,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfCircle: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.15,
    backgroundColor: '#fff',
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    transform: [{ scaleX: 1.1 }],
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '600',
    marginBottom: height * 0.04,
    color: '#333',
    marginTop: height * 0.2,
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
  forgotPasswordButton: {
    marginBottom: height * 0.03,
  },
  forgotPasswordText: {
    color: '#fc565b',
    fontSize: width * 0.04,
    textDecorationLine: 'underline',
  },
  signupSection: {
    alignItems: 'center',
    marginTop: height * 0.02,
  },
  signupPrompt: {
    color: '#666',
    fontSize: width * 0.04,
    marginBottom: height * 0.02,
  },
  signupButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    width: width * 0.85,
    borderWidth: 1,
    borderColor: '#fc565b',
  },
  signupButtonText: {
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    marginBottom: height * 0.02,
    color: '#333',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: height * 0.016,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    fontSize: width * 0.04,
    backgroundColor: '#fff',
  },
  modalButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    width: '100%',
    marginBottom: height * 0.02,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
  modalCancelButton: {
    backgroundColor: '#ddd',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    width: '100%',
  },
  modalCancelButtonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
});

export default LoginScreen;
