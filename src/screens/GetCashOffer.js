import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const GetCashOffer = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get a Cash Offer</Text>
      <Text style={styles.text}>
        Placeholder text for getting a cash offer. Here you can provide details about the process and benefits of getting a cash offer for your home.
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

export default GetCashOffer; 