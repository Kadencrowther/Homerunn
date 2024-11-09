import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AccountCreationScreen from '../screens/AccountCreationScreen';
import TermsOfServiceScreen from '../screens/TermsOfServiceScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';
import NotificationSetupScreen from '../screens/NotificationSetupScreen';
import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PasswordResetConfirmationScreen from '../screens/PasswordResetConfirmationScreen';
import EmailVerificationScreen from '../screens/EmailVerificationScreen';
import PhoneVerificationScreen from '../screens/PhoneVerificationScreen';
import PersonalDetailsScreen from '../screens/PersonalDetailsScreen';
import MultiStepFormScreen from '../screens/MultiStepFormScreen';

const Stack = createStackNavigator();

const SetupNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AccountCreation" component={AccountCreationScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="ProfileCompletion" component={ProfileCompletionScreen} />
      <Stack.Screen name="NotificationSetup" component={NotificationSetupScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="PasswordResetConfirmation" component={PasswordResetConfirmationScreen} />
      <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="MultiStepForm" component={MultiStepFormScreen} />
    </Stack.Navigator>
  );
};

export default SetupNavigator;
