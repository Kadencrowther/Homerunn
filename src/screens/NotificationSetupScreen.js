import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  Platform,
  Alert
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 9;
const TOTAL_STEPS = 10;

const NotificationSetupScreen = ({ navigation, route }) => {
  const credentials = route.params?.credentials;
  const profile = route.params?.profile || {};

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);
  const buttonOpacity = useSharedValue(0);
  const skipOpacity = useSharedValue(0);
  const headerOpacity = useSharedValue(0);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: logoOpacity.value,
      transform: [
        { scale: logoScale.value }
      ]
    };
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [
        { translateY: (1 - headerOpacity.value) * 20 }
      ]
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        { translateY: (1 - contentOpacity.value) * 15 }
      ]
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
      transform: [
        { translateY: (1 - contentOpacity.value) * 20 }
      ]
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [
        { scale: buttonScale.value }
      ]
    };
  });

  const skipAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: skipOpacity.value
    };
  });

  // Start animations when component mounts
  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 1000, easing: Easing.out(Easing.back()) });
    
    headerOpacity.value = withTiming(1, { duration: 800 });
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    
    buttonScale.value = withDelay(800, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    
    skipOpacity.value = withDelay(1000, withTiming(1, { duration: 400 }));
  }, []);

  const handleEnableNotifications = async () => {
    try {
      // Animate button press
      buttonScale.value = withSequence(
        withTiming(0.92, { duration: 100 }),
        withTiming(1, { duration: 100 })
      );
      
      // Check current permissions first
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      // If permissions haven't been determined yet, request them
      if (existingStatus !== 'granted') {
        // This will trigger the native permission dialog
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
          android: {
            allowAnnouncements: true,
          }
        });
        
        finalStatus = status;
      }
      
      console.log('Notification permission status:', finalStatus);
      console.log('NotificationSetupScreen passing params:', route.params);
      
      // Whether permissions are granted or denied, proceed to the next screen
      navigation.navigate('Congratulations', route.params);
      
    } catch (error) {
      console.error('Notification error:', error);
      
      // Navigate to congratulations screen despite error
      navigation.navigate('Congratulations', route.params);
    }
  };

  const handleSkip = async () => {
    // Provide visual feedback
    skipOpacity.value = withSequence(
      withTiming(0.5, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    console.log('NotificationSetupScreen skipping with params:', route.params);
    
    // Navigate to congratulations screen
    navigation.navigate('Congratulations', route.params);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header row with back button and progress bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <Ionicons
              name="notifications-circle"
              size={width * 0.25}
              color="#fc565b"
              style={styles.logo}
            />
          </Animated.View>
          
          <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
            <Text style={styles.title}>Enable Notifications</Text>
            <Text style={styles.subtitle}>
              Get updates about new listings, price changes, and more
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.enableButton}
            onPress={handleEnableNotifications}
          >
            <Ionicons name="notifications" size={24} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Enable Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Not Now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.06,
    marginBottom: height * 0.02,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: height * 0.05,
  },
  headerContainer: {
    marginTop: height * 0.03,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
    marginTop: height * 0.05,
    width: '100%',
  },
  logo: {
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  titleContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: width * 0.08,
    fontWeight: '700',
    marginBottom: height * 0.02,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.04,
    paddingHorizontal: width * 0.05,
    lineHeight: width * 0.06,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: height * 0.03,
  },
  enableButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.1,
    width: width * 0.85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#fc565b',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: width * 0.02,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: height * 0.015,
    marginTop: height * 0.02,
  },
  skipButtonText: {
    color: '#fc565b',
    textAlign: 'center',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
});

export default NotificationSetupScreen;
