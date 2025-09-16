import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import * as Location from 'expo-location';
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
const CURRENT_STEP = 8;
const TOTAL_STEPS = 10;

const ProfileCompletionScreen = ({ navigation, route }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const userData = route.params || {};
  const [isFocused, setIsFocused] = useState({ 
    firstName: false, 
    lastName: false, 
    address: false,
    phoneNumber: false 
  });
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const firstNameInputScale = useSharedValue(0.95);
  const lastNameInputScale = useSharedValue(0.95);
  const addressInputScale = useSharedValue(0.95);
  const phoneInputScale = useSharedValue(0.95);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: (1 - headerOpacity.value) * -20 }]
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: (1 - formOpacity.value) * 20 }]
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
      transform: [{ translateY: (1 - buttonsOpacity.value) * 20 }]
    };
  });

  const firstNameInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: firstNameInputScale.value }]
    };
  });

  const lastNameInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: lastNameInputScale.value }]
    };
  });

  const addressInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: addressInputScale.value }]
    };
  });

  const phoneInputAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: phoneInputScale.value }]
    };
  });
  
  // Animate elements on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    formOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    firstNameInputScale.value = withDelay(500, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    lastNameInputScale.value = withDelay(600, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    addressInputScale.value = withDelay(700, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    phoneInputScale.value = withDelay(800, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
  }, []);

  // Request location permissions on component mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Access Required',
          'Homerunn needs access to your location to show properties in your area.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleFocus = (field) => {
    setIsFocused({ ...isFocused, [field]: true });
    
    const animateField = (scaleValue) => {
      scaleValue.value = withSequence(
        withTiming(0.98, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
    };
    
    if (field === 'firstName') {
      animateField(firstNameInputScale);
    } else if (field === 'lastName') {
      animateField(lastNameInputScale);
    } else if (field === 'address') {
      animateField(addressInputScale);
    } else if (field === 'phoneNumber') {
      animateField(phoneInputScale);
    }
  };
  
  const handleBlur = (field) => {
    setIsFocused({ ...isFocused, [field]: false });
  };
  
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digit characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format the phone number as (XXX) XXX-XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted += cleaned.substring(0, Math.min(3, cleaned.length));
      if (cleaned.length > 3) {
        formatted = '(' + formatted + ') ' + cleaned.substring(3, Math.min(6, cleaned.length));
        if (cleaned.length > 6) {
          formatted += '-' + cleaned.substring(6, Math.min(10, cleaned.length));
        }
      }
    }
    
    return formatted;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
  };

  const handleContinue = () => {
    // Check if all fields are filled
    if (!firstName || !lastName || !phoneNumber || !address) {
      Alert.alert(
        "All Fields Required",
        "Please fill out all fields to continue.",
        [{ text: "OK" }]
      );
      return;
    }
    
    console.log('ProfileCompletionScreen passing params:', {
      ...userData,
      profile: { 
        firstName, 
        lastName, 
        address, 
        phoneNumber 
      }
    });
    
    navigation.navigate('NotificationSetup', {
      ...userData,
      profile: { 
        firstName, 
        lastName, 
        address, 
        phoneNumber 
      }
    });
  };

  const handleSkip = () => {
    console.log('ProfileCompletionScreen skipping with params:', {
      ...userData,
      profile: { 
        firstName: '', 
        lastName: '', 
        address: '', 
        phoneNumber: '' 
      }
    });
    
    navigation.navigate('NotificationSetup', {
      ...userData,
      profile: { 
        firstName: '', 
        lastName: '', 
        address: '', 
        phoneNumber: '' 
      }
    });
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
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
        
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Help us personalize your experience</Text>
        </Animated.View>

        <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person-outline" size={16} color="#666" /> First Name
            </Text>
            <Animated.View style={[
              styles.inputWrapper,
              firstNameInputAnimatedStyle,
              isFocused.firstName && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                value={firstName}
                onChangeText={setFirstName}
                placeholderTextColor="#aaa"
                onFocus={() => handleFocus('firstName')}
                onBlur={() => handleBlur('firstName')}
              />
            </Animated.View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="person-outline" size={16} color="#666" /> Last Name
            </Text>
            <Animated.View style={[
              styles.inputWrapper,
              lastNameInputAnimatedStyle,
              isFocused.lastName && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                value={lastName}
                onChangeText={setLastName}
                placeholderTextColor="#aaa"
                onFocus={() => handleFocus('lastName')}
                onBlur={() => handleBlur('lastName')}
              />
            </Animated.View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="call-outline" size={16} color="#666" /> Phone Number
            </Text>
            <Animated.View style={[
              styles.inputWrapper,
              phoneInputAnimatedStyle,
              isFocused.phoneNumber && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                placeholderTextColor="#aaa"
                keyboardType="phone-pad"
                onFocus={() => handleFocus('phoneNumber')}
                onBlur={() => handleBlur('phoneNumber')}
              />
            </Animated.View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              <Ionicons name="location-outline" size={16} color="#666" /> Address
            </Text>
            <Animated.View style={[
              styles.inputWrapper,
              addressInputAnimatedStyle,
              isFocused.address && styles.inputWrapperFocused
            ]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your current address"
                value={address}
                onChangeText={setAddress}
                placeholderTextColor="#aaa"
                onFocus={() => handleFocus('address')}
                onBlur={() => handleBlur('address')}
              />
            </Animated.View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
          <TouchableOpacity 
            style={[
              styles.continueButton,
              (!firstName || !lastName || !phoneNumber || !address) && styles.disabledButton
            ]} 
            onPress={handleContinue}
            disabled={!firstName || !lastName || !phoneNumber || !address}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.skipButton} 
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  headerContainer: {
    marginTop: height * 0.03,
    marginBottom: height * 0.02,
    alignItems: 'center',
    paddingHorizontal: width * 0.08,
  },
  title: {
    fontSize: width * 0.075,
    fontWeight: '700',
    marginBottom: height * 0.015,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#666',
    textAlign: 'center',
    lineHeight: width * 0.06,
  },
  formContainer: {
    paddingHorizontal: width * 0.05,
  },
  inputGroup: {
    marginBottom: height * 0.025,
  },
  inputLabel: {
    fontSize: width * 0.04,
    color: '#666',
    marginBottom: height * 0.01,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: width * 0.03,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    borderColor: '#fc565b',
    backgroundColor: '#fff',
    shadowOpacity: 0.1,
  },
  input: {
    padding: height * 0.016,
    fontSize: width * 0.04,
    color: '#333',
  },
  bottomContainer: {
    marginTop: height * 0.02,
    paddingBottom: height * 0.04,
    width: '100%',
    paddingHorizontal: width * 0.05,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(252, 86, 91, 0.5)',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: height * 0.01,
    width: '100%',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#fc565b',
    textAlign: 'center',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
});

export default ProfileCompletionScreen;
