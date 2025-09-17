import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Switch,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
  Slider,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, getDocs, query, where, orderBy, doc, setDoc, deleteDoc, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
import { toPascalCase } from '../utils/stringUtils';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
// Fixed slider import

const FilterModal = ({ visible, onClose, onApply, onClear, currentFilters, screen }) => {
  // onClear is kept for backward compatibility but not used anymore

  // Default location (could be user's current location or a preset location)
  const defaultLocation = {
    latitude: 40.3916,
    longitude: -111.8508,
    latitudeDelta: 0.4,        // Initial zoom level shows entire city
    longitudeDelta: 0.4 * (width / height), // Maintain aspect ratio
  };

  // Initialize default filters with addressText
  const defaultFilters = {
    priceRange: { min: '', max: '' },
    sqft: { min: '', max: '' },
    yearBuilt: { min: '', max: '' },
    beds: [],
    baths: [],
    homeType: [],
    showOnlyNew: false,
    showOnlyOpenHouses: false,
    mapRegion: defaultLocation,
    radiusMiles: 10,
    addressText: '',
  };

  // Use defaultFilters for initial state
  const [filters, setFilters] = useState({...defaultFilters});
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState([]);
  const [showSavedFilters, setShowSavedFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilterId, setActiveFilterId] = useState(null);

  // Mock data for address suggestions - similar to LocationScreen
  const mockAddresses = [
    { id: '1', description: 'New York, NY', type: 'city' },
    { id: '2', description: 'Los Angeles, CA', type: 'city' },
    { id: '3', description: 'Chicago, IL', type: 'city' },
    { id: '4', description: 'Houston, TX', type: 'city' },
    { id: '5', description: 'Phoenix, AZ', type: 'city' },
    { id: '6', description: 'San Francisco, CA', type: 'city' },
    { id: '7', description: 'Seattle, WA', type: 'city' },
    { id: '8', description: 'Miami, FL', type: 'city' },
    { id: '9', description: 'Denver, CO', type: 'city' },
    { id: '10', description: 'Austin, TX', type: 'city' },
    { id: '11', description: 'Boston, MA', type: 'city' },
    { id: '12', description: 'Nashville, TN', type: 'city' },
    { id: '13', description: 'Portland, OR', type: 'city' },
    { id: '14', description: 'Atlanta, GA', type: 'city' },
    { id: '15', description: 'San Diego, CA', type: 'city' },
    // Add addresses as well
    { id: '16', description: '123 Main St, New York, NY', type: 'address' },
    { id: '17', description: '456 Market St, San Francisco, CA', type: 'address' },
    { id: '18', description: '789 Peachtree St, Atlanta, GA', type: 'address' },
    { id: '19', description: '555 Sunset Blvd, Los Angeles, CA', type: 'address' },
    { id: '20', description: '333 Lake Shore Dr, Chicago, IL', type: 'address' },
  ];

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  // Load saved filters when the modal becomes visible
  useEffect(() => {
    if (visible) {
      // First load saved filters to find the active one
      loadSavedFilters().then(activeFilterData => {
        // If we have an active filter from Firestore, use its data
        if (activeFilterData) {
          console.log('Using active filter from Firestore:', activeFilterData.Name);
          
          // Convert the Firestore filter format to the app format
          const hasMapData = activeFilterData.MapRegion && 
            activeFilterData.MapRegion.Latitude && 
            activeFilterData.MapRegion.Longitude;
          
          const activeFilterFormatted = {
            priceRange: {
              min: activeFilterData.PriceRange?.Min || 0,
              max: activeFilterData.PriceRange?.Max || 2000000
            },
            beds: activeFilterData.Beds || [],
            baths: activeFilterData.Baths || [],
            homeType: activeFilterData.HomeType || [],
            sqft: {
              min: activeFilterData.Sqft?.Min || 0,
              max: activeFilterData.Sqft?.Max || 10000
            },
            yearBuilt: {
              min: activeFilterData.YearBuilt?.Min || 1900,
              max: activeFilterData.YearBuilt?.Max || new Date().getFullYear()
            },
            addressText: activeFilterData.AddressText || '',
            mapRegion: hasMapData ? {
              latitude: activeFilterData.MapRegion.Latitude,
              longitude: activeFilterData.MapRegion.Longitude,
              latitudeDelta: activeFilterData.MapRegion.LatitudeDelta || calculateZoomForRadius(activeFilterData.RadiusMiles || 10),
              longitudeDelta: activeFilterData.MapRegion.LongitudeDelta || (calculateZoomForRadius(activeFilterData.RadiusMiles || 10) * (width / height))
            } : defaultLocation,
            radiusMiles: activeFilterData.RadiusMiles || 10,
            screen: activeFilterData.Screen || screen,
            activeFilterId: activeFilterData.id,
            name: activeFilterData.Name || ''
          };
          
          // Set the filter values in the UI
          setFilters(activeFilterFormatted);
          setFilterName(activeFilterData.Name || '');
          setActiveFilterId(activeFilterData.id);
          
          // Force map to reload with the correct region
          setMapLoaded(false);
          setTimeout(() => setMapLoaded(true), 100);
        } 
        // If no active filter from Firestore but we have currentFilters, use those
        else if (currentFilters) {
          // Check if the current filters have map region data
          const hasMapData = currentFilters.mapRegion && 
            currentFilters.mapRegion.latitude && 
            currentFilters.mapRegion.longitude;
          
          // If no map data, use default location
          const filtersToSet = {
            ...currentFilters,
            mapRegion: hasMapData ? currentFilters.mapRegion : defaultLocation,
            radiusMiles: currentFilters.radiusMiles || 10
          };
          
          console.log('Using current filters:', filtersToSet);
          
          setFilters(filtersToSet);
          
          // If there's an activeFilterId in the current filters, set it
          if (currentFilters.activeFilterId) {
            setActiveFilterId(currentFilters.activeFilterId);
            
            // If there's a name, set the filter name
            if (currentFilters.name) {
              setFilterName(currentFilters.name);
            }
          }
          
          // Force map to reload with the correct region
          setMapLoaded(false);
          setTimeout(() => setMapLoaded(true), 100);
        }
      });
    }
  }, [visible, currentFilters]);

  // Load saved filters from Firestore
  const loadSavedFilters = async () => {
    try {
      setIsLoading(true);
      const userId = auth.currentUser?.uid ?? 'guest';
      
      if (!userId) {
        console.log('No user logged in');
        setSavedFilters([]);
        setIsLoading(false);
        return null;
      }
      
      console.log('Loading saved filters for user:', userId);
      
      // Get filters from the Users/{userId}/Filters collection
      const filtersRef = collection(db, 'Users', userId, 'Filters');
      
      // Try different queries to ensure we get filters regardless of field name casing
      let querySnapshot;
      try {
        // First try with CreatedAt (new format)
        const q = query(filtersRef, orderBy('CreatedAt', 'desc'));
        querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          // If no results, try with DateSaved (old format)
          const q2 = query(filtersRef);
          querySnapshot = await getDocs(q2);
        }
      } catch (error) {
        console.log('Error with ordered query, trying unordered:', error);
        // Fallback to unordered query
        querySnapshot = await getDocs(filtersRef);
      }
      
      console.log('Found', querySnapshot.size, 'saved filters');
      
      const filters = [];
      let activeFilter = null;
      
      // First pass: find the active filter
      querySnapshot.forEach((doc) => {
        // Skip if it's not a valid filter document
        if (doc.id === 'default') return;
        
        const data = doc.data();
        
        // Check if this is the active filter
        if (data.IsActive === true) {
          activeFilter = {
            id: doc.id,
            Name: data.Name || '',
            PriceRange: data.PriceRange || { Min: 0, Max: 2000000 },
            Beds: data.Beds || [],
            Baths: data.Baths || [],
            Sqft: data.Sqft || { Min: 0, Max: 10000 },
            YearBuilt: data.YearBuilt || { Min: 1900, Max: new Date().getFullYear() },
            Screen: data.Screen || 'home',
            IsActive: true,
            HomeType: data.HomeType || [],
            AddressText: data.AddressText || '',
            MapRegion: data.MapRegion || null,
            RadiusMiles: data.RadiusMiles || 10,
            CreatedAt: data.CreatedAt || data.DateSaved || Timestamp.now()
          };
          setActiveFilterId(doc.id);
        }
      });
      
      // Second pass: collect non-active filters
      querySnapshot.forEach((doc) => {
        // Skip if it's not a valid filter document or if it's the active filter
        if (doc.id === 'default' || (activeFilter && doc.id === activeFilter.id)) return;
        
        const data = doc.data();
        
        filters.push({
          id: doc.id,
          Name: data.Name || '',
          PriceRange: data.PriceRange || { Min: 0, Max: 2000000 },
          Beds: data.Beds || [],
          Baths: data.Baths || [],
          Sqft: data.Sqft || { Min: 0, Max: 10000 },
          YearBuilt: data.YearBuilt || { Min: 1900, Max: new Date().getFullYear() },
          Screen: data.Screen || 'home',
          IsActive: false,
          HomeType: data.HomeType || [],
          AddressText: data.AddressText || '',
          MapRegion: data.MapRegion || null,
          RadiusMiles: data.RadiusMiles || 10,
          CreatedAt: data.CreatedAt || data.DateSaved || Timestamp.now()
        });
      });
      
      console.log('Processed filters:', filters.length, 'Active filter:', activeFilter ? activeFilter.id : 'none');
      
      // Put the active filter at the top of the list
      const sortedFilters = activeFilter ? [activeFilter, ...filters] : filters;
      
      setSavedFilters(sortedFilters);
      setIsLoading(false);
      
      // Return the active filter if found
      return activeFilter;
    } catch (error) {
      console.error('Error loading saved filters:', error);
      setIsLoading(false);
      return null;
    }
  };

  const toggleBedSelection = (num) => {
    setFilters(prev => ({
      ...prev,
      beds: prev.beds?.includes(num)
        ? prev.beds.filter(b => b !== num) // Remove if already selected
        : [...(prev.beds || []), num]      // Add if not selected
    }));
  };

  const toggleBathSelection = (num) => {
    setFilters(prev => {
      const newBaths = prev.baths?.includes(num)
        ? prev.baths.filter(item => item !== num)
        : [...(prev.baths || []), num];
      return { ...prev, baths: newBaths };
    });
  };

  const togglePropertyType = (type) => {
    setFilters(prev => {
      const newHomeType = prev.homeType?.includes(type)
        ? prev.homeType.filter(item => item !== type)
        : [...(prev.homeType || []), type];
      return { ...prev, homeType: newHomeType };
    });
  };

  const handleApply = () => {
    console.log('Applying filter:', filters);
    
    // Update the active status in Firestore if we have an activeFilterId
    const userId = auth.currentUser?.uid ?? 'guest';
    if (userId && activeFilterId) {
      updateActiveFilterStatus(userId, activeFilterId);
    }
    
    // Ensure we have a valid map region and radius
    const hasMapData = filters.mapRegion && 
      filters.mapRegion.latitude && 
      filters.mapRegion.longitude;
    
    // Create the filter object to apply
    const filterToApply = {
      ...filters,
      mapRegion: hasMapData ? filters.mapRegion : defaultLocation,
      radiusMiles: filters.radiusMiles || 10,
      name: filterName,
      id: activeFilterId || 'custom',
      activeFilterId: activeFilterId
    };
    
    console.log('Applying filter with map region:', filterToApply.mapRegion);
    console.log('Applying filter with radius:', filterToApply.radiusMiles);
    
    // Apply the filter
    onApply(filterToApply);
    onClose();
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      Alert.alert('Filter Name Required', 'Please enter a name for this filter.');
      return;
    }
    
    console.log('Saving filter:', filterName, filters);
    
    // Check if a filter with this name already exists
    const userId = auth.currentUser?.uid ?? 'guest';
    if (userId) {
      try {
        const filtersRef = collection(db, 'Users', userId, 'Filters');
        const q = query(filtersRef, where('Name', '==', filterName));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // A filter with this name already exists
          Alert.alert(
            'Filter Name Exists',
            'A filter with this name already exists. Do you want to overwrite it?',
            [
              {
                text: 'Cancel',
                style: 'cancel'
              },
              {
                text: 'Overwrite',
                onPress: async () => {
                  try {
                    // Get the existing filter document
                    const existingFilterDoc = querySnapshot.docs[0];
                    const existingFilterId = existingFilterDoc.id;
                    
                    // Delete the existing filter
                    await deleteDoc(doc(db, 'Users', userId, 'Filters', existingFilterId));
                    
                    // Save the new filter and make it active
                    const newFilterId = await saveFilterToFirebase(filterName, filters);
                    if (newFilterId) {
                      // The filter is now active (handled in saveFilterToFirebase)
                      Alert.alert('Success', 'Filter updated and set as active!');
                      
                      // Apply the filter immediately
                      const filterToApply = {
                        ...filters,
                        name: filterName,
                        id: newFilterId,
                        activeFilterId: newFilterId
                      };
                      onApply(filterToApply);
                      onClose();
                    }
                  } catch (error) {
                    console.error('Error overwriting filter:', error);
                    Alert.alert('Error', 'Failed to update filter. Please try again.');
                  }
                }
              }
            ]
          );
        } else {
          // No filter with this name exists, save it
          const newFilterId = await saveFilterToFirebase(filterName, filters);
          if (newFilterId) {
            // The filter is now active (handled in saveFilterToFirebase)
            Alert.alert('Success', 'Filter saved and set as active!');
            
            // Apply the filter immediately
            const filterToApply = {
              ...filters,
              name: filterName,
              id: newFilterId,
              activeFilterId: newFilterId
            };
            onApply(filterToApply);
            onClose();
          }
        }
      } catch (error) {
        console.error('Error checking for existing filter:', error);
        Alert.alert('Error', 'Failed to save filter. Please try again.');
      }
    } else {
      Alert.alert('Error', 'You must be logged in to save filters.');
    }
  };

  // Select a saved filter and apply its values
  const selectSavedFilter = async (filter) => {
    console.log('Selected filter:', filter);
    
    // Set this as the active filter in local state
    setActiveFilterId(filter.id);
    
    // Update the active status in Firestore
    const userId = auth.currentUser?.uid ?? 'guest';
    if (userId) {
      await updateActiveFilterStatus(userId, filter.id);
      
      // Reload saved filters to ensure the active one appears at the top
      await loadSavedFilters();
    }
    
    // Check if the filter has map region data
    const hasMapData = filter.MapRegion && 
      filter.MapRegion.Latitude && 
      filter.MapRegion.Longitude;
    
    // Convert to the format used in the app
    const selectedFilter = {
      priceRange: {
        min: filter.PriceRange?.Min || 0,
        max: filter.PriceRange?.Max || 2000000
      },
      beds: filter.Beds || [],
      baths: filter.Baths || [],
      homeType: filter.HomeType || [],
      sqft: {
        min: filter.Sqft?.Min || 0,
        max: filter.Sqft?.Max || 10000
      },
      yearBuilt: {
        min: filter.YearBuilt?.Min || 1900,
        max: filter.YearBuilt?.Max || new Date().getFullYear()
      },
      addressText: filter.AddressText || '',
      mapRegion: hasMapData ? {
        latitude: filter.MapRegion.Latitude,
        longitude: filter.MapRegion.Longitude,
        latitudeDelta: filter.MapRegion.LatitudeDelta || calculateZoomForRadius(filter.RadiusMiles || 10),
        longitudeDelta: filter.MapRegion.LongitudeDelta || (calculateZoomForRadius(filter.RadiusMiles || 10) * (width / height))
      } : defaultLocation,
      radiusMiles: filter.RadiusMiles || 10,
      screen: filter.Screen || screen,
      activeFilterId: filter.id,
      name: filter.Name || ''
    };
    
    console.log('Map region in selected filter:', selectedFilter.mapRegion);
    console.log('Radius miles in selected filter:', selectedFilter.radiusMiles);
    
    // Set the filter values in the UI
    setFilters(selectedFilter);
    
    // Set the filter name
    setFilterName(filter.Name || '');
    
    // Force map to reload with the new region
    setMapLoaded(false);
    setTimeout(() => setMapLoaded(true), 100);
    
    // Log the selected filter to verify homeType is included
    console.log('Loaded filter with homeType:', selectedFilter.homeType);
    
    // Don't apply the filter immediately - wait for user to press Apply button
    
    // Close the saved filters dropdown
    setShowSavedFilters(false);
  };
  
  // Render an individual saved filter
  const renderSavedFilterItem = ({ item }) => {
    // Create a simple description of the filter
    let filterDescription = '';
    
    if (item.Beds && item.Beds.length) {
      filterDescription += `${item.Beds.length} beds • `;
    }
    
    if (item.Baths && item.Baths.length) {
      filterDescription += `${item.Baths.length} baths • `;
    }
    
    if (item.HomeType && item.HomeType.length) {
      filterDescription += `${item.HomeType.length} property types • `;
    }
    
    if (item.PriceRange) {
      filterDescription += `$${item.PriceRange.Min.toLocaleString()}-$${item.PriceRange.Max.toLocaleString()}`;
    }
    
    const isActive = item.id === activeFilterId;
    
    return (
      <View style={styles.savedFilterContainer}>
        <TouchableOpacity
          style={[
            styles.savedFilterItem, 
            isActive && styles.savedFilterItemActive
          ]}
          onPress={() => selectSavedFilter(item)}
        >
          {/* Checkbox on the left side */}
          <View style={styles.checkboxContainer}>
            {isActive ? (
              <Ionicons name="checkbox" size={24} color="#fc565b" />
            ) : (
              <Ionicons name="square-outline" size={24} color="#888" />
            )}
          </View>
          
          {/* Filter content in the middle */}
          <View style={styles.savedFilterContent}>
            <Text style={[styles.savedFilterName, isActive && styles.activeFilterText]}>{item.Name}</Text>
            <Text style={styles.savedFilterDetails}>{filterDescription}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Delete button on the right side */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => deleteFilter(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
        </TouchableOpacity>
      </View>
    );
  };

  const saveFilterToFirebase = async (name, filterData) => {
    try {
      const userId = auth.currentUser?.uid ?? 'guest';
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to save filters.');
        return;
      }
      
      // Ensure we have valid map data
      const hasMapData = filterData.mapRegion && 
        filterData.mapRegion.latitude && 
        filterData.mapRegion.longitude;
      
      // Format the filter data for Firestore
      const filterToSave = {
        Name: name,
        PriceRange: {
          Min: parseInt(filterData.priceRange?.min) || 0,
          Max: parseInt(filterData.priceRange?.max) || 2000000
        },
        Beds: filterData.beds || [],
        Baths: filterData.baths || [],
        HomeType: filterData.homeType || [],
        Sqft: {
          Min: parseInt(filterData.sqft?.min) || 0,
          Max: parseInt(filterData.sqft?.max) || 10000
        },
        YearBuilt: {
          Min: parseInt(filterData.yearBuilt?.min) || 1900,
          Max: parseInt(filterData.yearBuilt?.max) || new Date().getFullYear()
        },
        Screen: filterData.screen || screen,
        CreatedAt: Timestamp.now(),
        IsActive: true,
        AddressText: filterData.addressText || '',
        MapRegion: hasMapData ? {
          Latitude: filterData.mapRegion.latitude,
          Longitude: filterData.mapRegion.longitude,
          LatitudeDelta: filterData.mapRegion.latitudeDelta,
          LongitudeDelta: filterData.mapRegion.longitudeDelta
        } : null,
        RadiusMiles: filterData.radiusMiles || 10
      };
      
      console.log('Saving filter with map region:', filterToSave.MapRegion);
      console.log('Saving filter with radius:', filterToSave.RadiusMiles);
      
      // Create a new document in the Filters collection
      const filtersRef = collection(db, 'Users', userId, 'Filters');
      const docRef = doc(filtersRef);
      await setDoc(docRef, filterToSave);
      
      console.log('Filter saved successfully with ID:', docRef.id);
      
      // Update active status in Firestore (set all other filters to inactive)
      await updateActiveFilterStatus(userId, docRef.id);
      
      // Reload saved filters to reflect the changes
      await loadSavedFilters();
      
      // Set this as the active filter in local state
      setActiveFilterId(docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('Error saving filter:', error);
      Alert.alert('Error', 'Failed to save filter. Please try again.');
      return null;
    }
  };

  // Delete a filter from Firebase
  const deleteFilter = async (filterId) => {
    try {
      const userId = auth.currentUser?.uid ?? 'guest';
      if (!userId) {
        Alert.alert('Error', 'You must be logged in to delete filters.');
        return;
      }
      
      // Find the filter by ID
      const filter = savedFilters.find(f => f.id === filterId);
      if (!filter) {
        console.error('Filter not found with ID:', filterId);
        return;
      }
      
      // Confirm deletion
      Alert.alert(
        'Delete Filter',
        `Are you sure you want to delete the filter "${filter.Name}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Delete the filter document using its ID
                const filterRef = doc(db, 'Users', userId, 'Filters', filterId);
                await deleteDoc(filterRef);
                console.log('Filter deleted:', filterId);
                
                // If this was the active filter, clear the active filter ID
                if (filterId === activeFilterId) {
                  setActiveFilterId(null);
                }
                
                // Refresh the filter list
                loadSavedFilters();
                
                // Show success message
                Alert.alert('Success', 'Filter deleted successfully!');
              } catch (error) {
                console.error('Error deleting filter:', error);
                Alert.alert('Error', 'Failed to delete filter. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error preparing to delete filter:', error);
      Alert.alert('Error', 'Failed to delete filter. Please try again.');
    }
  };

  // Function to handle search input and show suggestions - similar to LocationScreen
  const handleAddressSearch = (text) => {
    setFilters(prev => ({
      ...prev,
      addressText: text
    }));
    
    if (text.length > 2) {
      // Search for locations using the Expo Location API
      searchLocations(text);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };
  
  // Search for locations using the Expo Location API - like LocationScreen
  const searchLocations = async (query) => {
    try {
      // Show loading indicator
      setIsLoading(true);
      
      // Special handling for ZIP codes (US format)
      const isZipCode = /^\d{5}(-\d{4})?$/.test(query);
      let searchQuery = query;
      
      if (isZipCode) {
        // For ZIP codes, append "ZIP code" to improve geocoding accuracy
        searchQuery = `${query} ZIP code`;
      }
      
      // Use the Location API to geocode the search query
      const locations = await Location.geocodeAsync(searchQuery);
      
      if (locations.length > 0) {
        // Get full address information for each result
        const resultsWithNames = await Promise.all(
          locations.slice(0, 5).map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            
            let description = query;
            if (address.length > 0) {
              const addr = address[0];
              
              // Format the address to only show city and state
              if (addr.city && addr.region) {
                // Always just show City, State regardless of address type
                description = `${addr.city}, ${addr.region}`;
                
                // For ZIP code searches, include the ZIP
                if (isZipCode && addr.postalCode) {
                  description = `${addr.city}, ${addr.region} ${addr.postalCode}`;
                }
              } else if (addr.region) {
                description = addr.region;
              }
            }
            
            return {
              ...loc,
              description,
              id: `${loc.latitude}-${loc.longitude}`,
              type: address[0]?.street ? 'address' : 'city'
            };
          })
        );
        
        setAddressSuggestions(resultsWithNames);
        setShowAddressSuggestions(true);
      } else {
        // Fall back to mock data for demonstration
        const filteredSuggestions = mockAddresses.filter(
          address => address.description.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        setAddressSuggestions(filteredSuggestions);
        setShowAddressSuggestions(filteredSuggestions.length > 0);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      
      // Fall back to mock data on error
      const filteredSuggestions = mockAddresses.filter(
        address => address.description.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);
      
      setAddressSuggestions(filteredSuggestions);
      setShowAddressSuggestions(filteredSuggestions.length > 0);
    } finally {
      // Hide loading indicator
      setIsLoading(false);
    }
  };
  
  // Handle when a suggestion is selected
  const handleSuggestionSelect = (suggestion) => {
    console.log('Selected location:', suggestion);
    
    setFilters(prev => {
      // Calculate the appropriate zoom level based on current radius
      const delta = calculateZoomForRadius(prev.radiusMiles);
      
      // Update with the selected location text
      const updatedFilters = {
        ...prev,
        addressText: suggestion.description,
      };
      
      // If this is a geocoded result with real coordinates, update the mapRegion
      if (suggestion.latitude && suggestion.longitude) {
        console.log('Setting map region with coordinates:', suggestion.latitude, suggestion.longitude);
        
        // Update the map region to center on the selected location with appropriate zoom
        updatedFilters.mapRegion = {
          latitude: suggestion.latitude,
          longitude: suggestion.longitude,
          latitudeDelta: delta,
          longitudeDelta: delta * (width / height), // Maintain aspect ratio
        };
      } else {
        console.log('No coordinates available for this suggestion');
      }
      
      return updatedFilters;
    });
    
    // Hide the suggestions after selection
    setShowAddressSuggestions(false);
  };
  
  // Render a suggestion item - similar to LocationScreen's renderCityItem
  const renderSuggestionItem = (suggestion) => (
    <TouchableOpacity
      key={suggestion.id}
      style={styles.suggestionItem}
      onPress={() => handleSuggestionSelect(suggestion)}
    >
      <Ionicons 
        name={suggestion.type === 'city' ? 'location' : 'home-outline'} 
        size={16} 
        color="#999" 
        style={{marginRight: 10}} 
      />
      <Text style={styles.suggestionText}>{suggestion.description}</Text>
    </TouchableOpacity>
  );

  // Calculate the appropriate zoom level (delta) based on radius in miles
  const calculateZoomForRadius = (radiusMiles) => {
    // Based on testing, these values provide a good approximation
    // to show the entire radius circle at different zoom levels
    const milesPerDelta = 60; // Approximate miles covered by 1.0 delta
    
    // Calculate the appropriate delta to show the entire radius
    // Add a 30% buffer to make sure the whole circle is visible
    const delta = (radiusMiles * 2.6) / milesPerDelta;
    
    // Constrain to reasonable delta values
    return Math.max(0.01, Math.min(delta, 30));
  };
  
  // Update the map region when the radius changes
  const updateMapForRadius = (radius) => {
    const delta = calculateZoomForRadius(radius);
    
    setFilters(prev => {
      // Only update if we have a map region already
      if (!prev.mapRegion) return prev;
      
      return {
        ...prev,
        radiusMiles: radius,
        mapRegion: {
          ...prev.mapRegion,
          latitudeDelta: delta,
          longitudeDelta: delta * (width / height), // Maintain aspect ratio
        }
      };
    });
  };

  // Function to find if current filters match any saved filter
  const findMatchingFilter = (currentFilters) => {
    if (!savedFilters || savedFilters.length === 0) return null;
    
    return savedFilters.find(filter => {
      // Compare price ranges
      const priceMatch = 
        (!currentFilters.priceRange?.min || !filter.PriceRange?.Min || 
         parseInt(currentFilters.priceRange.min) === filter.PriceRange.Min) &&
        (!currentFilters.priceRange?.max || !filter.PriceRange?.Max || 
         parseInt(currentFilters.priceRange.max) === filter.PriceRange.Max);
      
      // Compare beds and baths
      const bedsMatch = arraysEqual(currentFilters.beds || [], filter.Beds || []);
      const bathsMatch = arraysEqual(currentFilters.baths || [], filter.Baths || []);
      
      // Compare property types
      const homeTypeMatch = arraysEqual(currentFilters.homeType || [], filter.HomeType || []);
      
      // Return true if all criteria match
      return priceMatch && bedsMatch && bathsMatch && homeTypeMatch;
    });
  };

  // Helper function to compare arrays
  const arraysEqual = (a, b) => {
    if (!a || !b) return false;
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  };

  // Add a function to update the active status of filters
  const updateActiveFilterStatus = async (userId, newActiveId) => {
    try {
      // Get all filters
      const filtersRef = collection(db, 'Users', userId, 'Filters');
      const querySnapshot = await getDocs(filtersRef);
      
      // Import writeBatch from firebase/firestore at the top of your file
      const batch = writeBatch(db);
      
      querySnapshot.forEach((document) => {
        const docRef = doc(db, 'Users', userId, 'Filters', document.id);
        
        // If this is the new active filter, set IsActive to true
        // Otherwise, set IsActive to false
        batch.update(docRef, { 
          IsActive: document.id === newActiveId 
        });
      });
      
      // Commit the batch update
      await batch.commit();
    } catch (error) {
      console.error('Error updating active filter status:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      onRequestClose={() => onClose()}
      animationType="slide"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* Saved Filters Section */}
          <View style={styles.savedFiltersHeader}>
            <TouchableOpacity 
              style={styles.savedFiltersToggle}
              onPress={() => {
                // Toggle the dropdown and load filters if it's being opened
                if (!showSavedFilters) {
                  loadSavedFilters();
                }
                setShowSavedFilters(!showSavedFilters);
              }}
            >
              <Text style={styles.savedFiltersText}>Saved Filters</Text>
              <Ionicons 
                name={showSavedFilters ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>
            
            {/* Saved Filters List */}
            {showSavedFilters && (
              <View style={styles.savedFiltersContainer}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fc565b" style={{ marginVertical: 20 }} />
                ) : savedFilters.length > 0 ? (
                  <FlatList
                    data={savedFilters}
                    renderItem={renderSavedFilterItem}
                    keyExtractor={(item) => item.id}
                    style={styles.savedFiltersList}
                    contentContainerStyle={styles.savedFiltersListContent}
                  />
                ) : (
                  <Text style={styles.noFiltersText}>No saved filters</Text>
                )}
              </View>
            )}
          </View>

          {/* Filter Name Input */}
          <View style={styles.filterNameContainer}>
            <Text style={styles.sectionTitle}>Filter Name</Text>
            <TextInput
              style={styles.filterNameInput}
              placeholder="Enter filter name"
              value={filterName}
              onChangeText={setFilterName}
            />
          </View>

          <ScrollView 
            style={styles.scrollContent}
            contentContainerStyle={{ paddingBottom: 80 }}
            bounces={true}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.modalTitle}>Filters</Text>

            {/* Price Range Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.input}
                  placeholder="Min Price"
                  keyboardType="numeric"
                  value={filters.priceRange?.min?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    priceRange: {
                      ...prev.priceRange,
                      min: text
                    }
                  }))}
                />
                <Text>-</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max Price"
                  keyboardType="numeric"
                  value={filters.priceRange?.max?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    priceRange: {
                      ...prev.priceRange,
                      max: text
                    }
                  }))}
                />
              </View>
            </View>

            {/* Beds */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Bedrooms</Text>
              <View style={styles.buttonGroup}>
                {[1, 2, 3, 4, '5+'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.filterButton,
                      filters.beds?.includes(num) && styles.filterButtonActive
                    ]}
                    onPress={() => toggleBedSelection(num)}
                  >
                    <Text style={filters.beds?.includes(num) ? styles.filterButtonTextActive : styles.filterButtonText}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Baths */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Bathrooms</Text>
              <View style={styles.buttonGroup}>
                {[1, 2, 3, 4, '5+'].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.filterButton,
                      filters.baths?.includes(num) && styles.filterButtonActive
                    ]}
                    onPress={() => toggleBathSelection(num)}
                  >
                    <Text style={filters.baths?.includes(num) ? styles.filterButtonTextActive : styles.filterButtonText}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Square Footage Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Square Footage</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.sqft?.min?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    sqft: {
                      ...(prev.sqft || {}),
                      min: text
                    }
                  }))}
                />
                <Text>-</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.sqft?.max?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    sqft: {
                      ...(prev.sqft || {}),
                      max: text
                    }
                  }))}
                />
              </View>
            </View>

            {/* Property Type Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Property Type</Text>
              <View style={styles.propertyTypeContainer}>
                {['House', 'Townhouse', 'Condo', 'Apt', 'Land', 'Multifamily', 'Manufactured House'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.propertyTypeButton,
                      filters.homeType?.includes(type) && styles.filterButtonActive
                    ]}
                    onPress={() => togglePropertyType(type)}
                  >
                    <Text style={filters.homeType?.includes(type) ? styles.filterButtonTextActive : styles.filterButtonText}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Loved Properties Toggle - Only for SavedScreen */}
            {screen === 'saved' && (
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Show Only Loved Properties</Text>
                <Switch
                  value={filters.onlyLoved || false}
                  onValueChange={(value) => setFilters(prev => ({
                    ...prev,
                    onlyLoved: value
                  }))}
                  trackColor={{ false: "#767577", true: "#fc565b" }}
                  thumbColor={filters.onlyLoved ? "#fff" : "#f4f3f4"}
                  style={styles.switch}
                />
              </View>
            )}

            {/* Map Area Section - Only show for screens other than search */}
            {screen !== 'search' && (
              <View style={styles.mapSection}>
                <Text style={styles.sectionTitle}>Map Area</Text>
                
                {/* Address Search - styled similar to LocationScreen */}
                <View style={styles.addressSearchContainer}>
                  <View style={styles.addressInputContainer}>
                    <View style={styles.locationIconContainer}>
                      <Ionicons name="location" size={16} color="#999" />
                    </View>
                    <TextInput
                      style={styles.addressInput}
                      placeholder="Enter address or city"
                      value={filters.addressText || ''}
                      onChangeText={handleAddressSearch}
                      returnKeyType="search"
                    />
                    {filters.addressText && filters.addressText.length > 0 && (
                      <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                          setFilters(prev => ({ ...prev, addressText: '' }));
                          setShowAddressSuggestions(false);
                        }}
                      >
                        <Ionicons name="close-circle" size={18} color="#999" />
                      </TouchableOpacity>
                    )}
                    
                    {isLoading && (
                      <ActivityIndicator size="small" color="#fc565b" style={{ marginLeft: 5 }} />
                    )}
                  </View>
                  
                  {/* Address Suggestions Dropdown - styled similar to LocationScreen */}
                  {showAddressSuggestions && addressSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      {addressSuggestions.map(suggestion => renderSuggestionItem(suggestion))}
                    </View>
                  )}
                </View>
                
                <Text style={styles.mapSubtitle}>Set search radius: {filters.radiusMiles} miles</Text>
                
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={filters.radiusMiles}
                  minimumTrackTintColor="#fc565b"
                  maximumTrackTintColor="#ddd"
                  thumbTintColor="#fc565b"
                  onValueChange={(value) => {
                    updateMapForRadius(value);
                  }}
                />
                
                <View style={styles.mapContainer}>
                  {!mapLoaded && (
                    <View style={styles.mapLoading}>
                      <Text style={styles.mapLoadingText}>Loading map...</Text>
                    </View>
                  )}
                  <MapView
                    style={styles.map}
                    region={filters.mapRegion || defaultLocation}
                    onRegionChangeComplete={(region) => {
                      console.log('Map region changed:', region);
                      setFilters(prev => ({
                        ...prev,
                        mapRegion: region
                      }));
                    }}
                    onMapReady={() => {
                      console.log('Map ready with region:', filters.mapRegion);
                      setMapLoaded(true);
                    }}
                  >
                    {filters.mapRegion && (
                      <>
                        <Marker
                          coordinate={{
                            latitude: filters.mapRegion.latitude,
                            longitude: filters.mapRegion.longitude
                          }}
                        >
                          <View style={styles.customMarker}>
                            <View style={styles.markerInner} />
                          </View>
                        </Marker>
                        <Circle
                          center={{
                            latitude: filters.mapRegion.latitude,
                            longitude: filters.mapRegion.longitude
                          }}
                          radius={filters.radiusMiles * 1609.34} // Convert miles to meters (1 mile = 1609.34 meters exactly)
                          strokeWidth={1}
                          strokeColor="rgba(252, 86, 91, 0.5)"
                          fillColor="rgba(252, 86, 91, 0.15)"
                        />
                      </>
                    )}
                  </MapView>
                </View>
              </View>
            )}

            {/* Year Built Section */}
            <View style={styles.filterSection}>
              <Text style={styles.sectionTitle}>Year Built</Text>
              <View style={styles.rangeInputs}>
                <TextInput
                  style={styles.input}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.yearBuilt?.min?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    yearBuilt: {
                      ...(prev.yearBuilt || {}),
                      min: text
                    }
                  }))}
                />
                <Text>-</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.yearBuilt?.max?.toString() || ''}
                  onChangeText={(text) => setFilters(prev => ({
                    ...prev,
                    yearBuilt: {
                      ...(prev.yearBuilt || {}),
                      max: text
                    }
                  }))}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.fixedButtonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApply}
            >
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSaveFilter}
            >
              <Text style={styles.buttonText}>Save Filter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: height * 0.8,
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginHorizontal: 5,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
  filterButtonActive: {
    backgroundColor: '#fc565b',
    borderColor: '#fc565b',
  },
  filterButtonText: {
    color: '#333',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    height: 44,
  },
  applyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    height: 44,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  mapSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  mapText: {
    fontSize: 16,
    color: '#666',
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 5,
  },
  fixedButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: 'white',
  },
  switch: {
    marginTop: 8,
  },
  savedFiltersHeader: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  savedFiltersToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  savedFiltersText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  savedFiltersContainer: {
    marginBottom: 15,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
  },
  savedFiltersList: {
    maxHeight: 200,
  },
  savedFiltersListContent: {
    padding: 10,
  },
  savedFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  savedFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
    flex: 1,
    borderRadius: 8,
  },
  savedFilterItemActive: {
    backgroundColor: '#fff8f8',
    borderWidth: 2,
    borderColor: '#fc565b',
    borderRadius: 8,
  },
  checkboxContainer: {
    marginRight: 12,
    marginLeft: -5,
  },
  savedFilterContent: {
    flex: 1,
  },
  savedFilterName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activeFilterText: {
    color: '#fc565b',
    fontWeight: '600',
  },
  savedFilterDetails: {
    fontSize: 13,
    color: '#666',
  },
  noFiltersText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
  },
  filterNameContainer: {
    marginTop: 10,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
  },
  filterNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  savedFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  savedFilterDate: {
    fontSize: 14,
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#fc565b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  mapContainer: {
    height: 300,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    fontSize: 16,
    color: '#666',
  },
  addressSearchContainer: {
    position: 'relative',
    zIndex: 10,
    marginBottom: 15,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    height: 40,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addressInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#333',
  },
  locationIconContainer: {
    marginRight: 8,
  },
  clearButton: {
    padding: 5,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  customMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fc565b',
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  activeFilterIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: '#fc565b',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 16,
  },
  propertyTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  propertyTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 10,
    marginBottom: 10,
  },
});

export default FilterModal; 