import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
const PropertyContext = createContext();

// Create a provider component
export const PropertyProvider = ({ children }) => {
  const [savedProperties, setSavedProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved properties from AsyncStorage on component mount
  useEffect(() => {
    const loadSavedProperties = async () => {
      try {
        const savedData = await AsyncStorage.getItem('savedProperties');
        if (savedData) {
          setSavedProperties(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading saved properties:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedProperties();
  }, []);

  // Save properties to AsyncStorage whenever they change
  useEffect(() => {
    const saveToDisk = async () => {
      try {
        await AsyncStorage.setItem('savedProperties', JSON.stringify(savedProperties));
      } catch (error) {
        console.error('Error saving properties to storage:', error);
      }
    };

    if (!isLoading) {
      saveToDisk();
    }
  }, [savedProperties, isLoading]);

  // Toggle a property in the saved list
  const toggleSavedProperty = (property) => {
    setSavedProperties(prevSaved => {
      const isAlreadySaved = prevSaved.some(p => p.id === property.id);
      
      if (isAlreadySaved) {
        // Remove from saved
        return prevSaved.filter(p => p.id !== property.id);
      } else {
        // Add to saved with timestamp
        const propertyWithTimestamp = {
          ...property,
          savedTimestamp: new Date().toISOString()
        };
        return [...prevSaved, propertyWithTimestamp];
      }
    });
  };

  // Check if a property is saved
  const isPropertySaved = (propertyId) => {
    return savedProperties.some(property => property.id === propertyId);
  };

  // Get sorted saved properties (most recent first)
  const getSortedSavedProperties = () => {
    return [...savedProperties].sort((a, b) => {
      if (a.savedTimestamp && b.savedTimestamp) {
        return new Date(b.savedTimestamp) - new Date(a.savedTimestamp);
      }
      return 0;
    });
  };

  // Context value
  const value = {
    savedProperties,
    toggleSavedProperty,
    isPropertySaved,
    getSortedSavedProperties,
    isLoading
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
};

// Custom hook to use the context
export const usePropertyContext = () => {
  const context = useContext(PropertyContext);
  if (context === undefined) {
    throw new Error('usePropertyContext must be used within a PropertyProvider');
  }
  return context;
}; 