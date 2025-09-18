import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AccountCreationScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleSignUp = () => {
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
      >
        <Text style={styles.buttonText}>Sign Up</Text>
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
});

export default AccountCreationScreen;
