import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyCnesQZ4KZ64oewfgdhThDenO3W-1FPHBk",
  authDomain: "homerunn-973b3.firebaseapp.com",
  projectId: "homerunn-973b3",
  storageBucket: "homerunn-973b3.firebasestorage.app",
  messagingSenderId: "1006467951298",
  appId: "1:1006467951298:web:037a5c0635cffec6b2695b",
  measurementId: "G-8KLJ8CBYLH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
export const db = getFirestore(app);

export default app; 