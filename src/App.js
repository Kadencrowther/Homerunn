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
  const [authChecked, setAuthChecked] = useState(false);
  const [firestoreChecked, setFirestoreChecked] = useState(false);
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
            const onboardingStatus = userData?.HasCompletedOnboarding || false;
            console.log('✅ User authenticated. Onboarding complete:', onboardingStatus);
            console.log('📍 Navigation decision: Show', onboardingStatus ? 'MAIN APP' : 'ONBOARDING');
            console.log('🔧 Setting firestoreChecked and authChecked to true');
            // Batch all state updates together
            setUser(user);
            setHasCompletedOnboarding(onboardingStatus);
            setFirestoreChecked(true);
            setAuthChecked(true);
          } else {
            console.log('❌ User not fully authenticated (no email verified or providers)');
            console.log('🔧 Setting firestoreChecked and authChecked to true');
            setUser(null);
            setHasCompletedOnboarding(false);
            setFirestoreChecked(true);
            setAuthChecked(true);
            console.log('📍 Navigation decision: Show ONBOARDING');
          }
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error);
          console.log('📍 Navigation decision (after error): Show ONBOARDING');
          console.log('🔧 Setting firestoreChecked and authChecked to true');
          setUser(user);
          setHasCompletedOnboarding(false);
          setFirestoreChecked(true);
          setAuthChecked(true);
        }
      } else {
        console.log('❌ No user authenticated (signed out or never signed in)');
        console.log('📍 Navigation decision: Show ONBOARDING (Welcome screen)');
        console.log('🔧 Resetting all state - setting user to null, onboarding to false');
        // Reset ALL state immediately when user signs out
        setUser(null);
        setHasCompletedOnboarding(false);
        setFirestoreChecked(true);
        setAuthChecked(true);
      }
    });

    // Safety timeout - mark both auth and firestore as checked if taking too long
    const timer = setTimeout(() => {
      console.log('⏰ Safety timeout reached - marking auth and firestore as checked');
      setFirestoreChecked(true);
      setAuthChecked(true);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  
  // Also watch for onboarding completion from context
  useEffect(() => {
    console.log('🔔 Onboarding completion watcher triggered. onboardingComplete:', onboardingComplete, ', user:', !!user);
    
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
            // Batch updates
            setHasCompletedOnboarding(true);
            setFirestoreChecked(true);
            
            // Reset navigation stack and navigate to App screen
            setTimeout(() => {
              if (navigationRef.current) {
                console.log('🚀 Resetting navigation to App screen with tabs');
                navigationRef.current.reset({
                  index: 0,
                  routes: [{ name: 'App' }],
                });
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

  // Watch for user sign out and force navigation to Welcome screen
  useEffect(() => {
    if (!user && authChecked && firestoreChecked && !initializing && navigationRef.current) {
      console.log('🚪 User signed out detected - forcing navigation to Welcome screen');
      setTimeout(() => {
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Setup' }],
          });
          console.log('✅ Navigated to Setup (Welcome screen)');
        }
      }, 100);
    }
  }, [user, authChecked, firestoreChecked, initializing]);

  const handleSplashComplete = () => {
    console.log('✅ Splash animation complete!');
    // Mark splash animation as complete
    setSplashComplete(true);
    
    // Give a slight delay after animation before moving on
    setTimeout(() => {
      console.log('✅ Moving to main navigation after splash');
      setInitializing(false);
    }, 250);
  };

  // ALWAYS show splash until animation is complete, regardless of auth state
  // Only show app when splash is complete AND auth is checked AND firestore is checked
  const shouldShowApp = splashComplete && authChecked && firestoreChecked && !initializing;

  if (!shouldShowApp) {
    console.log('🎬 Showing splash screen (splashComplete:', splashComplete, ', authChecked:', authChecked, ', firestoreChecked:', firestoreChecked, ', initializing:', initializing, ')');
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  console.log('🚀 Ready to show app. Checking navigation...');
  console.log('  - User exists:', !!user);
  console.log('  - Has completed onboarding:', hasCompletedOnboarding);
  
  // Determine which navigator to show
  // IMPORTANT: No user = ALWAYS show welcome/onboarding, regardless of hasCompletedOnboarding
  const showMainApp = !!user && hasCompletedOnboarding;
  console.log('  - Decision:', showMainApp ? 'AppNavigator (Main App)' : 'SetupNavigator (Onboarding/Welcome)');

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={showMainApp ? 'App' : 'Setup'}
      >
        {showMainApp ? (
          // User is fully authenticated AND has completed onboarding - show main app
          <>
            {console.log('✅ Rendering AppNavigator (Main App with tabs)')}
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen name="Setup" component={SetupNavigator} />
          </>
        ) : (
          // No user OR incomplete onboarding - show welcome/onboarding flow
          <>
            {console.log('📝 Rendering SetupNavigator (Onboarding/Welcome flow)')}
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