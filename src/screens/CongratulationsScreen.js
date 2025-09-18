import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
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
const CURRENT_STEP = 10;
const TOTAL_STEPS = 10;

const CongratulationsScreen = ({ navigation, route }) => {
  // Refs for confetti cannons (left and right sides)
  const leftConfettiRef = useRef(null);
  const rightConfettiRef = useRef(null);

  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const messageOpacity = useSharedValue(0);
  const privacyOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.95);
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.5);

  // Animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ scale: titleScale.value }]
    };
  });

  const messageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: messageOpacity.value,
      transform: [{ translateY: (1 - messageOpacity.value) * 20 }]
    };
  });

  const privacyAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: privacyOpacity.value,
      transform: [{ translateY: (1 - privacyOpacity.value) * 20 }]
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonScale.value }]
    };
  });

  const checkmarkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkOpacity.value,
      transform: [{ scale: checkmarkScale.value }]
    };
  });

  // Start animations when component mounts
  useEffect(() => {
    // Fire confetti when component mounts from both sides
    setTimeout(() => {
      if (leftConfettiRef.current) {
        leftConfettiRef.current.start();
      }
      if (rightConfettiRef.current) {
        rightConfettiRef.current.start();
      }
    }, 300);

    checkmarkOpacity.value = withTiming(1, { duration: 600 });
    checkmarkScale.value = withSequence(
      withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back()) }),
      withTiming(1, { duration: 400 })
    );
    
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    titleScale.value = withSequence(
      withDelay(300, withTiming(1.1, { duration: 1000, easing: Easing.out(Easing.back()) })),
      withDelay(1000, withTiming(1, { duration: 500 }))
    );
    
    messageOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    privacyOpacity.value = withDelay(1200, withTiming(1, { duration: 800 }));
    buttonOpacity.value = withDelay(1500, withTiming(1, { duration: 800 }));
    buttonScale.value = withDelay(1500, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);

  const handleContinue = () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.92, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    // Ensure the parameters include credentials and are properly logged
    const params = route.params || {};
    
    // Debug the parameters we're passing with detailed information
    console.log("CongratulationsScreen detailed params check:", {
      hasCredentials: !!params.credentials,
      credentialsType: typeof params.credentials,
      email: params.credentials?.email,
      hasPassword: !!params.credentials?.password,
      hasProfile: !!params.profile,
      hasPreferences: Array.isArray(params.preferences) && params.preferences.length > 0,
      hasTimeframe: !!params.timeframe,
      routeParams: params
    });
    
    // Navigate to the setup screen with all accumulated data
    navigation.navigate('SettingEverythingUp', params);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header row with back button and progress bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
        </View>
      </View>
      
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <View style={styles.titleRow}>
            <Animated.View style={[styles.checkmarkContainer, checkmarkAnimatedStyle]}>
              <Ionicons name="checkmark-circle" size={38} color="#fc565b" />
            </Animated.View>
            <Text style={styles.title}>All Done!</Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.messageContainer, messageAnimatedStyle]}>
          <Text style={styles.message}>Thank you for trusting us</Text>
        </Animated.View>
        
        <Animated.View style={[styles.privacyContainer, privacyAnimatedStyle]}>
          <Ionicons name="shield-checkmark" size={28} color="#fc565b" style={styles.privacyIcon} />
          <Text style={styles.privacyText}>
            We promise to always keep your personal information private and secure
          </Text>
        </Animated.View>
        
        <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Left side confetti */}
      <ConfettiCannon
        ref={leftConfettiRef}
        count={100}
        origin={{ x: -15, y: height * 0.45 }}
        fallSpeed={3000}
        explosionSpeed={750}
        fadeOut={true}
        autoStart={false}
        colors={['#fc565b', '#ffcc00', '#ff71ce', '#01cdfe', '#05ffa1', '#b967ff']}
        angle={45} // Diagonally up to the right
        particleSize={8}
        emitDuration={500}
      />
      
      {/* Right side confetti */}
      <ConfettiCannon
        ref={rightConfettiRef}
        count={100}
        origin={{ x: width + 10, y: height * 0.45 }}
        fallSpeed={3000}
        explosionSpeed={750}
        fadeOut={true}
        autoStart={false}
        colors={['#fc565b', '#ffcc00', '#ff71ce', '#01cdfe', '#05ffa1', '#b967ff']}
        angle={135} // Diagonally up to the left
        particleSize={8}
        emitDuration={500}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: width * 0.05,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.06,
    marginBottom: height * 0.02,
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
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.05,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.01,
  },
  checkmarkContainer: {
    marginRight: 15,
  },
  title: {
    fontSize: width * 0.09,
    fontWeight: '800',
    color: '#333',
    textAlign: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: height * 0.06,
  },
  message: {
    fontSize: width * 0.06,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 86, 91, 0.05)',
    padding: width * 0.05,
    borderRadius: width * 0.03,
    marginBottom: height * 0.08,
    maxWidth: width * 0.9,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  privacyIcon: {
    marginRight: width * 0.03,
  },
  privacyText: {
    fontSize: width * 0.04,
    color: '#444',
    flexShrink: 1,
    lineHeight: width * 0.055,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.08,
    borderRadius: width * 0.02,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
    width: '100%',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: width * 0.05,
    fontWeight: '600',
    marginRight: width * 0.02,
  },
  buttonIcon: {
    marginLeft: width * 0.01,
  },
});

export default CongratulationsScreen; 