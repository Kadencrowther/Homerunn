import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { PropertyProvider } from './contexts/PropertyContext';
import SetupNavigator from './navigation/SetupNavigator';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from './screens/SplashScreen';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const Stack = createStackNavigator();

const NavigationWrapper = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [splashComplete, setSplashComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Only set user if they're fully authenticated
        // This prevents partially created accounts from being considered as authenticated
        if (user.emailVerified || user.providerData.length > 0) {
          setUser(user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      // Ensure we move past the splash screen even if animation fails
      const timer = setTimeout(() => {
        setInitializing(false);
      }, 5000); // Safety timeout

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);

  // If either the splash animation completes OR the auth state is determined AND min time passed,
  // we should exit the splash screen
  const shouldShowApp = !initializing || splashComplete;

  const handleSplashComplete = () => {
    // Mark splash animation as complete
    setSplashComplete(true);
    
    // Give a slight delay after animation before moving on
    setTimeout(() => {
      setInitializing(false);
    }, 250);
  };

  if (!shouldShowApp) {
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // User is fully authenticated - show main app
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          // No user or incomplete auth - show welcome/onboarding flow
          <Stack.Screen name="Setup" component={SetupNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <PropertyProvider>
      <AuthProvider>
        <SavedPropertiesProvider>
          <NavigationWrapper />
        </SavedPropertiesProvider>
      </AuthProvider>
    </PropertyProvider>
  );
};

export default App; 