import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PlaceholderImage = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="home-outline" size={32} color="#ccc" />
      <Text style={styles.text}>No Additional Images</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default PlaceholderImage; 