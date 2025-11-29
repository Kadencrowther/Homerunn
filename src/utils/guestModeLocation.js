import * as Location from 'expo-location';

// Integrated cities with their coordinates
const INTEGRATED_CITIES = [
  {
    name: 'Jackson, MS',
    latitude: 32.2988,
    longitude: -90.1848,
    displayName: 'Jackson, MS'
  },
  {
    name: 'Madison, MS',
    latitude: 32.4618,
    longitude: -90.1151,
    displayName: 'Madison, MS'
  },
  {
    name: 'Biloxi, MS',
    latitude: 30.3960,
    longitude: -88.8853,
    displayName: 'Biloxi, MS'
  }
];

// Default city if location is denied
const DEFAULT_CITY = INTEGRATED_CITIES[1]; // Madison, MS

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
};

const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Find the closest integrated city to the user's location
const findClosestCity = (userLatitude, userLongitude) => {
  let closestCity = DEFAULT_CITY;
  let minDistance = Infinity;
  
  INTEGRATED_CITIES.forEach(city => {
    const distance = calculateDistance(
      userLatitude,
      userLongitude,
      city.latitude,
      city.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestCity = city;
    }
  });
  
  console.log(`Closest city: ${closestCity.displayName} (${minDistance.toFixed(2)} miles away)`);
  return closestCity;
};

// Get user's location and find closest city
export const getGuestModeLocation = async () => {
  try {
    // Request location permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Location permission denied, using default city:', DEFAULT_CITY.displayName);
      return DEFAULT_CITY;
    }
    
    // Get current location
    console.log('Getting user location...');
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    
    console.log('User location:', location.coords.latitude, location.coords.longitude);
    
    // Find closest city
    const closestCity = findClosestCity(
      location.coords.latitude,
      location.coords.longitude
    );
    
    return closestCity;
  } catch (error) {
    console.error('Error getting location:', error);
    console.log('Using default city:', DEFAULT_CITY.displayName);
    return DEFAULT_CITY;
  }
};

// Calculate appropriate zoom level for radius
const calculateZoomForRadius = (radiusMiles, width, height) => {
  const milesPerDelta = 60;
  const delta = (radiusMiles * 2.6) / milesPerDelta;
  return Math.max(0.01, Math.min(delta, 30));
};

// Create default guest mode filter
export const createGuestModeFilter = async (width, height) => {
  // Get the closest city
  const city = await getGuestModeLocation();
  
  // Calculate zoom level for 50 mile radius
  const delta = calculateZoomForRadius(50, width, height);
  
  // Create the filter object
  const guestFilter = {
    priceRange: {
      min: '250000',
      max: '2000000'
    },
    beds: [3], // 3+ bedrooms
    baths: [2], // 2+ bathrooms
    homeType: ['House', 'Townhouse', 'Condo'],
    sqft: {
      min: '1200',
      max: '10000'
    },
    yearBuilt: {
      min: '1990',
      max: new Date().getFullYear().toString()
    },
    mapRegion: {
      latitude: city.latitude,
      longitude: city.longitude,
      latitudeDelta: delta,
      longitudeDelta: delta * (width / height)
    },
    radiusMiles: 50,
    addressText: city.displayName,
    screen: 'home',
    hasBeenSet: true,
    isGuestFilter: true // Flag to identify this as a guest filter
  };
  
  console.log('Created guest mode filter for:', city.displayName);
  return guestFilter;
};

export default {
  getGuestModeLocation,
  createGuestModeFilter,
  INTEGRATED_CITIES,
  DEFAULT_CITY
};

