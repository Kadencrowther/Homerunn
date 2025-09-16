import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Google Sign-In handler
  const signInWithGoogle = async (idToken) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      return signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  // Apple Sign-In handler
  const signInWithApple = async (idToken, nonce = '') => {
    try {
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken, rawNonce: nonce });
      return signInWithCredential(auth, credential);
    } catch (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithApple,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for components
export const useAuth = () => useContext(AuthContext); 