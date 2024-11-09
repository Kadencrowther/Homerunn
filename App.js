import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';
import * as Font from 'expo-font';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { SavedPropertiesProvider } from './src/context/SavedPropertiesContext';

const App = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...FontAwesome.font,
          ...MaterialIcons.font,
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        // If fonts fail to load, we'll continue anyway
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#fc565b" />
      </View>
    );
  }

  return (
    <SavedPropertiesProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SavedPropertiesProvider>
  );
};

export default App; 