import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FindAnAgent = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find an Agent</Text>
      <Text style={styles.text}>
        Placeholder text for finding an agent. Here you can provide information about connecting with a real estate agent to help you find your dream home.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fc565b',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});

export default FindAnAgent; 