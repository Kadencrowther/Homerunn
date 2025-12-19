import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './context/AuthContext';
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext';
import { SavedPropertiesProvider } from './context/SavedPropertiesContext';
import { NotificationProvider } from './context/NotificationProvider';
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const { onboardingComplete } = useOnboarding();
  const { isGuest } = useAuth();
  const navigationRef = useRef(null);
  const previousUserRef = useRef(null);
  const hasHandledInitialAuth = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔍 Auth state changed. User exists:', !!user);
      setIsCheckingAuth(true);
      
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
          let userDoc = await getDoc(userDocRef);
          let userData = userDoc.data();
          
          console.log('📄 Firestore document exists:', userDoc.exists());
          
          // If no document exists, this might be a brand new Apple Sign In
          // Wait briefly and check again to handle race condition
          if (!userDoc.exists()) {
            console.log('⏳ No Firestore document found. Checking if this is a brand new signup...');
            console.log('⏳ Waiting 800ms and checking again...');
            
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Check again
            userDoc = await getDoc(userDocRef);
            userData = userDoc.data();
            
            console.log('📄 Second check - Firestore document exists:', userDoc.exists());
            
            if (!userDoc.exists()) {
              console.log('🆕 Still no document - this is a BRAND NEW user mid-signup!');
              console.log('🚀 Allowing signup flow to continue without interruption');
              console.log('⏳ Keeping splash visible, will check auth state again when document is created');
              
              // Keep splash showing by NOT updating any state
              // When AuthContext creates the document, onAuthStateChanged will fire again
              // and this handler will run again with the document present
              return; // Exit early without updating state - splash stays visible
            } else {
              console.log('✅ Document created during wait - AuthContext finished setup');
            }
          }
          
          if (userDoc.exists()) {
            console.log('  - HasCompletedOnboarding:', userData?.HasCompletedOnboarding);
            console.log('  - IsActive:', userData?.IsActive);
          }
          
          // Only set user if they're fully authenticated
          if (user.emailVerified || user.providerData.length > 0) {
            const onboardingStatus = userData?.HasCompletedOnboarding || false;
            console.log('✅ User authenticated. Onboarding complete:', onboardingStatus);
            console.log('📍 Navigation decision: Show', onboardingStatus ? 'MAIN APP' : 'ONBOARDING');
            console.log('🔧 Setting all state together');
            
            // Detect if this is a brand new signup (went from no user to user with incomplete onboarding)
            const wasNoUser = previousUserRef.current === null;
            const isNewUser = !onboardingStatus && wasNoUser;
            
            // Use setTimeout to batch state updates and wait for next frame
            setTimeout(() => {
              setUser(user);
              setHasCompletedOnboarding(onboardingStatus);
              setFirestoreChecked(true);
              setAuthChecked(true);
              setIsCheckingAuth(false);
              
              // For new users, navigate to UserInfo after a brief delay
              if (isNewUser) {
                console.log('🆕 Detected brand new signup - navigating to UserInfo');
                setTimeout(() => {
                  if (navigationRef.current && !onboardingStatus) {
                    console.log('📍 Navigating to UserInfo screen...');
                    navigationRef.current.navigate('Setup', { screen: 'UserInfo' });
                  }
                }, 500);
              }
            }, 0);
          } else {
            console.log('❌ User not fully authenticated (no email verified or providers)');
            console.log('🔧 Setting all state together');
            setTimeout(() => {
              setUser(null);
              setHasCompletedOnboarding(false);
              setFirestoreChecked(true);
              setAuthChecked(true);
              setIsCheckingAuth(false);
            }, 0);
            console.log('📍 Navigation decision: Show ONBOARDING');
          }
        } catch (error) {
          console.error('❌ Error checking onboarding status:', error);
          console.log('📍 Navigation decision (after error): Show ONBOARDING');
          console.log('🔧 Setting all state together');
          setTimeout(() => {
            setUser(user);
            setHasCompletedOnboarding(false);
            setFirestoreChecked(true);
            setAuthChecked(true);
            setIsCheckingAuth(false);
          }, 0);
        }
      } else {
        console.log('❌ No user authenticated (signed out or never signed in)');
        console.log('📍 Navigation decision: Show ONBOARDING (Welcome screen)');
        console.log('🔧 Resetting all state');
        setTimeout(() => {
          setUser(null);
          setHasCompletedOnboarding(false);
          setFirestoreChecked(true);
          setAuthChecked(true);
          setIsCheckingAuth(false);
        }, 0);
      }
    });

    // Safety timeout - mark both auth and firestore as checked if taking too long
    const timer = setTimeout(() => {
      console.log('⏰ Safety timeout reached - marking auth and firestore as checked');
      setFirestoreChecked(true);
      setAuthChecked(true);
      setIsCheckingAuth(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);
  
  // Also watch for onboarding completion from context
  useEffect(() => {
    console.log('🔔 Onboarding completion watcher triggered. onboardingComplete:', onboardingComplete, ', user:', !!user, ', hasHandledInitialAuth:', hasHandledInitialAuth.current);
    
    // Skip if this is the initial auth check (user just logged in with completed onboarding)
    // Only run if onboardingComplete changed during the actual onboarding flow
    if (onboardingComplete && user && hasHandledInitialAuth.current) {
      console.log('🎉 Onboarding marked as complete from context, re-checking Firestore...');
      setIsCheckingAuth(true);
      
      // Re-check the Firestore document
      const recheckOnboarding = async () => {
        try {
          const userDocRef = doc(db, 'Users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          
          if (userData?.HasCompletedOnboarding) {
            console.log('✅ Re-checked onboarding status: true');
            console.log('🔄 Updating state to show main app...');
            
            // Batch updates with setTimeout
            setTimeout(() => {
              setHasCompletedOnboarding(true);
              setFirestoreChecked(true);
              setIsCheckingAuth(false);
              
              // Reset navigation stack and navigate to App screen
              setTimeout(() => {
                if (navigationRef.current) {
                  console.log('🚀 Resetting navigation to App screen with tabs');
                  navigationRef.current.reset({
                    index: 0,
                    routes: [{ name: 'App' }],
                  });
                }
              }, 300);
            }, 0);
          } else {
            console.log('❌ Re-checked onboarding status: false');
            setIsCheckingAuth(false);
          }
        } catch (error) {
          console.error('Error re-checking onboarding:', error);
          setIsCheckingAuth(false);
        }
      };
      
      recheckOnboarding();
    }
  }, [onboardingComplete, user]);

  // Watch for ACTUAL user sign out (transition from user to no user)
  useEffect(() => {
    // Only trigger navigation if we HAD a user and now we don't (actual sign out)
    const hadUser = previousUserRef.current !== null;
    const hasUserNow = user !== null;
    
    // Track the current user state for next time
    previousUserRef.current = user;
    
    // Only navigate if this is an actual sign-out (had user before, don't have one now)
    if (hadUser && !hasUserNow && authChecked && firestoreChecked && !initializing && navigationRef.current) {
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
    setSplashComplete(true);
  };

  // Wait for BOTH splash animation AND auth checks to complete
  const allChecksComplete = splashComplete && authChecked && firestoreChecked;
  
  // Once all checks are done, wait a moment then hide splash
  useEffect(() => {
    if (allChecksComplete && initializing) {
      setTimeout(() => {
        console.log('✅ All checks complete, showing navigation');
        setInitializing(false);
        hasHandledInitialAuth.current = true;
      }, 300);
    }
  }, [allChecksComplete, initializing]);

  // Keep splash visible until everything is ready
  if (initializing || !allChecksComplete) {
    console.log('🎬 Showing splash (allChecksComplete:', allChecksComplete, ', initializing:', initializing, ')');
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // If we're checking auth (login just happened), show splash/loading
  if (isCheckingAuth) {
    console.log('⏳ Checking auth and loading user data...');
    return <SplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  console.log('🚀 Navigation ready, rendering app');
  console.log('  - User exists:', !!user);
  console.log('  - Has completed onboarding:', hasCompletedOnboarding);
  console.log('  - Is guest:', isGuest);
  
  // Determine which navigator to show
  const showMainApp = isGuest || (!!user && hasCompletedOnboarding);
  console.log('  - Decision:', showMainApp ? 'AppNavigator (Main App)' : 'SetupNavigator (Onboarding/Welcome)');

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {showMainApp ? (
          <>
            {console.log('✅ Rendering AppNavigator (Main App with tabs)')}
            <Stack.Screen name="App" component={AppNavigator} />
            <Stack.Screen name="Setup" component={SetupNavigator} />
          </>
        ) : (
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
          <NotificationProvider>
            <SavedPropertiesProvider>
              <NavigationWrapper />
            </SavedPropertiesProvider>
          </NotificationProvider>
        </OnboardingProvider>
      </AuthProvider>
    </PropertyProvider>
  );
};

export default App; 