import React, { createContext, useState, useContext } from 'react';

const defaultContext = {
  savedProperties: [],
  addToSaved: () => {},
  removeFromSaved: () => {},
  updateSavedProperty: () => {}
};

const SavedPropertiesContext = createContext(defaultContext);

export function useSavedProperties() {
  const context = useContext(SavedPropertiesContext);
  if (!context) {
    throw new Error('useSavedProperties must be used within a SavedPropertiesProvider');
  }
  return context;
}

export const SavedPropertiesProvider = ({ children }) => {
  const [savedProperties, setSavedProperties] = useState([]);

  const addToSaved = (property) => {
    setSavedProperties((prev) => {
      const existingPropertyIndex = prev.findIndex(p => p.id === property.id);
      if (existingPropertyIndex !== -1) {
        // Update the existing property with the new loved status
        const updatedProperties = [...prev];
        updatedProperties[existingPropertyIndex] = { ...property };
        return updatedProperties;
      }
      return [...prev, property];
    });
  };

  const removeFromSaved = (propertyId) => {
    setSavedProperties((prev) => prev.filter(p => p.id !== propertyId));
  };

  const updateSavedProperty = (propertyId, lovedStatus) => {
    setSavedProperties((prev) =>
      prev.map((property) =>
        property.id === propertyId ? { ...property, loved: lovedStatus } : property
      )
    );
  };

  const value = {
    savedProperties,
    addToSaved,
    removeFromSaved,
    updateSavedProperty
  };

  return (
    <SavedPropertiesContext.Provider value={value}>
      {children}
    </SavedPropertiesContext.Provider>
  );
};