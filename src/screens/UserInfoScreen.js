import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import houseGif from '../../assets/house.gif';

const { width, height } = Dimensions.get('window');

const UserInfoScreen = ({ navigation, route }) => {
  // Animation for a subtle breathing effect on elements
  const scale = useSharedValue(1);
  
  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.headerContainer, animatedStyle]}>
          <Text style={styles.title}>Lets learn some more about you!</Text>
        </Animated.View>
        
        <View style={styles.gifContainer}>
          <Image 
            source={houseGif}
            style={styles.gif}
            resizeMode="contain"
          />
        </View>
      </View>
      
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            console.log('UserInfoScreen passing credentials:', route.params?.credentials || {});
            navigation.navigate('PersonalPreferences', {
              credentials: route.params?.credentials || {}
            });
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.03,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
    marginBottom: height * 0.02,
  },
  gifContainer: {
    width: width * 0.8,
    height: height * 0.3,
    marginVertical: height * 0.05,
    borderRadius: width * 0.04,
    overflow: 'hidden',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gif: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    marginBottom: height * 0.05,
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: width * 0.045,
  },
});

export default UserInfoScreen; 