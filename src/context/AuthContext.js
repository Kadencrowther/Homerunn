import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { 
  onAuthStateChanged, 
  signInWithCredential,
  OAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsGuest(false);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithApple = async (credential) => {
    try {
      const provider = new OAuthProvider('apple.com');
      const oauthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.nonce,
      });
      
      const userCredential = await signInWithCredential(auth, oauthCredential);
      const user = userCredential.user;
      
      setIsGuest(false);
      
      // Create or update user document in Firestore
      const userDocRef = doc(db, 'Users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create new user document
        await setDoc(userDocRef, {
          Email: user.email || credential.email || '',
          DisplayName: credential.fullName ? 
            `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim() : 
            user.displayName || '',
          IsActive: true,
          HasCompletedOnboarding: false,
          NotificationsEnabled: false,
          NotificationDevices: [],
          CreatedAt: new Date().toISOString(),
          AuthProvider: 'apple',
        });
      } else {
        // Update existing user to set IsActive
        await setDoc(userDocRef, { IsActive: true }, { merge: true });
      }
      
      return user;
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      throw error;
    }
  };

  const continueAsGuest = () => {
    console.log('Guest mode activated');
    setIsGuest(true);
    setUser(null);
  };

  const logout = () => {
    setIsGuest(false);
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isGuest,
      signInWithApple,
      continueAsGuest,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);