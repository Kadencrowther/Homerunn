import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

const PhoneVerificationScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Your Phone Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('PersonalDetails')}
      >
        <Text style={styles.buttonText}>Send Code</Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.input, { marginTop: 20 }]}
        placeholder="Enter verification code"
        keyboardType="number-pad"
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('PersonalDetails')}
      >
        <Text style={styles.buttonText}>Verify Code</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default PhoneVerificationScreen;
