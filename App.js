// Import Firebase config first to ensure it's initialized
import './src/config/firebase';

import React from 'react';
import { registerRootComponent } from 'expo';
import { SavedPropertiesProvider } from './src/context/SavedPropertiesContext';
import { PropertyProvider } from './src/context/PropertyContext';
import { AuthProvider } from './src/context/AuthContext';
import NavigationWrapper from './src/navigation/NavigationWrapper';

function App() {
  return (
    <AuthProvider>
      <PropertyProvider>
        <SavedPropertiesProvider>
          <NavigationWrapper />
        </SavedPropertiesProvider>
      </PropertyProvider>
    </AuthProvider>
  );
}

export default registerRootComponent(App);