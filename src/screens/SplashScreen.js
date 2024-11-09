import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    // Navigate to MainTabs after 1.5 seconds
    setTimeout(() => {
      navigation.replace('MainTabs');
    }, 1500);
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/homerunnlogo1.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator 
        size="large" 
        color="#fff"
        style={styles.loader}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff5a60',
  },
  logo: {
    width: width * 0.7,     // 70% of screen width
    height: height * 0.35,   // 35% of screen height
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;
