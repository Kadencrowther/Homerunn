import React from 'react';
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
  // Always start with Splash on first load, afterwards SetupNavigator won't be used
  // for authenticated users (they'll go to the main tab navigator)
  const initialRoute = 'Splash';
  
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
