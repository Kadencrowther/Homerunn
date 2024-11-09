import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GetPrequalified = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Prequalified</Text>
      <Text style={styles.text}>
        Placeholder text for getting prequalified. Here you can provide details about the prequalification process and how it can help you purchase your dream home.
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

export default GetPrequalified; 