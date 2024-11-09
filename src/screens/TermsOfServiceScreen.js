import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const TermsOfServiceScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Terms of Service & Privacy Policy</Text>
      <ScrollView style={styles.termsContainer}>
        <Text style={styles.termsText}>
          {/* Placeholder text. Replace this with actual terms and privacy policy text */}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur scelerisque...
        </Text>
      </ScrollView>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('ProfileCompletion')}
      >
        <Text style={styles.buttonText}>Accept and Continue</Text>
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
  termsContainer: {
    flex: 1,
    marginBottom: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TermsOfServiceScreen;
