import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { PropertyProvider } from './contexts/PropertyContext';
import SetupNavigator from './navigation/SetupNavigator';
import AppNavigator from './navigation/AppNavigator';
import SplashScreen from './screens/SplashScreen';
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const Stack = createStackNavigator();

const NavigationWrapper = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const { onboardingComplete } = useOnboarding();
  const navigationRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed. User exists:', !!user);
      
      if (user) {
        console.log('👤 User detected:');
        console.log('  - UID:', user.uid);
        console.log('  - Email:', user.email);
        console.log('  - Email verified:', user.emailVerified);
        console.log('  - Provider data:', user.providerData);
        console.log('  - Providers:', user.providerData.map(p => p.providerId).join(', '));
        
        // Check if user has completed onboarding
        try {
          const userDocRef = doc(db, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          console.log('📄 Firestore document exists:', userDoc.exists());
          if (userDoc.exists()) {
            console.log('  - HasCompletedOnboarding:', userData?.HasCompletedOnboarding);
            console.log('  - IsActive:', userData?.IsActive);
          } else {
            console.log('  - No Firestore document found for this user!');
          }
          
          // Only set user if they're fully authenticated
          if (user.emailVerified || user.providerData.length > 0) {
            setUser(user);
            setHasCompletedOnboarding(userData?.HasCompletedOnboarding || false);
            console.log('✅ User authenticated. Onboarding complete:', userData?.HasCompletedOnboarding || false);
            console.log('📍 Navigation decision: Show', userData?.HasCompletedOnboarding ? 'MAIN APP' : 'ONBOARDING');
          } else {
            console.log('❌ User not fully authenticated (no email verified or providers)');
            setUser(null);
            setHasCompletedOnboarding(false);
            console.log('📍 Navigation decision: Show ONBOARDING');
          }
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error);
          setUser(user);
          setHasCompletedOnboarding(false);
          console.log('📍 Navigation decision (after error): Show ONBOARDING');
        }
      } else {
        console.log('❌ No user authenticated');
        setUser(null);
        setHasCompletedOnboarding(false);
        console.log('📍 Navigation decision: Show ONBOARDING (Welcome screen)');
      }

      // Ensure we move past the splash screen even if animation fails
      const timer = setTimeout(() => {
        console.log('⏰ Safety timeout reached, setting initializing to false');
        setInitializing(false);
      }, 5000); // Safety timeout

      return () => clearTimeout(timer);
    });

    return () => unsubscribe();
  }, []);
  
  // Also watch for onboarding completion from context
  useEffect(() => {
    if (onboardingComplete && user) {
      console.log('🎉 Onboarding marked as complete from context, re-checking Firestore...');
      // Re-check the Firestore document
      const recheckOnboarding = async () => {
        try {
          const userDocRef = doc(db, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          if (userData?.HasCompletedOnboarding) {
            console.log('✅ Re-checked onboarding status: true');
            console.log('🔄 Updating state to show main app...');
            setHasCompletedOnboarding(true);
            
            // Navigate to App screen
            setTimeout(() => {
              if (navigationRef.current) {
                console.log('🚀 Navigating to App screen with tabs');
                navigationRef.current.navigate('App');
              }
            }, 500);
          } else {
            console.log('❌ Re-checked onboarding status: false');
          }
        } catch (error) {
          console.error('Error re-checking onboarding:', error);
        }
      };
      
      recheckOnboarding();
    }
  }, [onboardingComplete, user]);

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
    console.log('🎬 Showing splash screen');
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  console.log('🚀 Ready to show app. Checking navigation...');
  console.log('  - User exists:', !!user);
  console.log('  - Has completed onboarding:', hasCompletedOnboarding);
  console.log('  - Decision:', user && hasCompletedOnboarding ? 'AppNavigator (Main App)' : 'SetupNavigator (Onboarding)');

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user && hasCompletedOnboarding ? (
          // User is fully authenticated AND has completed onboarding - show main app
          <>
            {console.log('✅ Rendering AppNavigator (Main App with tabs)')}
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen name="Setup" component={SetupNavigator} />
          </>
        ) : (
          // No user OR incomplete onboarding - show welcome/onboarding flow
          <>
            {console.log('📝 Rendering SetupNavigator (Onboarding flow)')}
            <Stack.Screen name="Setup" component={SetupNavigator} />
            <Stack.Screen name="App" component={AppNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <PropertyProvider>
      <AuthProvider>
        <OnboardingProvider>
          <SavedPropertiesProvider>
            <NavigationWrapper />
          </SavedPropertiesProvider>
        </OnboardingProvider>
      </AuthProvider>
    </PropertyProvider>
  );
};

export default App; 