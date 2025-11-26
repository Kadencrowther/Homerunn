import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from '../screens/WelcomScreen';
import AccountCreationScreen from '../screens/AccountCreationScreen';
import LoginScreen from '../screens/LoginScreen';
import UserInfoScreen from '../screens/UserInfoScreen';
import PersonalPreferencesScreen from '../screens/Personalpreferencesscreen';
import TimeframeScreen from '../screens/TimeframeScreen';
import AgentScreen from '../screens/AgentScreen';
import LocationScreen from '../screens/LocationScreen';
import ReviewScreen from '../screens/ReviewScreen';
import MarketingSourceScreen from '../screens/MarketingSourceScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';
import NotificationSetupScreen from '../screens/NotificationSetupScreen';
import CongratulationsScreen from '../screens/CongratulationsScreen';
import SettingEverythingUpScreen from '../screens/SettingEverythingUpScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Import the flag from SplashScreen
import { splashHasRun } from '../screens/SplashScreen';

const Stack = createStackNavigator();

// Custom animation for splash to welcome transition
const splashToWelcomeTransition = {
  cardStyleInterpolator: ({ current, next, layouts }) => {
    // Welcome Screen comes in from the top
    const translateY = current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-layouts.screen.height, 0],
    });

    // Splash Screen exits downward
    const splashTranslateY = next?.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, layouts.screen.height],
    }) || 0;

    return {
      cardStyle: {
        transform: [{ translateY }],
      },
      overlayStyle: {
        opacity: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.5],
        }),
      },
      containerStyle: {
        transform: [{ translateY: splashTranslateY }],
      },
    };
  },
};

const SetupNavigator = () => {
  const [initialRoute, setInitialRoute] = useState('Splash');
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated but hasn't completed onboarding
    const checkUserStatus = async () => {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'Users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          // If user exists but hasn't completed onboarding, skip splash and welcome
          if (userData && !userData.HasCompletedOnboarding) {
            console.log('🎯 SetupNavigator: User authenticated but onboarding incomplete, starting at UserInfo');
            setInitialRoute('UserInfo');
          } else {
            console.log('🎯 SetupNavigator: User authenticated and onboarding complete, starting at Welcome');
            setInitialRoute('Welcome');
          }
        } catch (error) {
          console.error('Error checking user onboarding status:', error);
          console.log('🎯 SetupNavigator: Error checking user, starting at Welcome');
          setInitialRoute('Welcome');
        }
      } else {
        console.log('🎯 SetupNavigator: No user found, starting at Welcome (skip Splash)');
        setInitialRoute('Welcome');
      }
      
      setIsChecking(false);
    };
    
    checkUserStatus();
  }, []);
  
  // Show nothing while checking (very brief)
  if (isChecking) {
    return null;
  }
  
  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
        animationEnabled: true
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          ...splashToWelcomeTransition,
          gestureEnabled: false  // Disables the swipe back gesture
        }}
      />
      <Stack.Screen 
        name="AccountCreation" 
        component={AccountCreationScreen}
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            const translateY = current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [-layouts.screen.height, 0],
            });

            const prevTranslateY = next?.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, layouts.screen.height],
            }) || 0;

            return {
              cardStyle: {
                transform: [{ translateY }],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
              containerStyle: {
                transform: [{ translateY: prevTranslateY }],
              },
            };
          },
        }}
      />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
        options={{
          cardStyleInterpolator: ({ current, next, layouts }) => {
            const translateY = current.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [layouts.screen.height, 0],
            });

            const prevTranslateY = next?.progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, layouts.screen.height],
            }) || 0;

            return {
              cardStyle: {
                transform: [{ translateY }],
              },
              overlayStyle: {
                opacity: current.progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
              containerStyle: {
                transform: [{ translateY: prevTranslateY }],
              },
            };
          },
        }}
      />
      <Stack.Screen name="UserInfo" component={UserInfoScreen} />
      <Stack.Screen name="PersonalPreferences" component={PersonalPreferencesScreen} />
      <Stack.Screen name="Timeframe" component={TimeframeScreen} />
      <Stack.Screen name="Agent" component={AgentScreen} />
      <Stack.Screen name="Location" component={LocationScreen} />
      <Stack.Screen name="ReviewScreen" component={ReviewScreen} />
      <Stack.Screen name="MarketingSource" component={MarketingSourceScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
      <Stack.Screen name="NotificationSetup" component={NotificationSetupScreen} />
      <Stack.Screen name="Congratulations" component={CongratulationsScreen} />
      <Stack.Screen name="SettingEverythingUp" component={SettingEverythingUpScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
};

export default SetupNavigator;
