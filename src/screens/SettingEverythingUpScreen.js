import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { CommonActions } from '@react-navigation/native';
import { useOnboarding } from '../context/OnboardingContext';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { createDefaultFilterFromPreferences } from '../utils/createDefaultFilter';
import Spinner from '../components/Spinner';

const { width, height } = Dimensions.get('window');

const SettingEverythingUpScreen = ({ navigation, route }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Starting setup...');
  const { completeOnboarding, hasCompletedOnboarding } = useOnboarding();
  
  // Extract all parameters from the navigation chain
  const params = route.params || {};
  
  // Extract original parameters (keep these to avoid breaking parameter passing)
  const credentials = params.credentials || {};
  const profile = params.profile || {};
  const preferences = params.preferences || [];
  const timeframe = params.timeframe || null;
  const location = params.location || null;
  const marketingSource = params.marketingSource || null;
  const hasAgent = params.hasAgent || false;
  const agentName = params.agentName || null;
  
  // Create PascalCase versions of all parameters for database consistency
  // Only include Credentials if email and password exist (email/password sign up flow)
  const Credentials = credentials?.email && credentials?.password ? {
    Email: credentials.email,
    Password: credentials.password
  } : null;
  
  // Convert profile fields to PascalCase
  const Profile = {
    FirstName: profile?.firstName,
    LastName: profile?.lastName,
    PhoneNumber: profile?.phoneNumber,
    Address: profile?.address
  };
  
  const Preferences = [...preferences];
  const Timeframe = timeframe;
  
  // Extract location and radius information
  const Location = {
    Name: location,
    RadiusMiles: params.radiusMiles || 10, // Default to 10 miles if not specified
    Coordinates: params.coordinates ? {
      Latitude: params.coordinates.latitude,
      Longitude: params.coordinates.longitude
    } : null,
    MapRegion: params.mapRegion ? {
      Latitude: params.mapRegion.latitude,
      Longitude: params.mapRegion.longitude,
      LatitudeDelta: params.mapRegion.latitudeDelta,
      LongitudeDelta: params.mapRegion.longitudeDelta
    } : null
  };
  
  const MarketingSource = marketingSource;
  const HasAgent = hasAgent;
  const AgentName = agentName;
  
  // Log the data we received for debugging in a more detailed format using PascalCase
  console.log("SettingEverythingUpScreen detailed params check:", { 
    HasCredentials: !!Credentials,
    Email: Credentials?.Email || "Not provided (Apple Sign In or no email)",
    HasPassword: !!Credentials?.Password,
    Profile: Profile,
    PreferencesCount: Preferences?.length || 0,
    Timeframe: Timeframe || "Not specified",
    Location: Location?.Name || "Not specified", 
    LocationRadius: Location?.RadiusMiles || "Not specified",
    HasLocationCoordinates: !!Location?.Coordinates,
    MarketingSource: MarketingSource || "Not specified",
    HasAgent: HasAgent || "Not specified",
    AgentName: AgentName || "Not specified"
  });
  
  // Refs to track process completion
  const isAuthComplete = useRef(false);
  const isSetupComplete = useRef(false);
  const hasNavigated = useRef(false);
  
  // Animation values
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const statusOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  // Animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: titleOpacity.value,
      transform: [{ translateY: (1 - titleOpacity.value) * -20 }]
    };
  });

  const messageAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: messageOpacity.value,
    };
  });

  const statusAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: statusOpacity.value,
    };
  });

  const progressAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  // Start animations when component mounts
  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 800 });
    messageOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    statusOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    
    // Start the authentication and setup process
    setupUserAccount();
  }, []);

  // Monitor onboarding completion and navigate when ready
  useEffect(() => {
    if (hasCompletedOnboarding && progress === 100 && !hasNavigated.current) {
      console.log('✅ All conditions met: progress 100%, context updated, navigating now');
      hasNavigated.current = true;
      
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'App' }],
        });
      }, 500);
    }
  }, [hasCompletedOnboarding, progress]);
  
  const setupUserAccount = async () => {
    try {
      // Step 1: Authentication (0% → 25%)
      setCurrentStep('Authenticating...');
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('No authenticated user found, creating account with email/password');
        await createUserAccount();
      } else {
        console.log('User already authenticated:', currentUser.uid);
        console.log('Auth provider:', currentUser.providerData[0]?.providerId || 'unknown');
        isAuthComplete.current = true;
      }
      
      setProgress(25);
      progressWidth.value = withTiming(25, { duration: 300 });
      console.log('✅ Step 1/4 complete: Authentication (25%)');
      
      // Step 2: Set up user preferences
      await setupUserPreferences();
      
      console.log('✅ All setup steps completed successfully');
      
    } catch (error) {
      console.error('Setup process error:', error);
      setCurrentStep('Setup failed. Please try again.');
      console.log('Setup failed, not navigating automatically');
    }
  };

  const createUserAccount = async () => {
    try {
      console.log('Starting account creation with:', Credentials);
      
      const { Email, Password } = Credentials;
      
      if (!Email || !Password) {
        console.error('Missing credentials:', { Email, Password });
        throw new Error('Missing email or password');
      }

      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, Email, Password);
        console.log('User account created successfully');
      } catch (error) {
        console.log('Error creating user, attempting to sign in:', error.message);
        userCredential = await signInWithEmailAndPassword(auth, Email, Password);
        console.log('Authentication successful');
      }

      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to obtain user credentials after auth');
      }
      
      isAuthComplete.current = true;
      
    } catch (error) {
      console.error('Account creation/auth error:', error);
      isAuthComplete.current = false;
      throw error;
    }
  };

  const setupUserPreferences = async () => {
    try {
      // Step 2: Save preferences (25% → 50%)
      setCurrentStep('Saving your preferences...');
      console.log('Setting up user preferences with data:', { 
        Profile, 
        Preferences, 
        Timeframe,
        Location,
        HasAgent,
        AgentName,
        MarketingSource
      });
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found when saving preferences');
      }
      
      const notificationData = route.params?.notificationData;
      console.log('Notification data from onboarding:', notificationData);
      
      // Create user data object with all fields in PascalCase
      // Only include Credentials if they exist (email/password flow)
      const userData = {
        ...(Credentials && { Credentials }), // Only add if not null
        Profile,
        Preferences,
        Timeframe,
        Location,
        HasAgent,
        AgentName,
        MarketingSource,
        HasCompletedOnboarding: true,
        IsActive: true,
        // Include notification data if collected during onboarding
        NotificationsEnabled: notificationData?.notificationsEnabled || false,
        ...(notificationData?.pushToken && { 
          DeviceNotificationToken: notificationData.pushToken,
          AppNotificationsEnabled: true
        }),
        NotificationDevices: [], // Initialize empty devices array (will be populated by service)
        DateCreated: new Date().toISOString(),
        UserId: currentUser.uid,
        AuthId: currentUser.uid // Explicitly add Auth ID for clarity
      };
      
      console.log('User data prepared for database in PascalCase:', userData);
      console.log('Credentials included:', !!Credentials);
      console.log('Firebase Auth User ID saved to document:', currentUser.uid);
      
      try {
        // Save to Firestore
        const userDocRef = doc(db, 'Users', currentUser.uid);
        await setDoc(userDocRef, userData, { merge: true });
        console.log('User data successfully saved to Firestore with merge!');
        
        setProgress(50);
        progressWidth.value = withTiming(50, { duration: 300 });
        console.log('✅ Step 2/4 complete: User data saved (50%)');
        
        // Step 3: Create default filter (50% → 75%)
        setCurrentStep('Creating your personalized filter...');
        try {
          await createDefaultFilterFromPreferences(currentUser.uid, userData);
          console.log('Default filter created successfully!');
        } catch (filterError) {
          console.error('Error creating default filter:', filterError);
        }
        
        setProgress(75);
        progressWidth.value = withTiming(75, { duration: 300 });
        console.log('✅ Step 3/4 complete: Filter created (75%)');
        
        // Step 4: Trigger onboarding completion (75% → 100%)
        setCurrentStep('Finalizing your account...');
        console.log('Data save successful! User document created/updated with ID:', currentUser.uid);
        
        isSetupComplete.current = true;
        
        // Trigger the onboarding context
        completeOnboarding();
        console.log('✅ OnboardingContext triggered - waiting for state confirmation');
        
        // Wait a moment for context to update before setting progress to 100
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setProgress(100);
        progressWidth.value = withTiming(100, { duration: 300 });
        console.log('✅ Step 4/4 complete: Setup finished (100%)');
        setCurrentStep('All set! Loading your home feed...');
        
      } catch (firestoreError) {
        console.error('Firestore save error:', firestoreError);
        setCurrentStep('Error saving data, retrying...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const userDocRef = doc(db, 'Users', currentUser.uid);
          await setDoc(userDocRef, userData, { merge: true });
          console.log('Second attempt: User data successfully saved to Firestore with merge!');
          
          setProgress(50);
          progressWidth.value = withTiming(50, { duration: 300 });
          
          setCurrentStep('Creating your personalized filter...');
          try {
            await createDefaultFilterFromPreferences(currentUser.uid, userData);
            console.log('Default filter created successfully on retry!');
          } catch (filterError) {
            console.error('Error creating default filter on retry:', filterError);
          }
          
          setProgress(75);
          progressWidth.value = withTiming(75, { duration: 300 });
          
          setCurrentStep('Finalizing your account...');
          isSetupComplete.current = true;
          
          completeOnboarding();
          console.log('✅ OnboardingContext triggered on retry - waiting for state confirmation');
          
          setProgress(100);
          progressWidth.value = withTiming(100, { duration: 300 });
          setCurrentStep('All set! Loading your home feed...');
          
        } catch (retryError) {
          console.error('Even retry failed:', retryError);
          isSetupComplete.current = false;
          setCurrentStep('Could not save your profile. Please try again.');
          throw new Error('Failed to save user data after retry: ' + retryError.message);
        }
      }
    } catch (error) {
      console.error('Error setting up user preferences:', error);
      setCurrentStep('Something went wrong saving your profile.');
      isSetupComplete.current = false;
      throw error;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.contentContainer}>
        <Animated.View style={[styles.titleContainer, titleAnimatedStyle]}>
          <Text style={styles.title}>We are setting everything up for you!</Text>
        </Animated.View>
        
        <Animated.View style={[styles.loadingContainer, messageAnimatedStyle]}>
          <Spinner size="lg" color="salmon" style={styles.spinner} />
        </Animated.View>
        
        <Animated.View style={[styles.progressBarWrapper, statusAnimatedStyle]}>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <Animated.View 
                style={[styles.progressBarFill, progressAnimatedStyle]} 
              />
            </View>
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </Animated.View>
        
        <Animated.View style={[styles.statusContainer, statusAnimatedStyle]}>
          <Text style={styles.statusText}>{currentStep}</Text>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.08,
  },
  title: {
    fontSize: width * 0.075,
    fontWeight: '700',
    textAlign: 'center',
    color: '#333',
  },
  loadingContainer: {
    marginBottom: height * 0.08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginBottom: height * 0.02,
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: width * 0.045,
    color: '#666',
    textAlign: 'center',
  },
  progressBarWrapper: {
    width: '80%',
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  progressBarContainer: {
    width: '100%',
    marginBottom: height * 0.015,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FC565B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: width * 0.05,
    fontWeight: '700',
    color: '#FC565B',
    marginTop: 4,
  }
});

export default SettingEverythingUpScreen; 