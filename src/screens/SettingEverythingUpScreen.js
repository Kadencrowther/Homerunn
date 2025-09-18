import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Dimensions,
  StatusBar
} from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, collection } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';
import { createDefaultFilterFromPreferences } from '../utils/createDefaultFilter';

const { width, height } = Dimensions.get('window');

const SettingEverythingUpScreen = ({ navigation, route }) => {
  const [statusMessage, setStatusMessage] = useState('Initializing...');
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
  const Credentials = {
    Email: credentials?.email,
    Password: credentials?.password
  };
  
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
    Coordinates: params.coordinates || null
  };
  
  const MarketingSource = marketingSource;
  const HasAgent = hasAgent;
  const AgentName = agentName;
  
  // Log the data we received for debugging in a more detailed format using PascalCase
  console.log("SettingEverythingUpScreen detailed params check:", { 
    HasCredentials: !!Credentials,
    Email: Credentials?.Email || "Not provided",
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
  
  // Animation values
  const titleOpacity = useSharedValue(0);
  const messageOpacity = useSharedValue(0);
  const statusOpacity = useSharedValue(0);

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

  // Start animations when component mounts
  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 800 });
    messageOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    statusOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
    
    // Start the authentication and setup process
    setupUserAccount();
  }, []);
  
  const setupUserAccount = async () => {
    try {
      // Step 1: Create user account
      await createUserAccount();
      
      // Step 2: Set up user preferences
      await setupUserPreferences();
      
      // Log completion but don't navigate
      console.log('All setup steps completed successfully');
      console.log('Setup process complete - waiting for manual navigation');
      
      // No automatic navigation - this will be handled elsewhere
      
    } catch (error) {
      console.error('Setup process error:', error);
      setStatusMessage('Something went wrong. Please try again.');
      console.log('Setup failed, not navigating automatically');
    }
  };

  const createUserAccount = async () => {
    try {
      setStatusMessage('Setting up your account...');
      console.log('Starting account creation with:', Credentials);
      
      const { Email, Password } = Credentials;
      
      if (!Email || !Password) {
        console.error('Missing credentials:', { Email, Password });
        throw new Error('Missing email or password');
      }

      let userCredential;
      try {
        // Create the Firebase user account
        userCredential = await createUserWithEmailAndPassword(auth, Email, Password);
        console.log('User account created successfully');
        setStatusMessage('Account created successfully!');
      } catch (error) {
        // If creation fails, try to sign in instead - user might exist already
        console.log('Error creating user, attempting to sign in:', error.message);
        setStatusMessage('Signing in to your account...');
        userCredential = await signInWithEmailAndPassword(auth, Email, Password);
        console.log('Authentication successful');
      }

      // Make sure we have a user object from either creation or sign-in
      if (!userCredential || !userCredential.user) {
        throw new Error('Failed to obtain user credentials after auth');
      }
      
      isAuthComplete.current = true;
      setStatusMessage('Authentication successful!');
      
    } catch (error) {
      console.error('Account creation/auth error:', error);
      isAuthComplete.current = false; // Mark as failed
      throw error;
    }
  };

  const setupUserPreferences = async () => {
    try {
      setStatusMessage('Setting up your preferences...');
      console.log('Setting up user preferences with data:', { 
        Profile, 
        Preferences, 
        Timeframe,
        Location,
        HasAgent,
        AgentName,
        MarketingSource
      });
      
      // Make sure we have a user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found when saving preferences');
      }
      
      // Create user data object with all fields in PascalCase
      const userData = {
        Credentials,
        Profile,
        Preferences,
        Timeframe,
        Location,
        HasAgent,
        AgentName,
        MarketingSource,
        DateCreated: new Date().toISOString(),
        UserId: currentUser.uid,
        AuthId: currentUser.uid // Explicitly add Auth ID for clarity
      };
      
      console.log('User data prepared for database in PascalCase:', userData);
      console.log('Firebase Auth User ID saved to document:', currentUser.uid);
      setStatusMessage('Saving your profile to our database...');
      
      try {
        // Save to Firestore in the Users collection
        const userDocRef = doc(db, 'Users', currentUser.uid);
        await setDoc(userDocRef, userData);
        console.log('User data successfully saved to Firestore!');
        
        // Create default filter based on user preferences
        setStatusMessage('Creating your personalized filter...');
        try {
          await createDefaultFilterFromPreferences(currentUser.uid, userData);
          console.log('Default filter created successfully!');
          console.log('✅ FILTER SET SUCCESSFULLY - READY FOR NAVIGATION');
        } catch (filterError) {
          console.error('Error creating default filter:', filterError);
          // Don't fail the entire setup if filter creation fails
        }
        
        // Verify data was saved
        setStatusMessage('Verifying your data was saved correctly...');
        console.log('Data save successful! User document created with ID:', currentUser.uid);
        
        // Mark setup as complete
        isSetupComplete.current = true;
        
        // Show success message
        setStatusMessage('Setup complete! Navigating to home...');
        console.log('🚀 NAVIGATING TO HOME SCREEN - FILTER SHOULD BE ACTIVE');
        
        // Navigate to home screen after filter is created
        setTimeout(() => {
          navigation.replace('Home');
        }, 1000); // Small delay to show completion message
        
      } catch (firestoreError) {
        console.error('Firestore save error:', firestoreError);
        setStatusMessage('Error saving your data, retrying...');
        
        // Wait and retry once more
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const userDocRef = doc(db, 'Users', currentUser.uid);
          await setDoc(userDocRef, userData);
          console.log('Second attempt: User data successfully saved to Firestore!');
          
          // Create default filter based on user preferences (retry)
          setStatusMessage('Creating your personalized filter...');
          try {
            await createDefaultFilterFromPreferences(currentUser.uid, userData);
            console.log('Default filter created successfully on retry!');
            console.log('✅ FILTER SET SUCCESSFULLY ON RETRY - READY FOR NAVIGATION');
          } catch (filterError) {
            console.error('Error creating default filter on retry:', filterError);
            // Don't fail the entire setup if filter creation fails
          }
          
          // Mark setup as complete
          isSetupComplete.current = true;
          
          // Show success message
          setStatusMessage('Setup complete after retry! Navigating to home...');
          console.log('🚀 NAVIGATING TO HOME SCREEN AFTER RETRY - FILTER SHOULD BE ACTIVE');
          
          // Navigate to home screen after filter is created
          setTimeout(() => {
            navigation.replace('Home');
          }, 1000); // Small delay to show completion message
          
        } catch (retryError) {
          console.error('Even retry failed:', retryError);
          isSetupComplete.current = false;
          setStatusMessage('Could not save your profile. Please try again.');
          throw new Error('Failed to save user data after retry: ' + retryError.message);
        }
      }
    } catch (error) {
      console.error('Error setting up user preferences:', error);
      setStatusMessage('Something went wrong saving your profile.');
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
          <ActivityIndicator size="large" color="#fc565b" style={styles.spinner} />
        </Animated.View>
        
        <Animated.View style={[styles.statusContainer, statusAnimatedStyle]}>
          <Text style={styles.statusText}>{statusMessage}</Text>
          <ActivityIndicator size="small" color="#fc565b" style={styles.statusIndicator} />
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
    transform: [{ scale: 1.5 }],
  },
  statusContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusText: {
    fontSize: width * 0.045,
    color: '#666',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  statusIndicator: {
    marginTop: height * 0.02,
  }
});

export default SettingEverythingUpScreen; 