import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

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
          
          <View style={styles.aiSection}>
            <View style={styles.aiIconContainer}>
              <Ionicons name="sparkles" size={32} color="#fc565b" />
            </View>
            <View style={styles.aiTextContainer}>
              <Text style={styles.aiText}>
                Homerunn AI will curate your home feed for properties that are most relevant to you!
              </Text>
            </View>
          </View>
        </Animated.View>
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: height * 0.03,
    marginBottom: height * 0.1,
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
    marginBottom: height * 0.04,
  },
  aiSection: {
    alignItems: 'center',
    maxWidth: width * 0.8,
  },
  aiIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  aiTextContainer: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderRadius: width * 0.025,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(252, 86, 91, 0.15)',
  },
  aiText: {
    fontSize: width * 0.04,
    fontWeight: '500',
    textAlign: 'center',
    color: '#666',
    lineHeight: width * 0.06,
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