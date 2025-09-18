/**
 * defaultFilterDefaults.js
 * 
 * This file contains default filter values that are used when users
 * skip onboarding options or when no specific preferences are provided.
 */

// Default location (could be user's current location or a preset location)
const defaultLocation = {
  latitude: 40.3916,  // Default to a central location
  longitude: -111.8508,
  latitudeDelta: 0.4,
  longitudeDelta: 0.4 * (375 / 812), // Maintain aspect ratio
};

export const defaultFilterDefaults = {
  // Default property types if user skips preferences
  homeType: ['House', 'Townhouse', 'Condo'],
  
  // Default location if user skips location selection
  addressText: 'United States',
  mapRegion: {
    Latitude: defaultLocation.latitude,
    Longitude: defaultLocation.longitude,
    LatitudeDelta: defaultLocation.latitudeDelta,
    LongitudeDelta: defaultLocation.longitudeDelta
  },
  radiusMiles: 25,
  
  // Default price range
  priceRange: {
    Min: 90000,
    Max: 2000000
  },
  
  // Default bedroom/bathroom preferences
  beds: [1, 2, 3, 4, 5],
  baths: [1, 2, 3, 4, 5],
  
  // Default square footage range
  sqft: {
    Min: 0,
    Max: 10000
  },
  
  // Default year built range
  yearBuilt: {
    Min: 1970,
    Max: new Date().getFullYear()
  }
}; 