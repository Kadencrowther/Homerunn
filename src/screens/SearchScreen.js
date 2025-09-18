import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator, Platform, FlatList, Keyboard, Animated } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSavedProperties } from '../../src/context/SavedPropertiesContext';
import { fetchMLSData, fetchPropertyById } from '../api/fetchMLSData';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import FilterModal from '../components/FilterModal';

// Sample data for properties
const properties = [
  {
    id: '1',
    coordinate: { latitude: 40.400, longitude: -111.800 }, // Replace with actual coordinates
    title: '$749,000 - 5 bed, 4 bath',
    description: '1850 South 1600 West, Lehi, UT',
    image: require('../../assets/house1pic1.png'),
    images: [require('../../assets/house1pic1.png'), require('../../assets/house1pic1.png'), require('../../assets/house1pic1.png')],
    beds: 5,
    baths: 4,
    sqft: 3890,
    price: 749000,
    address: '1850 South 1600 West, Lehi, UT 84660',
  },
  {
    id: '2',
    coordinate: { latitude: 40.410, longitude: -111.810 },
    title: '$1,129,000 - 5 bed, 4 bath',
    description: '456 Oak Dr, Austin, TX',
    image: require('../../assets/house2pic1.png'),
    images: [require('../../assets/house2pic1.png'), require('../../assets/house2pic1.png'), require('../../assets/house2pic1.png')],
    beds: 5,
    baths: 4,
    sqft: 5000,
    price: 1129000,
    address: '456 Oak Dr, Austin, TX',
  },
  {
    id: '3',
    coordinate: { latitude: 40.401, longitude: -111.801 },
    title: '$899,000 - 4 bed, 3 bath',
    description: '123 Main St, Lehi, UT',
    image: require('../../assets/house3pic1.png'),
    images: [require('../../assets/house3pic1.png'), require('../../assets/house3pic1.png'), require('../../assets/house3pic1.png')],
    beds: 4,
    baths: 3,
    sqft: 3200,
    price: 899000,
    address: '123 Main St, Lehi, UT',
  },
  {
    id: '4',
    coordinate: { latitude: 40.403, longitude: -111.799 },
    title: '$650,000 - 3 bed, 2 bath',
    description: '789 Pine Ave, Lehi, UT',
    image: require('../../assets/house4pic1.png'),
    images: [require('../../assets/house4pic1.png'), require('../../assets/house4pic1.png'), require('../../assets/house4pic1.png')],
    beds: 3,
    baths: 2,
    sqft: 2400,
    price: 650000,
    address: '789 Pine Ave, Lehi, UT',
  },
  {
    id: '5',
    coordinate: { latitude: 40.398, longitude: -111.803 },
    title: '$825,000 - 4 bed, 3.5 bath',
    description: '321 Cedar Ln, Lehi, UT',
    image: require('../../assets/house5.jpeg'),
    images: [require('../../assets/house5.jpeg'), require('../../assets/house5.jpeg'), require('../../assets/house5.jpeg')],
    beds: 4,
    baths: 3.5,
    sqft: 3500,
    price: 825000,
    address: '321 Cedar Ln, Lehi, UT',
  },
  // Add more properties as needed
];

// Sample list of popular US cities for quick selection
const popularCities = [
  { id: '1', name: 'New York, NY', coordinates: { latitude: 40.7128, longitude: -74.0060 } },
  { id: '2', name: 'Los Angeles, CA', coordinates: { latitude: 34.0522, longitude: -118.2437 } },
  { id: '3', name: 'Chicago, IL', coordinates: { latitude: 41.8781, longitude: -87.6298 } },
  { id: '4', name: 'Houston, TX', coordinates: { latitude: 29.7604, longitude: -95.3698 } },
  { id: '5', name: 'Phoenix, AZ', coordinates: { latitude: 33.4484, longitude: -112.0740 } },
  { id: '6', name: 'Philadelphia, PA', coordinates: { latitude: 39.9526, longitude: -75.1652 } },
  { id: '7', name: 'San Antonio, TX', coordinates: { latitude: 29.4241, longitude: -98.4936 } },
  { id: '8', name: 'San Diego, CA', coordinates: { latitude: 32.7157, longitude: -117.1611 } },
  { id: '9', name: 'Dallas, TX', coordinates: { latitude: 32.7767, longitude: -96.7970 } },
  { id: '10', name: 'San Francisco, CA', coordinates: { latitude: 37.7749, longitude: -122.4194 } },
  { id: '11', name: 'Austin, TX', coordinates: { latitude: 30.2672, longitude: -97.7431 } },
  { id: '12', name: 'Seattle, WA', coordinates: { latitude: 47.6062, longitude: -122.3321 } },
  { id: '13', name: 'Denver, CO', coordinates: { latitude: 39.7392, longitude: -104.9903 } },
  { id: '14', name: 'Boston, MA', coordinates: { latitude: 42.3601, longitude: -71.0589 } },
  { id: '15', name: 'Miami, FL', coordinates: { latitude: 25.7617, longitude: -80.1918 } },
  // Add more cities as needed
];

const getStatusColor = (status) => {
  if (status === 'Active') return '#fc565b';  // Red
  if (status === 'Pending') return '#FFA500'; // Orange
  if (status === 'Sold') return '#4CAF50';    // Green
  if (status === 'Closed') return '#1652F0';  // Blue
  return '#888888'; // Default gray for other statuses
};

const SearchScreen = () => {
  const navigation = useNavigation();
  const { savedProperties, updateSavedProperty, addToSaved } = useSavedProperties();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);
  const [mapType, setMapType] = useState('standard');
  const [showMapTypeModal, setShowMapTypeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mlsProperties, setMlsProperties] = useState([]);
  const [region, setRegion] = useState({
    latitude: 40.401,
    longitude: -111.801,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef(null);
  
  // Add filter state
  const [filters, setFilters] = useState({
    screen: 'search',
    priceRange: { min: 0, max: 2000000 },
    beds: [],
    baths: [],
    sqft: { min: 0, max: 10000 },
    yearBuilt: { min: 1900, max: new Date().getFullYear() },
    homeType: [],
    hasBeenSet: false
  });
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  
  // Use the appropriate map provider based on platform
  const mapProvider = Platform.OS === 'ios' ? PROVIDER_DEFAULT : PROVIDER_GOOGLE;
  
  // Instead, we'll use a ref to track if the heart is currently being pressed
  const heartPressRef = useRef(false);
  
  // First, let's add a state to track which property is currently loading
  const [loadingPropertyId, setLoadingPropertyId] = useState(null);
  
  // Add this state to track all fetched properties before filtering
  const [allFetchedProperties, setAllFetchedProperties] = useState([]);
  
  // Add this state to track if the button has been pressed
  const [hasSearchedCurrentArea, setHasSearchedCurrentArea] = useState(false);
  const buttonColorAnim = useRef(new Animated.Value(0)).current;
  
  // Filter cities based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = popularCities.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
      setShowSearchResults(true);
      
      // If query is specific enough, attempt to search for additional locations
      if (searchQuery.length > 2) {
        searchLocations(searchQuery);
      } else {
        setSearchResults([]);
      }
    } else {
      setFilteredCities([]);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);
  
  // Search for locations using expo-location
  const searchLocations = async (query) => {
    setIsSearching(true);
    try {
      console.log('Searching for location:', query);
      const locations = await Location.geocodeAsync(query);
      
      if (locations.length > 0) {
        console.log(`Found ${locations.length} locations for query "${query}"`);
        
        // Get location names for each result
        const resultsWithNames = await Promise.all(
          locations.slice(0, 5).map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            
            let name = query;
            if (address.length > 0) {
              const addressInfo = address[0];
              name = addressInfo.city 
                ? `${addressInfo.city}, ${addressInfo.region}`
                : addressInfo.name || addressInfo.street || query;
                
              // For full addresses, include street number and name
              if (addressInfo.street) {
                name = `${addressInfo.street}, ${addressInfo.city || ''}, ${addressInfo.region || ''}`;
              }
            }
            
            return {
              ...loc,
              name,
              id: `${loc.latitude}-${loc.longitude}`,
              coordinates: {
                latitude: loc.latitude,
                longitude: loc.longitude
              }
            };
          })
        );
        
        console.log('Search results with names:', resultsWithNames);
        setSearchResults(resultsWithNames);
      } else {
        console.log(`No locations found for query "${query}"`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      // Don't show the error to the user - just continue
    } finally {
      setIsSearching(false);
    }
  };
  
  // Check if a property is saved or loved
  const isPropertySaved = (propertyId) => {
    return savedProperties.some(property => property.id === propertyId);
  };
  
  const isPropertyLoved = (propertyId) => {
    return savedProperties.some(p => p.id === propertyId && p.loved);
  };

  // Function to fetch properties based on map region
  const fetchPropertiesForRegion = async (mapRegion) => {
    try {
      // Calculate radius in miles (approximate)
      const latDelta = mapRegion.latitudeDelta;
      const lngDelta = mapRegion.longitudeDelta;
      
      // Rough conversion from degrees to miles (1 degree lat ≈ 69 miles)
      const radiusMiles = Math.max(latDelta, lngDelta) * 69 / 2;
      
      // Create filter object for the API
      const filtersToUse = {
        mapRegion: {
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude
        },
        radiusMiles: radiusMiles,
        // Add the current filters if they've been applied
        ...(filtersApplied ? filters : {})
      };
      
      console.log('Fetching properties with filters:', filtersToUse);
      
      const result = await fetchMLSData(filtersToUse);
      
      if (result && result.properties) {
        console.log(`Fetched ${result.properties.length} properties from MLS`);
        
        // Map the properties to the format expected by the map
        const mappedProperties = result.properties.map(item => ({
          id: item.id || item.ListingId,
          coordinate: { 
            latitude: parseFloat(item.Latitude) || 0, 
            longitude: parseFloat(item.Longitude) || 0 
          },
          title: `$${item.ListPrice?.toLocaleString() || 'N/A'} - ${item.BedroomsTotal} bed, ${item.BathroomsTotalInteger} bath`,
          description: item.UnparsedAddress || (item.StreetNumber + ' ' + item.StreetName),
          image: item.Media && item.Media.length > 0 ? { uri: item.Media[0].MediaURL } : require('../../assets/house1pic1.png'),
          images: item.Media ? item.Media.map(m => ({ uri: m.MediaURL })) : [require('../../assets/house1pic1.png')],
          beds: item.BedroomsTotal || 0,
          baths: item.BathroomsTotalInteger || 0,
          sqft: item.LivingArea || 0,
          price: item.ListPrice || 0,
          address: item.UnparsedAddress || '',
          listingStatus: item.StandardStatus || 'Active',
          // Store the original MLS data for filtering
          originalData: item
        }));
        
        // Filter out properties with invalid coordinates
        const validProperties = mappedProperties.filter(
          prop => prop.coordinate.latitude !== 0 && prop.coordinate.longitude !== 0
        );
        
        // Store all fetched properties
        setAllFetchedProperties(validProperties);
        
        // Apply filters to the fetched properties
        if (filtersApplied) {
          const filteredProperties = filterProperties(validProperties);
          setMlsProperties(filteredProperties);
        } else {
          setMlsProperties(validProperties);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  // Add this function to filter properties based on current filters
  const filterProperties = (propertiesToFilter) => {
    if (!filtersApplied) return propertiesToFilter;
    
    console.log('Filtering properties with criteria:', filters);
    
    return propertiesToFilter.filter(property => {
      // Filter by price range
      if (filters.priceRange) {
        const minPrice = parseInt(filters.priceRange.min) || 0;
        const maxPrice = parseInt(filters.priceRange.max) || Number.MAX_SAFE_INTEGER;
        
        if (property.price < minPrice || property.price > maxPrice) {
          return false;
        }
      }
      
      // Filter by beds
      if (filters.beds && filters.beds.length > 0) {
        const bedMatch = filters.beds.some(bed => {
          if (bed === '5+') return property.beds >= 5;
          // For numeric beds, check if property has that number or more bedrooms
          return property.beds >= parseInt(bed);
        });
        
        if (!bedMatch) return false;
      }
      
      // Filter by baths
      if (filters.baths && filters.baths.length > 0) {
        const bathMatch = filters.baths.some(bath => {
          if (bath === '5+') return property.baths >= 5;
          // For numeric baths, check if property has that number or more bathrooms
          return property.baths >= parseInt(bath);
        });
        
        if (!bathMatch) return false;
      }
      
      // Filter by square footage
      if (filters.sqft) {
        const minSqft = parseInt(filters.sqft.min) || 0;
        const maxSqft = parseInt(filters.sqft.max) || Number.MAX_SAFE_INTEGER;
        
        if (property.sqft < minSqft || property.sqft > maxSqft) {
          return false;
        }
      }
      
      // Filter by year built (if available in the property data)
      if (filters.yearBuilt && property.originalData && property.originalData.YearBuilt) {
        const minYear = parseInt(filters.yearBuilt.min) || 0;
        const maxYear = parseInt(filters.yearBuilt.max) || Number.MAX_SAFE_INTEGER;
        const yearBuilt = parseInt(property.originalData.YearBuilt);
        
        if (yearBuilt < minYear || yearBuilt > maxYear) {
          return false;
        }
      }
      
      // Filter by home type
      if (filters.homeType && filters.homeType.length > 0 && property.originalData) {
        const propertyTypeMatch = filters.homeType.some(type => {
          const propertyType = property.originalData.PropertyType;
          const propertySubType = property.originalData.PropertySubType;
          
          switch(type) {
            case 'House':
              return (propertyType === 'Residential' && 
                     propertySubType === 'Single Family Residence');
            case 'Townhouse':
              return propertySubType === 'Townhouse';
            case 'Condo':
              return propertySubType === 'Condominium';
            case 'Apt':
              return (propertySubType === 'Condominium' || 
                      propertySubType === 'Multi Family' || 
                      propertyType === 'Residential Income');
            case 'Land':
              return (propertyType === 'Land' || 
                      propertySubType === 'Unimproved Land' || 
                      propertySubType === 'Single Family Residence Lot');
            case 'Multifamily':
              return (propertySubType === 'Multi Family' || 
                      propertySubType === 'Multi-Family' || 
                      propertyType === 'Residential Income');
            case 'Manufactured House':
              return propertySubType === 'Manufactured Home';
            default:
              return false;
          }
        });
        
        if (!propertyTypeMatch) return false;
      }
      
      // Property passed all filters
      return true;
    });
  };

  // Handle region change on the map
  const handleRegionChangeComplete = (newRegion) => {
    setRegion(newRegion);
    setHasSearchedCurrentArea(false);
    // Animate back to original color
    Animated.timing(buttonColorAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Handle location selection from search results
  const handleLocationSelect = (location) => {
    if (location.coordinates) {
      // Create a new region centered on the selected location
      const newRegion = {
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      // Update the region state
      setRegion(newRegion);
      
      // Animate the map to the new region
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Fetch properties for the new region
      fetchPropertiesForRegion(newRegion);
      
      // Clear search and hide results
      setSearchQuery('');
      setShowSearchResults(false);
      Keyboard.dismiss();
    }
  };

  // Modify the toggleLovedStatus function
  const toggleLovedStatus = async (property, event) => {
    // Prevent the callout from closing when heart is tapped
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    // Set our ref to indicate the heart was tapped
    heartPressRef.current = true;
    
    // Check if the property is already saved
    const isSaved = savedProperties.some(p => p.id === property.id);
    const isCurrentlyLoved = isSaved && savedProperties.find(p => p.id === property.id).loved;
    
    // If not saved, add it to saved properties as loved
    if (!isSaved) {
      // First, try to fetch complete property details to ensure we have all data
      setLoadingPropertyId(property.id);
      
      try {
        // Try to fetch the property directly by ID first
        const propertyDetails = await fetchPropertyById(property.id);
        
        // Create a property object with all necessary data
        let propertyToSave = {
          id: property.id,
          coordinate: property.coordinate,
          title: property.title,
          description: property.description,
          image: property.image,
          images: property.images,
          beds: property.beds,
          baths: property.baths,
          sqft: property.sqft,
          price: property.price,
          address: property.address,
          loved: true, // Set to loved since we're toggling
          listingId: property.id.includes('ListingId') ? property.id.split('ListingId=')[1] : 
                    (property.originalData?.ListingId || property.listingId || ''),
          // Add status, year built and brokerage info if available
          listingStatus: property.listingStatus || 'Active',
          yearBuilt: property.yearBuilt || property.originalData?.YearBuilt || 'N/A',
          listingOffice: property.listingOffice || property.originalData?.ListingOffice || 'MLS Listing'
        };
        
        // If we got detailed property data from the API, use that
        if (propertyDetails) {
          propertyToSave = {
            ...propertyToSave,
            // Add all the MLS data fields
            ListingId: propertyDetails.ListingId,
            listingId: propertyDetails.ListingId,
            mlsNumber: propertyDetails.ListingId,
            // Update with more accurate data
            listingStatus: propertyDetails.StandardStatus || propertyToSave.listingStatus,
            yearBuilt: propertyDetails.YearBuilt || propertyToSave.yearBuilt,
            listingOffice: propertyDetails.ListingOffice || propertyDetails.ListOfficeName || propertyToSave.listingOffice,
            // Add all other MLS fields
            ...propertyDetails
          };
        }
        
        // Add to saved properties
        addToSaved(propertyToSave);
      } catch (error) {
        console.error('Error fetching property details for saving:', error);
        
        // Fallback to basic property data if fetch fails
        const propertyToSave = {
          id: property.id,
          coordinate: property.coordinate,
          title: property.title,
          description: property.description,
          image: property.image,
          images: property.images,
          beds: property.beds,
          baths: property.baths,
          sqft: property.sqft,
          price: property.price,
          address: property.address,
          loved: true,
          listingId: property.id.includes('ListingId') ? property.id.split('ListingId=')[1] : 
                    (property.originalData?.ListingId || property.listingId || ''),
          listingStatus: property.listingStatus || 'Active',
          yearBuilt: property.yearBuilt || property.originalData?.YearBuilt || 'N/A',
          listingOffice: property.listingOffice || property.originalData?.ListingOffice || 'MLS Listing'
        };
        
        addToSaved(propertyToSave);
      } finally {
        setLoadingPropertyId(null);
      }
    } else {
      // If already saved, toggle the loved status
      updateSavedProperty(property.id, !isCurrentlyLoved);
    }
    
    // If user is logged in, update in Firebase
    if (auth.currentUser) {
      try {
        const userId = auth.currentUser.uid;
        const userMatchMetricRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
        
        // Get current user data
        const userMatchMetricDoc = await getDoc(userMatchMetricRef);
        
        if (userMatchMetricDoc.exists()) {
          const userData = userMatchMetricDoc.data();
          let likedProperties = userData.LikedProperties || [];
          let lovedProperties = userData.LovedProperties || [];
          
          // Format the property ID correctly
          let propertyId = property.id;
          
          // If the property ID is not in the correct format, convert it
          if (!propertyId.includes('api.bridgedataoutput.com')) {
            // Get the hash ID from originalData if available, otherwise use ListingId
            const hashId = property.originalData?.['@odata.id']?.split("('")[1]?.split("')")[0] || 
                          property.originalData?.ListingId || 
                          property.listingId;
                          
            if (hashId) {
              propertyId = `https://api.bridgedataoutput.com/api/v2/OData/united/Property('${hashId}')`;
            }
          }
          
          // Toggle loved status in Firebase
          if (!isCurrentlyLoved) {
            // If property is being loved, add to loved properties and remove from liked
            if (!lovedProperties.includes(propertyId)) {
              lovedProperties = [...lovedProperties, propertyId];
            }
            likedProperties = likedProperties.filter(id => id !== propertyId);
          } else {
            // If property is being unloved, remove from loved properties
            lovedProperties = lovedProperties.filter(id => id !== propertyId);
            
            // Don't add back to liked properties - this ensures it's completely removed
            // from the Saved screen when unloved
          }
          
          // Update Firebase
          await updateDoc(userMatchMetricRef, {
            LikedProperties: likedProperties,
            LovedProperties: lovedProperties
          });
          
          console.log(`Property ${propertyId} ${!isCurrentlyLoved ? 'loved' : 'unloved'} status updated in Firebase`);
        }
      } catch (error) {
        console.error('Error updating loved status in Firebase:', error);
      }
    }
  };

  // Simple clustering implementation
  const clusterProperties = (properties, distance = 0.01) => {
    if (!properties.length) return [];
    
    const clusters = [];
    const processed = new Set();
    
    properties.forEach((property, index) => {
      if (processed.has(index)) return;
      
      const cluster = {
        properties: [property],
        coordinate: property.coordinate,
        count: 1
      };
      
      processed.add(index);
      
      // Find nearby properties
      properties.forEach((otherProperty, otherIndex) => {
        if (index === otherIndex || processed.has(otherIndex)) return;
        
        const lat1 = property.coordinate.latitude;
        const lon1 = property.coordinate.longitude;
        const lat2 = otherProperty.coordinate.latitude;
        const lon2 = otherProperty.coordinate.longitude;
        
        // Simple distance calculation (approximate)
        const latDiff = Math.abs(lat1 - lat2);
        const lonDiff = Math.abs(lon1 - lon2);
        
        if (latDiff < distance && lonDiff < distance) {
          cluster.properties.push(otherProperty);
          cluster.count++;
          processed.add(otherIndex);
        }
      });
      
      clusters.push(cluster);
    });
    
    return clusters;
  };

  // Initial data load
  useEffect(() => {
    fetchPropertiesForRegion(region);
  }, []);

  // Combine sample properties with MLS properties
  const allProperties = [...properties, ...mlsProperties];
  
  // Create clusters based on zoom level
  const clusters = region.latitudeDelta > 0.01 
    ? clusterProperties(allProperties, region.latitudeDelta / 10)
    : allProperties.map(property => ({ 
        properties: [property], 
        coordinate: property.coordinate, 
        count: 1 
      }));

  // Add this function to fetch property details when a marker is clicked
  const fetchPropertyDetails = async (propertyId) => {
    console.log(`Fetching details for property ID: ${propertyId}`);
    
    try {
      // Create a filter specifically for this property
      const propertyFilter = {
        listingId: propertyId,
        _timestamp: new Date().getTime() // Add timestamp to prevent caching
      };
      
      // Call the API to get detailed property information
      const result = await fetchMLSData(propertyFilter);
      
      if (result && result.properties && result.properties.length > 0) {
        console.log(`Successfully fetched details for property ${propertyId}`);
        
        // Get the detailed property data
        const propertyDetails = result.properties[0];
        
        // Ensure we have a valid ListingId
        if (!propertyDetails.ListingId) {
          console.warn('API returned property data without a ListingId');
          return null;
        }
        
        // Update the property in the mlsProperties array
        setMlsProperties(prevProperties => {
          return prevProperties.map(prop => {
            if (prop.id === propertyId) {
              // Create a merged property with all the necessary data
              const mergedProperty = {
                ...prop,
                // Add all the MLS data fields
                ListingId: propertyDetails.ListingId,
                listingId: propertyDetails.ListingId,
                mlsNumber: propertyDetails.ListingId,
                // Add all other MLS fields
                ...propertyDetails,
                // Keep the original coordinate and UI-specific fields
                coordinate: prop.coordinate,
                title: prop.title,
                description: prop.description,
                hasDetailedData: true
              };
              return mergedProperty;
            }
            return prop;
          });
        });
        
        return propertyDetails;
      } else {
        console.log(`No details found for property ${propertyId}`);
        return null;
      }
    } catch (error) {
      console.error(`Error fetching property details for ${propertyId}:`, error);
      return null;
    }
  };

  // Update the onMarkerPress function to fetch property details
  const onMarkerPress = async (property) => {
    console.log('Marker pressed for property:', property.id);
    
    // If this is a cluster, don't fetch details
    if (property.count > 1) return;
    
    // Get the actual property from the cluster
    const actualProperty = property.properties ? property.properties[0] : property;
    
    // Check if we already have detailed data for this property
    if (!actualProperty.hasDetailedData) {
      // Fetch detailed property information
      await fetchPropertyDetails(actualProperty.id);
    }
  };

  // Fix the handleCalloutPress function to properly navigate to PropertyImages
  const handleCalloutPress = async (property) => {
    // If the heart was pressed, don't navigate
    if (heartPressRef.current) {
      // Reset the ref for next time
      heartPressRef.current = false;
      return;
    }
    
    // Set the loading state for this specific property
    setLoadingPropertyId(property.id);
    
    try {
      console.log('Property before fetching details:', property);
      
      // For sample properties, we need to handle them differently
      if (property.id.toString().length <= 2) {
        // This is likely a sample property with a numeric ID like "1", "2", etc.
        console.log('This appears to be a sample property, using as-is');
        navigation.navigate('PropertyImages', { 
          property: property,
          sourceScreen: 'Search'
        });
        return;
      }
      
      // Try to fetch the property directly by ID first
      const propertyDetails = await fetchPropertyById(property.id);
      
      if (propertyDetails) {
        // If we got property details, navigate to PropertyImages
        console.log('Successfully fetched property details, navigating to PropertyImages');
        
        // Format the property data for the PropertyImages screen
        const formattedProperty = {
          ...propertyDetails,
          // Ensure these UI-specific fields are present
          coordinate: property.coordinate,
          title: property.title || `$${propertyDetails.ListPrice?.toLocaleString() || 'N/A'} - ${propertyDetails.BedroomsTotal} bed, ${propertyDetails.BathroomsTotalInteger} bath`,
          description: property.description || propertyDetails.UnparsedAddress || (propertyDetails.StreetNumber + ' ' + propertyDetails.StreetName),
          image: propertyDetails.Media && propertyDetails.Media.length > 0 ? 
            { uri: propertyDetails.Media[0].MediaURL } : 
            property.image || require('../../assets/house1pic1.png'),
          images: propertyDetails.Media ? 
            propertyDetails.Media.map(m => ({ uri: m.MediaURL })) : 
            property.images || [require('../../assets/house1pic1.png')],
          hasDetailedData: true
        };
        
        navigation.navigate('PropertyImages', { 
          property: formattedProperty,
          sourceScreen: 'Search'
        });
      } else {
        // If direct fetch failed, try the old method as fallback
        console.log('Direct property fetch failed, trying fallback method');
        
        // Check if we already have detailed data
        let detailedProperty = mlsProperties.find(p => p.id === property.id && p.hasDetailedData);
        
        // If not, fetch it now
        if (!detailedProperty) {
          await fetchPropertyDetails(property.id);
          detailedProperty = mlsProperties.find(p => p.id === property.id && p.hasDetailedData);
        }
        
        if (detailedProperty) {
          navigation.navigate('PropertyImages', { 
            property: detailedProperty,
            sourceScreen: 'Search'
          });
        } else {
          // If we still don't have a valid property, show an error
          console.error('No valid property details found after all attempts');
          alert('Unable to load property details. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error handling callout press:', error);
      alert('Error loading property details. Please try again.');
    } finally {
      // Clear the loading state
      setLoadingPropertyId(null);
    }
  };

  // Modify the handleCalloutPress function
  const renderPropertyCallout = (property) => {
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    
    const handleViewDetails = async () => {
      setIsLoadingDetails(true);
      
      // Check if we already have detailed data
      let detailedProperty = mlsProperties.find(p => p.id === property.id && p.hasDetailedData);
      
      // If not, fetch it now
      if (!detailedProperty) {
        await fetchPropertyDetails(property.id);
        detailedProperty = mlsProperties.find(p => p.id === property.id && p.hasDetailedData);
      }
      
      setIsLoadingDetails(false);
      
      // Navigate to PropertyImages with the detailed property data
      console.log('Navigating to PropertyImages from SearchScreen');
      navigation.navigate('PropertyImages', { 
        property: detailedProperty || property,
        sourceScreen: 'Search'
      });
    };
    
    return (
      <View style={styles.enhancedCallout}>
        <View style={styles.calloutImageContainer}>
          <Image source={property.image} style={styles.calloutImage} />
          
          {/* Status badge - moved down slightly */}
          {property.listingStatus && (
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: getStatusColor(property.listingStatus),
                top: 20 // Moved down from the default position
              }
            ]}>
              <Text style={styles.statusText}>{property.listingStatus}</Text>
            </View>
          )}
          
          {/* Heart icon - moved up slightly */}
          <TouchableOpacity 
            style={[styles.calloutHeartContainer, { top: 8 }]} // Moved up from default position
            onPress={(event) => {
              // Mark that the heart was pressed
              heartPressRef.current = true;
              
              // Stop propagation to prevent navigation
              event.stopPropagation();
              event.preventDefault();
              
              // Toggle the loved status
              toggleLovedStatus(property, event);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name={isPropertyLoved(property.id) ? "heart" : "heart-outline"} 
              size={32} 
              color="#fff"
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calloutTextContainer}>
          <Text style={styles.calloutTitle}>{property.title}</Text>
          <Text style={styles.calloutDescription}>{property.description}</Text>
          
          <View style={styles.viewDetailsContainer}>
            {loadingPropertyId === property.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.viewDetailsText}>View Details</Text>
                <Ionicons name="chevron-forward" size={14} color="#fff" style={styles.arrowIcon} />
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Add this function to the SearchScreen component
  const handleMapTypePress = () => {
    console.log('Map type button pressed');
    setShowMapTypeModal(true);
  };

  // Update the search results rendering to be more like LocationScreen
  const renderSearchResults = () => {
    if (!showSearchResults) return null;
    
    const combinedResults = [...filteredCities, ...searchResults];
    
    if (combinedResults.length === 0) {
      if (isSearching) {
        return (
          <View style={styles.searchResultsContainer}>
            <View style={styles.searchingIndicator}>
              <ActivityIndicator size="small" color="#fc565b" />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          </View>
        );
      } else if (searchQuery.length > 0) {
        return (
          <View style={styles.searchResultsContainer}>
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No locations found</Text>
            </View>
          </View>
        );
      }
      return null;
    }
    
    console.log(`Rendering ${combinedResults.length} search results`);
    
    return (
      <View style={styles.searchResultsContainer}>
        {isSearching && (
          <View style={styles.searchingIndicator}>
            <ActivityIndicator size="small" color="#fc565b" />
            <Text style={styles.searchingText}>Searching...</Text>
          </View>
        )}
        
        <FlatList
          data={combinedResults}
          keyExtractor={(item) => item.id}
          style={styles.searchResultsList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.searchResultItem}
              onPress={() => handleLocationSelect(item)}
            >
              <Ionicons 
                name="location-outline" 
                size={20} 
                color="#fc565b" 
                style={styles.searchResultIcon} 
              />
              <Text style={styles.searchResultText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  };

  // Add these functions to the SearchScreen component
  const handleZoomIn = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      mapRef.current.animateToRegion(newRegion, 300);
      setRegion(newRegion);
    }
  };

  // Add these functions to handle filters
  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const applyFilters = (newFilters) => {
    console.log('Applying filters to SearchScreen:', newFilters);
    
    // Create a copy of the filters without the radius-related properties
    const searchScreenFilters = {
      ...newFilters,
      // Remove these properties as they're not needed for SearchScreen
      radiusMiles: undefined,
      addressText: undefined,
      mapRegion: undefined  // Also remove mapRegion to ensure it doesn't affect the current map view
    };
    
    // Update filter state
    setFilters(searchScreenFilters);
    setFiltersApplied(true);
    
    // Filter existing properties
    const filteredProperties = filterProperties(allFetchedProperties);
    setMlsProperties(filteredProperties);
    
    // Fetch properties with the new filters
    fetchPropertiesForRegion(region);
  };

  const clearFilters = () => {
    const defaultFilters = {
      screen: 'search',
      priceRange: { min: 0, max: 2000000 },
      beds: [],
      baths: [],
      sqft: { min: 0, max: 10000 },
      yearBuilt: { min: 1900, max: new Date().getFullYear() },
      homeType: [],
      hasBeenSet: false
    };
    
    setFilters(defaultFilters);
    setFiltersApplied(false);
    
    // Show all fetched properties
    setMlsProperties(allFetchedProperties);
    
    // Fetch properties without filters
    fetchPropertiesForRegion(region);
  };

  const handleSearchPress = () => {
    setIsLoading(true);
    fetchPropertiesForRegion(region).finally(() => {
      setIsLoading(false);
      setHasSearchedCurrentArea(true);
      // Animate to pressed color
      Animated.timing(buttonColorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  };

  const interpolatedColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#fc565b', 'white']
  });

  const interpolatedTextColor = buttonColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['white', '#fc565b']
  });

  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fc565b" />
        </View>
      )}
      
      {/* Map View with platform-specific provider */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        mapType={mapType}
        initialRegion={region}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {clusters.map((cluster, index) => {
          if (cluster.count === 1) {
            // Single property marker
            const property = cluster.properties[0];
            return (
              <Marker
                key={`property-${property.id}`}
                coordinate={property.coordinate}
                tracksViewChanges={false}
                onPress={() => onMarkerPress(property)}
              >
                <View style={styles.customMarker}>
                  <View style={styles.markerInner} />
                </View>
                
                <Callout
                  tooltip
                  onPress={(e) => {
                    // If the heart was pressed, don't navigate
                    if (heartPressRef.current) {
                      // Reset the ref for next time
                      heartPressRef.current = false;
                      return;
                    }
                    
                    // Otherwise, navigate to property details
                    handleCalloutPress(property);
                  }}
                >
                  <View style={styles.enhancedCallout}>
                    <View style={styles.calloutImageContainer}>
                      <Image source={property.image} style={styles.calloutImage} />
                      
                      {/* Status badge - moved down slightly */}
                      {property.listingStatus && (
                        <View style={[
                          styles.statusBadge, 
                          { 
                            backgroundColor: getStatusColor(property.listingStatus),
                            top: 20 // Moved down from the default position
                          }
                        ]}>
                          <Text style={styles.statusText}>{property.listingStatus}</Text>
                        </View>
                      )}
                      
                      {/* Heart icon - moved up slightly */}
                      <TouchableOpacity 
                        style={[styles.calloutHeartContainer, { top: 8 }]} // Moved up from default position
                        onPress={(event) => {
                          // Mark that the heart was pressed
                          heartPressRef.current = true;
                          
                          // Stop propagation to prevent navigation
                          event.stopPropagation();
                          event.preventDefault();
                          
                          // Toggle the loved status
                          toggleLovedStatus(property, event);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons 
                          name={isPropertyLoved(property.id) ? "heart" : "heart-outline"} 
                          size={32} 
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.calloutTextContainer}>
                      <Text style={styles.calloutTitle}>{property.title}</Text>
                      <Text style={styles.calloutDescription}>{property.description}</Text>
                      
                      <View style={styles.viewDetailsContainer}>
                        {loadingPropertyId === property.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Text style={styles.viewDetailsText}>View Details</Text>
                            <Ionicons name="chevron-forward" size={14} color="#fff" style={styles.arrowIcon} />
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          } else {
            // Cluster marker
            return (
              <Marker
                key={`cluster-${index}`}
                coordinate={cluster.coordinate}
                tracksViewChanges={false}
                onPress={() => {
                  // Zoom in when a cluster is pressed
                  const newRegion = {
                    latitude: cluster.coordinate.latitude,
                    longitude: cluster.coordinate.longitude,
                    latitudeDelta: region.latitudeDelta / 2,
                    longitudeDelta: region.longitudeDelta / 2,
                  };
                  mapRef.current?.animateToRegion(newRegion, 300);
                  setRegion(newRegion);
                }}
              >
                <View style={styles.clusterMarker}>
                  <Text style={styles.clusterText}>{cluster.count}</Text>
                </View>
              </Marker>
            );
          }
        })}
      </MapView>

      {/* Search Bar - Now with improved results display */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
              >
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
            
            {/* Add divider */}
            <View style={styles.iconDivider} />
            
            {/* Filter button inside search bar - using the same icon as HomeScreen */}
            <TouchableOpacity 
              style={styles.inlineButton} 
              onPress={handleFilterPress}
            >
              <Ionicons name="filter" size={20} color={filtersApplied ? "#fc565b" : "#666"} />
            </TouchableOpacity>
            
            {/* Add divider */}
            <View style={styles.iconDivider} />
            
            {/* Layers button inside search bar */}
            <TouchableOpacity
              style={styles.inlineButton}
              onPress={handleMapTypePress}
            >
              <Ionicons name="layers-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
        
        {renderSearchResults()}
      </View>

      {/* Map Type Modal */}
      <Modal
        visible={showMapTypeModal}
        transparent={true}
        onRequestClose={() => setShowMapTypeModal(false)}
        animationType="fade"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            console.log('Modal overlay pressed');
            setShowMapTypeModal(false);
          }}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                console.log('Standard view selected');
                setMapType('standard');
                setShowMapTypeModal(false);
              }}
            >
              <Text style={styles.modalText}>Standard View</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                console.log('Satellite view selected');
                setMapType('satellite');
                setShowMapTypeModal(false);
              }}
            >
              <Text style={styles.modalText}>Satellite View</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                console.log('Hybrid view selected');
                setMapType('hybrid');
                setShowMapTypeModal(false);
              }}
            >
              <Text style={styles.modalText}>Hybrid View</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Zoom Buttons */}
      <View style={styles.zoomButtonsContainer}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn}>
          <Ionicons name="add" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut}>
          <Ionicons name="remove" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Add Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={applyFilters}
        onClear={clearFilters}
        currentFilters={filters}
        screen="search"
      />

      {/* Search This Area Button */}
      <Animated.View style={[
        styles.searchAreaButton,
        {
          backgroundColor: interpolatedColor,
          borderColor: '#fc565b',
          borderWidth: buttonColorAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 2]
          })
        }
      ]}>
        <TouchableOpacity 
          style={styles.searchAreaButtonTouchable}
          onPress={handleSearchPress}
        >
          <Animated.Text style={[
            styles.searchAreaButtonText,
            { color: interpolatedTextColor }
          ]}>
            Search This Area
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBarContainer: {
    position: 'absolute',
    top: 80,
    left: 10,
    right: 10,
    zIndex: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    flex: 1, // Take up full width
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
    fontSize: 16,
  },
  clearButton: {
    padding: 5,
  },
  searchResultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 300,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 16,
  },
  searchResultsList: {
    maxHeight: 250,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultIcon: {
    marginRight: 10,
  },
  searchResultText: {
    fontSize: 16,
    color: '#333',
  },
  mapTypeButton: {
    position: 'absolute',
    top: 150,
    right: 20,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  customMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fc565b',
  },
  clusterMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clusterText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  modalText: {
    fontSize: 16,
  },
  enhancedCallout: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  calloutImageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  calloutImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  calloutTextContainer: {
    padding: 12,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  calloutDescription: {
    fontSize: 14,
    color: '#555',
  },
  viewDetailsContainer: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fc565b',
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 32,
  },
  viewDetailsText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    marginRight: 4,
  },
  arrowIcon: {
    marginTop: 1,
  },
  calloutHeartContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  filterButton: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginLeft: 0,
  },
  noResultsContainer: {
    padding: 15,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 16,
  },
  zoomButtonsContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 2,
  },
  zoomButton: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  iconDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  inlineButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  calloutBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
  },
  calloutYearBuilt: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  calloutBrokerage: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right',
    flex: 1,
  },
  searchAreaButton: {
    position: 'absolute',
    bottom: 30,
    left: '50%',
    transform: [{ translateX: -100 }], // Center the button
    width: 200, // Fixed width instead of full width
    height: 45, // Slightly reduced height
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 1000,
  },
  searchAreaButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchAreaButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SearchScreen;
