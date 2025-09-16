import React, { createContext, useState, useContext } from 'react';

const PropertyContext = createContext();

export function useProperty() {
  const context = useContext(PropertyContext);
  if (!context) {
    throw new Error('useProperty must be used within a PropertyProvider');
  }
  return context;
}

export function PropertyProvider({ children }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const value = {
    properties,
    setProperties,
    loading,
    setLoading,
    error,
    setError
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export default PropertyContext; 