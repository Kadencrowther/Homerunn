/**
 * createDefaultFilter.js
 * 
 * This utility creates a default filter based on user onboarding preferences
 * and saves it as the active filter in Firestore.
 */

import { auth, db } from '../config/firebase';
import { doc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { defaultFilterDefaults } from './defaultFilterDefaults';
import * as Location from 'expo-location';

/**
 * Gets the user's current location
 * @returns {Promise<Object>} - Location object with coordinates and address
 */
const getCurrentLocation = async () => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Location permission denied');
      return null;
    }

    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    // Reverse geocode to get address
    const address = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });

    if (address.length > 0) {
      const addr = address[0];
      const locationName = addr.city && addr.region 
        ? `${addr.city}, ${addr.region}` 
        : addr.region || 'Current Location';

      return {
        Name: locationName,
        Coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        RadiusMiles: 15 // Default radius for current location
      };
    }

    return {
      Name: 'Current Location',
      Coordinates: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      RadiusMiles: 15
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
};

/**
 * Creates a default filter from user onboarding preferences
 * @param {string} userId - The user's ID
 * @param {Object} userData - The user data from onboarding
 * @returns {Promise<Object>} - The created filter object
 */
export const createDefaultFilterFromPreferences = async (userId, userData) => {
  try {
    console.log('Creating default filter for user:', userId);
    console.log('User data:', userData);

    // Extract preferences from user data
    const preferences = userData.Preferences || [];
    const location = userData.Location || {};
    const timeframe = userData.Timeframe || null;
    const profile = userData.Profile || {};

    // Get enhanced filter values based on preferences
    const priceRange = getPriceRangeFromPreferences(preferences, timeframe);
    const propertyTypes = getPropertyTypesFromPreferences(preferences);
    const yearBuilt = getYearBuiltFromPreferences(preferences);
    const squareFootage = getSquareFootageFromPreferences(preferences);
    const bedrooms = getBedroomsFromPreferences(preferences);
    const bathrooms = getBathroomsFromPreferences(preferences);

    // Create filter object based on onboarding data
    const defaultFilter = {
      Name: 'Default Filter',
      PriceRange: priceRange,
      Beds: bedrooms,
      Baths: bathrooms,
      HomeType: propertyTypes,
      Sqft: squareFootage,
      YearBuilt: yearBuilt,
      Screen: 'home',
      CreatedAt: new Date(),
      IsActive: true,
      AddressText: location.Name || '',
      MapRegion: location.Coordinates ? {
        Latitude: location.Coordinates.latitude,
        Longitude: location.Coordinates.longitude,
        LatitudeDelta: calculateZoomForRadius(location.RadiusMiles || 10),
        LongitudeDelta: calculateZoomForRadius(location.RadiusMiles || 10) * (375 / 812) // Approximate aspect ratio
      } : null,
      RadiusMiles: location.RadiusMiles || 10
    };

    // If no preferences were selected, use defaults
    if (!preferences || preferences.length === 0) {
      defaultFilter.HomeType = defaultFilterDefaults.homeType;
      defaultFilter.PriceRange = defaultFilterDefaults.priceRange;
      defaultFilter.Sqft = defaultFilterDefaults.sqft;
      defaultFilter.YearBuilt = defaultFilterDefaults.yearBuilt;
      defaultFilter.Beds = defaultFilterDefaults.beds;
      defaultFilter.Baths = defaultFilterDefaults.baths;
    }

    // If no location was specified, use current location or defaults
    if (!location.Name) {
      console.log('No location specified, attempting to get current location...');
      const currentLocation = await getCurrentLocation();
      
      if (currentLocation) {
        console.log('Using current location:', currentLocation.Name);
        defaultFilter.AddressText = currentLocation.Name;
        defaultFilter.MapRegion = {
          Latitude: currentLocation.Coordinates.latitude,
          Longitude: currentLocation.Coordinates.longitude,
          LatitudeDelta: calculateZoomForRadius(currentLocation.RadiusMiles),
          LongitudeDelta: calculateZoomForRadius(currentLocation.RadiusMiles) * (375 / 812)
        };
        defaultFilter.RadiusMiles = currentLocation.RadiusMiles;
      } else {
        console.log('Could not get current location, using defaults');
        defaultFilter.AddressText = defaultFilterDefaults.addressText;
        defaultFilter.MapRegion = defaultFilterDefaults.mapRegion;
        defaultFilter.RadiusMiles = defaultFilterDefaults.radiusMiles;
      }
    }

    console.log('Created default filter:', defaultFilter);

    // Save the filter to Firestore
    await saveFilterToFirestore(userId, defaultFilter);

    return defaultFilter;
  } catch (error) {
    console.error('Error creating default filter:', error);
    throw error;
  }
};

/**
 * Saves the filter to Firestore and sets it as active
 * @param {string} userId - The user's ID
 * @param {Object} filterData - The filter data to save
 */
const saveFilterToFirestore = async (userId, filterData) => {
  try {
    // First, deactivate all existing filters
    await deactivateAllFilters(userId);

    // Create a new filter document
    const filtersRef = collection(db, 'Users', userId, 'Filters');
    const docRef = doc(filtersRef);
    
    // Save the filter with the generated ID
    await setDoc(docRef, {
      ...filterData,
      id: docRef.id,
      IsActive: true
    });

    console.log('Default filter saved with ID:', docRef.id);
  } catch (error) {
    console.error('Error saving filter to Firestore:', error);
    throw error;
  }
};

/**
 * Deactivates all existing filters for a user
 * @param {string} userId - The user's ID
 */
const deactivateAllFilters = async (userId) => {
  try {
    const filtersRef = collection(db, 'Users', userId, 'Filters');
    const querySnapshot = await getDocs(filtersRef);
    
    if (!querySnapshot.empty) {
      const batch = writeBatch(db);
      
      querySnapshot.forEach((document) => {
        const docRef = doc(db, 'Users', userId, 'Filters', document.id);
        batch.update(docRef, { IsActive: false });
      });
      
      await batch.commit();
      console.log('Deactivated all existing filters');
    }
  } catch (error) {
    console.error('Error deactivating filters:', error);
  }
};

/**
 * Calculates appropriate zoom level based on radius
 * @param {number} radiusMiles - The radius in miles
 * @returns {number} - The zoom delta value
 */
const calculateZoomForRadius = (radiusMiles) => {
  const milesPerDelta = 60;
  const delta = (radiusMiles * 2.6) / milesPerDelta;
  return Math.max(0.01, Math.min(delta, 30));
};

/**
 * Gets price range based on personal preferences and timeframe
 * @param {Array} preferences - User's personal preferences
 * @param {string} timeframe - User's timeframe preference
 * @returns {Object} - Min and max price values
 */
const getPriceRangeFromPreferences = (preferences, timeframe) => {
  let minPrice = 140000; // Default minimum
  let maxPrice = 2000000; // Default maximum
  
  // Adjust based on price-related preferences
  if (preferences.includes("Low Price")) {
    minPrice = 90000;
    maxPrice = 1500000; // Lower max for low price preference
  }
  
  if (preferences.includes("Luxury")) {
    minPrice = 140000;
    maxPrice = 5000000; // Higher max for luxury
  }
  
  if (preferences.includes("Investment")) {
    minPrice = 90000;
    maxPrice = 3000000; // Broader range for investment
  }
  
  // Adjust based on timeframe
  if (timeframe === "ASAP") {
    maxPrice = Math.min(maxPrice, 1500000);
  } else if (timeframe === "1-3 months") {
    maxPrice = Math.min(maxPrice, 2000000);
  } else if (timeframe === "3-6 months") {
    maxPrice = Math.min(maxPrice, 2500000);
  } else if (timeframe === "6+ months") {
    maxPrice = Math.min(maxPrice, 3000000);
  }
  
  return { Min: minPrice, Max: maxPrice };
};

/**
 * Gets property types based on personal preferences
 * @param {Array} preferences - User's personal preferences
 * @returns {Array} - Array of property types
 */
const getPropertyTypesFromPreferences = (preferences) => {
  let propertyTypes = ['House', 'Townhouse', 'Condo'];
  
  // Add property types based on preferences
  if (preferences.includes("Multi-Family")) {
    propertyTypes.push("Multifamily");
  }
  
  if (preferences.includes("New Build")) {
    propertyTypes.push("New Construction");
  }
  
  if (preferences.includes("High Ceiling")) {
    propertyTypes.push("Loft");
  }
  
  if (preferences.includes("Basement")) {
    // Houses with basements are typically single-family
    if (!propertyTypes.includes("House")) {
      propertyTypes.push("House");
    }
  }
  
  return propertyTypes;
};

/**
 * Gets year built range based on personal preferences
 * @param {Array} preferences - User's personal preferences
 * @returns {Object} - Min and max year values
 */
const getYearBuiltFromPreferences = (preferences) => {
  const currentYear = new Date().getFullYear();
  
  if (preferences.includes("New Build")) {
    return { Min: currentYear - 5, Max: currentYear };
  }
  
  if (preferences.includes("Energy Efficient")) {
    return { Min: 2000, Max: currentYear };
  }
  
  if (preferences.includes("Modern")) {
    return { Min: 1990, Max: currentYear };
  }
  
  if (preferences.includes("Traditional")) {
    return { Min: 1970, Max: currentYear };
  }
  
  return { Min: 1970, Max: currentYear };
};

/**
 * Gets square footage range based on personal preferences
 * @param {Array} preferences - User's personal preferences
 * @returns {Object} - Min and max square footage values
 */
const getSquareFootageFromPreferences = (preferences) => {
  let minSqft = 0;
  let maxSqft = 10000;
  
  if (preferences.includes("Open Plan")) {
    minSqft = 1500; // Open plan typically needs more space
    maxSqft = 8000;
  }
  
  if (preferences.includes("Large Yard")) {
    // Large yard preference might indicate preference for larger homes
    minSqft = 2000;
    maxSqft = 10000;
  }
  
  if (preferences.includes("Home Office")) {
    minSqft = 1800; // Need extra space for home office
    maxSqft = 8000;
  }
  
  if (preferences.includes("Guest House")) {
    minSqft = 2500; // Need significant space for guest house
    maxSqft = 12000;
  }
  
  if (preferences.includes("Spacious")) {
    minSqft = 2500; // Spacious homes need significant square footage
    maxSqft = 15000;
  }
  
  return { Min: minSqft, Max: maxSqft };
};

/**
 * Gets bedrooms based on personal preferences
 * @param {Array} preferences - User's personal preferences
 * @returns {Array} - Array of bedroom counts
 */
const getBedroomsFromPreferences = (preferences) => {
  let bedrooms = [];
  if (preferences.includes("Multiple Bedrooms")) {
    bedrooms.push(3);
    bedrooms.push(4);
    bedrooms.push(5);
    bedrooms.push(6);
  }
  if (preferences.includes("Spacious")) {
    bedrooms.push(4);
    bedrooms.push(5);
    bedrooms.push(6);
  }
  return bedrooms;
};

/**
 * Gets bathrooms based on personal preferences
 * @param {Array} preferences - User's personal preferences
 * @returns {Array} - Array of bathroom counts
 */
const getBathroomsFromPreferences = (preferences) => {
  let bathrooms = [];
  if (preferences.includes("Multiple Bathrooms")) {
    bathrooms.push(2);
    bathrooms.push(3);
    bathrooms.push(4);
  }
  if (preferences.includes("Spacious")) {
    bathrooms.push(2);
    bathrooms.push(3);
  }
  return bathrooms;
};

/**
 * Gets price range adjustments based on timeframe (legacy function - kept for compatibility)
 * @param {string} timeframe - The user's timeframe preference
 * @returns {Object} - Min and max price values
 */
const getPriceRangeFromTimeframe = (timeframe) => {
  switch (timeframe) {
    case 'ASAP':
      return { min: 0, max: 1500000 };
    case '1-3 months':
      return { min: 0, max: 2000000 };
    case '3-6 months':
      return { min: 0, max: 2500000 };
    case '6+ months':
      return { min: 0, max: 3000000 };
    default:
      return { min: 0, max: 2000000 };
  }
}; 