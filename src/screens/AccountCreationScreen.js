import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AccountCreationScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

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
