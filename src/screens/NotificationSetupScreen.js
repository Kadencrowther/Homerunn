import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const NotificationSetupScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://example.com/notification-image.jpg' }} // Replace with an actual image URL or local asset
        style={styles.image}
      />
      <Text style={styles.title}>Turn On Notifications</Text>
      <Text style={styles.subtitle}>
        Get alerts for new properties, updates, and exclusive offers.
      </Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Home')} // Assume it navigates to the main Home screen
      >
        <Text style={styles.buttonText}>Enable Notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NotificationSetupScreen;
