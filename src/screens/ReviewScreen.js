import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Platform,
  StatusBar,
  Alert,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';
import { useEffect } from 'react';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 6;
const TOTAL_STEPS = 10;

const ReviewScreen = ({ navigation, route }) => {
  // Get all the data passed from previous screens
  const userData = route.params || {};
  
  // Add debug logging to show what parameters are received
  console.log('ReviewScreen received params:', {
    hasCredentials: !!userData.credentials,
    credentialsType: typeof userData.credentials,
    email: userData.credentials?.email,
    hasPassword: !!userData.credentials?.password,
    preferences: userData.preferences,
    timeframe: userData.timeframe,
    location: userData.location,
    hasAgent: userData.hasAgent
  });
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  // Star animations - separate value for each star
  const starScale = Array(5).fill(0).map(() => useSharedValue(0.5));
  const starOpacity = Array(5).fill(0).map(() => useSharedValue(0));
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }]
    };
  });
  
  const starAnimatedStyle = (index) => useAnimatedStyle(() => {
    return {
      opacity: starOpacity[index].value,
      transform: [{ scale: starScale[index].value }]
    };
  });
  
  // Animate elements on mount
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    scale.value = withTiming(1, { duration: 600 });
    
    // Animate stars sequentially
    for (let i = 0; i < 5; i++) {
      starOpacity[i].value = withDelay(600 + (i * 150), withTiming(1, { duration: 300 }));
      starScale[i].value = withDelay(600 + (i * 150), 
        withSequence(
          withTiming(1.2, { duration: 300 }),
          withTiming(1, { duration: 150 })
        )
      );
    }
  }, []);
  
  const handleReviewRequest = async () => {
    // App Store and Play Store URLs 
    const APP_STORE_ID = 'YOUR_APP_ID'; // Replace with your actual App Store ID
    const PLAY_STORE_PACKAGE = 'YOUR_PACKAGE_NAME'; // Replace with your actual package name
  
    const appStoreUrl = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE}&reviewId=0`;
  
    const url = Platform.OS === 'ios' ? appStoreUrl : playStoreUrl;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Couldn't Open App Store",
          "Please rate our app when you have a chance!",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.log('Error opening store link:', error);
    }
    
    // Navigate to next screen after a short delay
    setTimeout(() => {
      console.log('ReviewScreen navigating to MarketingSource with params:', userData);
      navigation.navigate('MarketingSource', userData);
    }, 1500);
  };
  
  const handleCancel = () => {
    console.log('ReviewScreen cancelling and navigating to MarketingSource with params:', userData);
    navigation.navigate('MarketingSource', userData);
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
      
      <Animated.View style={[styles.contentContainer, containerStyle]}>
        <Text style={styles.title}>Help Us Reach More People</Text>
        
        <View style={styles.starsContainer}>
          {[...Array(5)].map((_, index) => (
            <Animated.View key={index} style={[starAnimatedStyle(index), styles.starWrapper]}>
              <Ionicons 
                name="star" 
                size={56} 
                color="#fc565b" 
                style={styles.star} 
              />
            </Animated.View>
          ))}
        </View>
        
        <Text style={styles.subtitle}>
          Love using Homerunn? Your review helps us grow and improve!
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.reviewButton}
            onPress={handleReviewRequest}
          >
            <Ionicons 
              name={Platform.OS === 'ios' ? "logo-apple" : "logo-google-playstore"} 
              size={24} 
              color="#fff" 
              style={styles.buttonIcon} 
            />
            <Text style={styles.buttonText}>Rate Our App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
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
    alignItems: 'center',
    paddingVertical: height * 0.02,
  },
  title: {
    fontSize: width * 0.075,
    fontWeight: '700',
    marginBottom: height * 0.04,
    textAlign: 'center',
    color: '#333',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: height * 0.05,
  },
  starWrapper: {
    marginHorizontal: width * 0.015,
    shadowColor: '#fc565b',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  star: {
    marginHorizontal: width * 0.01,
  },
  subtitle: {
    fontSize: width * 0.045,
    textAlign: 'center',
    color: '#666',
    marginBottom: height * 0.05,
    paddingHorizontal: width * 0.1,
    lineHeight: width * 0.06,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  reviewButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.06,
    borderRadius: width * 0.08,
    marginBottom: height * 0.02,
    width: width * 0.8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#fc565b',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.84,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: width * 0.02,
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: height * 0.018,
    width: width * 0.8,
    alignItems: 'center',
    marginTop: height * 0.01,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
});

export default ReviewScreen; 