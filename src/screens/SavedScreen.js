import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions, Animated, Easing } from 'react-native';
import { FlatList, ScrollView } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FilterModal from '../../src/components/FilterModal';
import { useSavedProperties } from '../../src/context/SavedPropertiesContext';
import { formatPrice } from '../../src/utils/formatters';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { fetchMLSData } from '../api/fetchMLSData';
import { LinearGradient } from 'expo-linear-gradient';
import SavedFilterModal from '../components/SavedFilterModal';

// Helper function to create a mock property (add outside the component)
const createMockProperty = (mlsId, propertyId, isLoved) => {
  return {
    id: propertyId,
    price: 245000,
    beds: 3,
    baths: 2,
    sqft: 1800,
    address: `Property ${mlsId.substring(0, 8)}`,
    images: [require('../../assets/house1.jpeg')],
    yearBuilt: 'N/A',
    lotSize: 0,
    propertyType: 'Residential',
    propertySubType: 'Single Family Residence',
    daysOnMarket: 0,
    listingStatus: 'Active',
    description: 'Property details unavailable',
    mlsNumber: mlsId,
    listingOffice: 'MLS Listing',
    loved: isLoved
  };
};

const getStatusColor = (status) => {
  if (status === 'Active') return '#fc565b';  // Red
  if (status === 'Pending') return '#FFA500'; // Orange
  if (status === 'Sold') return '#4CAF50';    // Green
  if (status === 'Closed') return '#1652F0';  // Blue
  return '#888888'; // Default gray for other statuses
};

const SavedScreen = () => {
  const navigation = useNavigation();
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const { savedProperties, updateSavedProperty, addToSaved } = useSavedProperties();
  const [currentProperties, setCurrentProperties] = useState([]);
  const [allLoadedProperties, setAllLoadedProperties] = useState([]); // Store all properties for filtering
  const [filteredProperties, setFilteredProperties] = useState([]); // Store filtered properties separately
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    screen: 'saved',
    onlyLoved: false
  });
  const [imageIndices, setImageIndices] = useState({});
  const [isSwiping, setIsSwiping] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);
  const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const shimmerAnimValue = useRef(new Animated.Value(0)).current;

  // Add a function to sync saved properties context with Firebase data
  const syncSavedPropertiesWithFirebase = useCallback(async () => {
    if (!auth.currentUser) return;
    
    try {
      const userId = auth.currentUser.uid;
      const userMatchMetricRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
      const userMatchMetricDoc = await getDoc(userMatchMetricRef);
      
      if (userMatchMetricDoc.exists()) {
        const userData = userMatchMetricDoc.data();
        const lovedPropertyIds = userData.LovedProperties || [];
        
        // Update all saved properties with correct loved status
        savedProperties.forEach(property => {
          const shouldBeLoved = lovedPropertyIds.includes(property.id);
          if (property.loved !== shouldBeLoved) {
            updateSavedProperty(property.id, shouldBeLoved);
          }
        });
        
        console.log(`Synced ${savedProperties.length} saved properties with Firebase loved status`);
      }
    } catch (error) {
      console.error('Error syncing saved properties with Firebase:', error);
    }
  }, [savedProperties, updateSavedProperty]);

  // Modify the fetchSavedPropertiesFromFirebase function to ensure proper ordering
  const fetchSavedPropertiesFromFirebase = useCallback(async (forceRefresh = false) => {
    // Don't start a new fetch if one is already in progress
    if (isFetching) return;
    
    // Only show loading indicator on first load
    if (!hasLoadedFromFirebase) {
      setIsLoading(true);
    }
    
    setIsFetching(true);
    
    try {
      // First, get properties from the current session
      const sessionProperties = [...savedProperties];
      
      // If we've already loaded from Firebase and there are no new session properties,
      // and we're not forcing a refresh, we can skip the fetch
      if (hasLoadedFromFirebase && currentProperties.length > 0 && !forceRefresh) {
        // Just update with any new session properties that aren't already in currentProperties
        const currentIds = currentProperties.map(p => p.id);
        const newSessionProperties = sessionProperties.filter(p => !currentIds.includes(p.id));
        
        if (newSessionProperties.length > 0) {
          console.log(`Adding ${newSessionProperties.length} new session properties`);
          // Add new properties at the beginning (most recent first)
          const updatedProperties = [...newSessionProperties, ...currentProperties];
          setCurrentProperties(updatedProperties);
          setAllLoadedProperties(updatedProperties); // Store all properties for filtering
        }
        setIsLoading(false);
        setIsFetching(false);
        return;
      }
      
      // Then, fetch properties from Firebase if user is logged in
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        console.log('Fetching saved properties for user:', userId);
        
        // Get the user match metric document which contains liked and loved properties
        const userMatchMetricRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
        const userMatchMetricDoc = await getDoc(userMatchMetricRef);
        
        if (userMatchMetricDoc.exists()) {
          const userData = userMatchMetricDoc.data();
          console.log('Found user match metric data');
          
          // Get the liked and loved property IDs
          const likedPropertyIds = userData.LikedProperties || [];
          const lovedPropertyIds = userData.LovedProperties || [];
          
          console.log(`Found ${likedPropertyIds.length} liked and ${lovedPropertyIds.length} loved properties`);
          
          // Create a combined array of all interactions in chronological order
          // Firebase arrays have most recent items at the end
          const allInteractions = [];
          
          // Add liked properties with their timestamps (using index as proxy for timestamp)
          // For Firebase arrays, the last item (highest index) is the most recent
          // Don't reverse - use the arrays as they are since newest is at the bottom
          likedPropertyIds.forEach((id, index) => {
            allInteractions.push({
              id,
              timestamp: index,
              type: 'liked'
            });
          });
          
          // Add loved properties with their timestamps
          lovedPropertyIds.forEach((id, index) => {
            allInteractions.push({
              id,
              timestamp: index,
              type: 'loved'
            });
          });
          
          // Sort all interactions by timestamp (newest first)
          // Higher index = more recent
          allInteractions.sort((a, b) => b.timestamp - a.timestamp);
          
          // Extract unique property IDs in order (most recent first)
          const allPropertyIds = [];
          const seenIds = new Set();
          
          for (const interaction of allInteractions) {
            if (!seenIds.has(interaction.id)) {
              allPropertyIds.push(interaction.id);
              seenIds.add(interaction.id);
            }
          }
          
          console.log(`Combined ${allPropertyIds.length} unique properties in most-recent-first order`);
          
          // Update session properties with correct loved status from Firebase
          const updatedSessionProperties = sessionProperties.map(property => {
            const isLovedInFirebase = lovedPropertyIds.includes(property.id);
            return {
              ...property,
              loved: isLovedInFirebase
            };
          });
          
          console.log(`Updated ${updatedSessionProperties.length} session properties with Firebase loved status`);
          
          // Filter out properties that are already in the session
          const sessionPropertyIds = updatedSessionProperties.map(p => p.id);
          const newPropertyIds = allPropertyIds.filter(id => !sessionPropertyIds.includes(id));
          
          console.log(`Fetching ${newPropertyIds.length} new properties from MLS API`);
          
          // If there are new properties to fetch
          if (newPropertyIds.length > 0) {
            // Fetch property details for each ID
            const fetchedPropertiesMap = new Map(); // Use a map to store properties by ID
            
            // Process properties in batches of 5 (lazy loading)
            const batchSize = 5;
            
            for (let i = 0; i < newPropertyIds.length; i += batchSize) {
              const batch = newPropertyIds.slice(i, i + batchSize);
              const batchProperties = [];
              
              console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}: properties ${i+1}-${Math.min(i+batchSize, newPropertyIds.length)} of ${newPropertyIds.length}`);
              
              // Process each property in the current batch
              for (const propertyId of batch) {
                try {
                  // Extract the MLS ID from the property URL
                  const mlsId = propertyId.split("('")[1].split("')")[0];
                  console.log(`Fetching property with MLS ID: ${mlsId}`);
                  
                  // Try direct API call to the property URL
                  try {
                    console.log(`Attempting direct API call to: ${propertyId}`);
                    
                    // Add access token to the URL
                    const accessToken = "cea5222901777c6a09bad4224f0e54bb"; // This should be stored securely
                    const apiUrl = `${propertyId}?access_token=${accessToken}`;
                    
                    const response = await fetch(apiUrl, {
                      headers: {
                        'Accept': 'application/json'
                      }
                    });
                    
                    if (response.ok) {
                      const propertyData = await response.json();
                      console.log('Successfully fetched property directly');
                      
                      // Process images
                      let images = [];
                      if (propertyData.Media && Array.isArray(propertyData.Media)) {
                        images = propertyData.Media
                          .filter(m => m.MediaCategory === 'Photo' && m.MediaURL)
                          .map(m => ({ uri: m.MediaURL }));
                      }
                      
                      if (images.length === 0) {
                        images.push(require('../../assets/house1.jpeg'));
                      }
                      
                      // Create property object
                      const property = {
                        id: propertyId,
                        price: propertyData.ListPrice || 0,
                        beds: propertyData.BedroomsTotal || 0,
                        baths: propertyData.BathroomsTotalInteger || 0,
                        sqft: propertyData.LivingArea || 0,
                        address: `${propertyData.StreetNumber || ''} ${propertyData.StreetName || ''}, ${propertyData.City || ''}, ${propertyData.StateOrProvince || ''}`,
                        images: images,
                        yearBuilt: propertyData.YearBuilt ? propertyData.YearBuilt.toString() : 'N/A',
                        lotSize: propertyData.LotSizeSquareFeet || 0,
                        propertyType: propertyData.PropertyType || '',
                        propertySubType: propertyData.PropertySubType || '',
                        daysOnMarket: propertyData.DaysOnMarket || 0,
                        listingStatus: propertyData.StandardStatus || 'Active',
                        description: propertyData.PublicRemarks || '',
                        mlsNumber: propertyData.ListingId || propertyData.MLSNumber || '',
                        listingOffice: propertyData.ListingOffice || propertyData.ListOfficeName || 'MLS Listing',
                        loved: lovedPropertyIds.includes(propertyId)
                      };
                      
                      batchProperties.push(property);
                      fetchedPropertiesMap.set(propertyId, property);
                    } else {
                      console.error(`Failed to fetch property directly: ${response.status}`);
                      
                      // Fallback to using a mock property if direct fetch fails
                      const mockProperty = createMockProperty(mlsId, propertyId, lovedPropertyIds.includes(propertyId));
                      batchProperties.push(mockProperty);
                      fetchedPropertiesMap.set(propertyId, mockProperty);
                    }
                  } catch (directError) {
                    console.error(`Error with direct API call: ${directError}`);
                    
                    // Fallback to using a mock property
                    const mockProperty = createMockProperty(mlsId, propertyId, lovedPropertyIds.includes(propertyId));
                    batchProperties.push(mockProperty);
                    fetchedPropertiesMap.set(propertyId, mockProperty);
                  }
                } catch (error) {
                  console.error(`Error fetching property ${propertyId}:`, error);
                }
              }
              
              // Add a small delay between batches to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
              
              // Display the first batch of properties immediately to improve perceived performance
              if (i === 0 && !hasLoadedFromFirebase) {
                console.log('Displaying first batch of properties immediately');
                // Show session properties first (most recent), then the first batch of fetched properties
                // BUT only if no filter is active
                if (!filters.onlyLoved) {
                  const updatedProperties = [...updatedSessionProperties, ...batchProperties];
                  setCurrentProperties(updatedProperties);
                  setAllLoadedProperties(updatedProperties); // Store all properties for filtering
                } else {
                  // If filter is active, only show loved properties from the first batch
                  const lovedBatchProperties = batchProperties.filter(property => property.loved);
                  const lovedSessionProperties = updatedSessionProperties.filter(property => property.loved);
                  const filteredProperties = [...lovedSessionProperties, ...lovedBatchProperties];
                  setCurrentProperties(filteredProperties);
                  setFilteredProperties(filteredProperties);
                  setAllLoadedProperties([...updatedSessionProperties, ...batchProperties]); // Store all properties for filtering
                }
                setIsLoading(false);
              } else {
                // For subsequent batches, update the current properties to include the new batch
                // BUT only if no filter is active
                console.log(`Adding batch ${Math.floor(i/batchSize) + 1} to current properties`);
                
                // Only update currentProperties if no filter is active
                if (!filters.onlyLoved) {
                  setCurrentProperties(prev => [...prev, ...batchProperties]);
                } else {
                  // If filter is active, only add loved properties to filteredProperties
                  const lovedBatchProperties = batchProperties.filter(property => property.loved);
                  setFilteredProperties(prev => [...prev, ...lovedBatchProperties]);
                }
                setAllLoadedProperties(prev => [...prev, ...batchProperties]);
              }
            }
            
            // Reconstruct the fetched properties array in the correct order (newest first)
            const fetchedProperties = [];
            for (const propertyId of newPropertyIds) {
              const property = fetchedPropertiesMap.get(propertyId);
              if (property) {
                fetchedProperties.push(property);
              }
            }
            
            // Now set all properties at once with session properties first (most recent), then fetched properties (older)
            // This ensures most recent properties are at the top
            const finalProperties = [...updatedSessionProperties, ...fetchedProperties];
            
            // Set allLoadedProperties to all properties for filtering
            setAllLoadedProperties(finalProperties);
            
            // Set currentProperties based on filter state
            if (filters.onlyLoved) {
              const lovedProperties = finalProperties.filter(property => property.loved);
              setCurrentProperties(lovedProperties);
              setFilteredProperties(lovedProperties);
            } else {
              setCurrentProperties(finalProperties);
              setFilteredProperties([]);
            }
            
            console.log(`Total properties: ${updatedSessionProperties.length + fetchedProperties.length}`);
          } else {
            // If no new properties to fetch, just use session properties
            if (filters.onlyLoved) {
              const lovedSessionProperties = updatedSessionProperties.filter(property => property.loved);
              setCurrentProperties(lovedSessionProperties);
              setFilteredProperties(lovedSessionProperties);
            } else {
              setCurrentProperties(updatedSessionProperties);
              setFilteredProperties([]);
            }
            setAllLoadedProperties(updatedSessionProperties); // Store all properties for filtering
          }
          
          // Mark that we've loaded from Firebase
          setHasLoadedFromFirebase(true);
        } else {
          console.log('No user match metric found, using only session properties');
          if (filters.onlyLoved) {
            const lovedSessionProperties = updatedSessionProperties.filter(property => property.loved);
            setCurrentProperties(lovedSessionProperties);
            setFilteredProperties(lovedSessionProperties);
          } else {
            setCurrentProperties(updatedSessionProperties);
            setFilteredProperties([]);
          }
          setAllLoadedProperties(updatedSessionProperties); // Store all properties for filtering
        }
      } else {
        console.log('User not logged in, using only session properties');
        if (filters.onlyLoved) {
          const lovedSessionProperties = updatedSessionProperties.filter(property => property.loved);
          setCurrentProperties(lovedSessionProperties);
          setFilteredProperties(lovedSessionProperties);
        } else {
          setCurrentProperties(updatedSessionProperties);
          setFilteredProperties([]);
        }
        setAllLoadedProperties(updatedSessionProperties); // Store all properties for filtering
      }
    } catch (error) {
      console.error('Error fetching saved properties:', error);
      setCurrentProperties(savedProperties);
      setAllLoadedProperties(savedProperties); // Store all properties for filtering
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [savedProperties, currentProperties, hasLoadedFromFirebase, isFetching, filters]);

  // Use useFocusEffect to trigger the fetch when the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // First sync saved properties with Firebase
      syncSavedPropertiesWithFirebase();
      // Then fetch saved properties from Firebase
      fetchSavedPropertiesFromFirebase();
      
      // Return a cleanup function
      return () => {
        // Any cleanup code if needed
      };
    }, [fetchSavedPropertiesFromFirebase, syncSavedPropertiesWithFirebase])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Simplified default filters
      const defaultFilters = {
        screen: 'saved',
        onlyLoved: false
      };
      setFilters(defaultFilters);
    });

    return unsubscribe;
  }, [navigation, savedProperties]);

  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(shimmerAnimValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      shimmerAnimValue.setValue(0);
    }
  }, [isLoading]);
  
  useEffect(() => {
    const dimensionsHandler = Dimensions.addEventListener('change', () => {
      setScreenWidth(Dimensions.get('window').width);
    });
    
    return () => {
      dimensionsHandler.remove();
    };
  }, []);

  // Debug: Track when currentProperties changes
  useEffect(() => {
    console.log(`currentProperties changed: ${currentProperties.length} properties`);
    if (filters.onlyLoved) {
      const lovedCount = currentProperties.filter(p => p.loved).length;
      console.log(`Filter is active - ${lovedCount} of ${currentProperties.length} properties are loved`);
    }
  }, [currentProperties, filters.onlyLoved]);

  const applyFilters = (newFilters) => {
    console.log('Applying filters:', newFilters);
    setFilters(newFilters);
    
    // Simple client-side filtering based on the loved status
    if (newFilters.onlyLoved) {
      console.log('Applying client-side filter for loved properties');
      
      // Simple client-side filtering - only show properties with active hearts
      const lovedProperties = allLoadedProperties.filter(property => property.loved);
      
      // Debug: Log the loved status of all properties
      console.log('All loaded properties and their loved status:');
      allLoadedProperties.forEach(property => {
        console.log(`Property ${property.id}: loved = ${property.loved}`);
      });
      
      console.log(`Showing ${lovedProperties.length} loved properties from client-side filter`);
      console.log('Setting filteredProperties to loved properties ONLY');
      setFilteredProperties(lovedProperties);
      setCurrentProperties(lovedProperties);
    } else {
      // If we're removing the filter, simply show all properties without re-fetching
      console.log('Removing loved filter, showing all properties');
      console.log('Setting currentProperties to all loaded properties');
      setFilteredProperties([]);
      setCurrentProperties(allLoadedProperties);
    }
    
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    const defaultFilters = {
      screen: 'saved',
      onlyLoved: false
    };
    setFilters(defaultFilters);
    setCurrentProperties(savedProperties);
    setFilteredProperties([]);
    setIsFilterModalVisible(false);
  };

  const toggleLovedStatus = async (propertyId) => {
    // Find the property in current properties (which includes both session and Firebase properties)
    const property = currentProperties.find(p => p.id === propertyId) || 
                    allLoadedProperties.find(p => p.id === propertyId);
    
    if (!property) {
      console.error(`Property with ID ${propertyId} not found in current or all loaded properties`);
      return;
    }
    
    const newLovedStatus = !property.loved;
    
    // Update the UI immediately for better user experience
    setCurrentProperties(prev => 
      prev.map(p => p.id === propertyId ? { ...p, loved: newLovedStatus } : p)
    );
    
    // Also update allLoadedProperties to keep it in sync
    setAllLoadedProperties(prev => 
      prev.map(p => p.id === propertyId ? { ...p, loved: newLovedStatus } : p)
    );
    
    // Also update filtered properties if filter is active
    if (filters.onlyLoved) {
      setFilteredProperties(prev => 
        prev.map(p => p.id === propertyId ? { ...p, loved: newLovedStatus } : p)
      );
    }
    
    // Update in context if the property exists there
    const savedProperty = savedProperties.find(p => p.id === propertyId);
    if (savedProperty) {
      updateSavedProperty(propertyId, newLovedStatus);
    } else {
      // If property is not in context, add it
      addToSaved({ ...property, loved: newLovedStatus });
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
          
          if (newLovedStatus) {
            // If property is being loved, add to loved properties and remove from liked
            lovedProperties = [...lovedProperties, propertyId];
            likedProperties = likedProperties.filter(id => id !== propertyId);
          } else {
            // If property is being unloved, add to liked properties and remove from loved
            likedProperties = [...likedProperties, propertyId];
            lovedProperties = lovedProperties.filter(id => id !== propertyId);
          }
          
          // Update Firebase
          await updateDoc(userMatchMetricRef, {
            LikedProperties: likedProperties,
            LovedProperties: lovedProperties
          });
          
          console.log(`Property ${propertyId} ${newLovedStatus ? 'loved' : 'liked'} status updated in Firebase`);
        }
      } catch (error) {
        console.error('Error updating loved status in Firebase:', error);
      }
    }
    
    // If we're showing only loved properties and this property is being unloved
    if (filters.onlyLoved && !newLovedStatus) {
      // Remove this property from current view immediately
      setCurrentProperties(prev => prev.filter(p => p.id !== propertyId));
      setFilteredProperties(prev => prev.filter(p => p.id !== propertyId));
    }
  };

  const handleHorizontalSwipe = (propertyId, event) => {
    const isSwipe = Math.abs(event.nativeEvent.translationX) > 50;
    
    if (isSwipe) { // Threshold for swipe
      setIsSwiping(true);  // Mark that we're swiping
      const currentIndex = imageIndices[propertyId] || 0;
      const property = currentProperties.find(p => p.id === propertyId);
      
      if (event.nativeEvent.translationX < 0) {
        // Swipe left - next image
        setImageIndices({
          ...imageIndices,
          [propertyId]: currentIndex < property.images.length - 1 ? currentIndex + 1 : 0
        });
      } else {
        // Swipe right - previous image
        setImageIndices({
          ...imageIndices,
          [propertyId]: currentIndex > 0 ? currentIndex - 1 : property.images.length - 1
        });
      }
    }
    return isSwipe; // Return whether this was a swipe or not
  };

  const handleGestureStateChange = (item, { nativeEvent }) => {
    if (nativeEvent.state === State.BEGAN) {
      setIsSwiping(false);  // Reset swiping state when touch begins
    }
    else if (nativeEvent.state === State.END) {
      const wasSwipe = handleHorizontalSwipe(item.id, { nativeEvent });
      
      // Only navigate if it wasn't a swipe AND we haven't been swiping
      if (!wasSwipe && !isSwiping) {
        console.log('Navigating to PropertyImages from SavedScreen');
        navigation.navigate('PropertyImages', { 
          property: {
            ...item,
            id: item.id,
            ListingId: item.ListingId || item.listingId || item.mlsNumber,
            listingId: item.ListingId || item.listingId || item.mlsNumber,
            mlsNumber: item.mlsNumber || item.ListingId || item.listingId
          },
          sourceScreen: 'Saved' 
        });
      }
      
      // Reset swiping state
      setIsSwiping(false);
    }
  };

  const renderProperty = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        activeOpacity={1}
        onPress={() => {
          console.log('Property card pressed in SavedScreen');
          navigation.navigate('PropertyImages', { 
            property: {
              ...item,
              id: item.id,
              ListingId: item.ListingId || item.listingId || item.mlsNumber,
              listingId: item.ListingId || item.listingId || item.mlsNumber,
              mlsNumber: item.mlsNumber || item.ListingId || item.listingId
            },
            sourceScreen: 'Saved' 
          });
        }}
      >
        <PanGestureHandler
          onHandlerStateChange={(event) => handleGestureStateChange(item, event)}
          activeOffsetX={[-10, 10]} // Only activate gesture handler after 10px movement
        >
          <View style={styles.imageContainer}>
            <Image 
              source={item.images[imageIndices[item.id] || 0]}
              style={styles.image}
              resizeMode="cover"
            />
            
            {/* Add status badge */}
            {item.listingStatus && (
              <View style={[
                styles.statusBadge, 
                { backgroundColor: getStatusColor(item.listingStatus) }
              ]}>
                <Text style={styles.statusText}>{item.listingStatus}</Text>
              </View>
            )}
            
            {/* Image indicator dots */}
            <View style={styles.imageDots}>
              {item.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: (imageIndices[item.id] || 0) === index 
                        ? '#fff' 
                        : 'rgba(255,255,255,0.5)'
                    }
                  ]}
                />
              ))}
            </View>
          </View>
        </PanGestureHandler>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.starIconContainer}
        onPress={() => toggleLovedStatus(item.id)}
      >
        <Ionicons 
          name={item.loved ? "heart" : "heart-outline"} 
          size={28}
          color="#fff"
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.cardDetails}
        onPress={() => {
          console.log('Property details pressed in SavedScreen');
          navigation.navigate('PropertyImages', { 
            property: {
              ...item,
              id: item.id,
              ListingId: item.ListingId || item.listingId || item.mlsNumber,
              listingId: item.ListingId || item.listingId || item.mlsNumber,
              mlsNumber: item.mlsNumber || item.ListingId || item.listingId
            },
            sourceScreen: 'Saved' 
          });
        }}
      >
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="bed-outline" size={16} color="#333" />
            <Text style={styles.detailText}>{item.beds} bed</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="shower" size={16} color="#333" />
            <Text style={styles.detailText}>{item.baths} bath</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="ruler-square" size={16} color="#333" />
            <Text style={styles.detailText}>{item.sqft.toLocaleString()} sq ft</Text>
          </View>
        </View>
        
        <Text style={styles.address}>{item.address}</Text>
        
        <View style={styles.bottomRowContainer}>
          <Text style={styles.yearBuilt}>Built {item.yearBuilt}</Text>
          <Text style={styles.brokerageInfo}>{item.listingOffice || 'MLS Listing'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSkeletonCards = () => {
    const cardWidth = screenWidth - 32; // Account for padding
    const translateX = shimmerAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-cardWidth, cardWidth]
    });
    
    // Create an array of 3 skeleton cards
    return Array(3).fill().map((_, index) => (
      <View key={`skeleton-${index}`} style={styles.card}>
        <View style={styles.skeletonImageContainer}>
          <View style={styles.skeletonImage} />
          <Animated.View 
            style={[
              styles.shimmerOverlay,
              {
                transform: [{ translateX }]
              }
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.shimmerGradient}
            />
          </Animated.View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.skeletonPrice}>
            <Animated.View 
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }]
                }
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
          
          <View style={styles.detailsContainer}>
            {[1, 2, 3].map((_, i) => (
              <View key={i} style={styles.skeletonDetailItem}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    {
                      transform: [{ translateX }]
                    }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
            ))}
          </View>
          
          <View style={styles.skeletonAddress}>
            <Animated.View 
              style={[
                styles.shimmerOverlay,
                {
                  transform: [{ translateX }]
                }
              ]}
            >
              <LinearGradient
                colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.shimmerGradient}
              />
            </Animated.View>
          </View>
          
          <View style={styles.bottomRowContainer}>
            <View style={styles.skeletonYearBuilt}>
              <Animated.View 
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.skeletonBrokerage}>
              <Animated.View 
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{ translateX }]
                  }
                ]}
              >
                <LinearGradient
                  colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
          </View>
        </View>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Homerunnhousecolorlogo.png')} 
            style={styles.logo}
          />
          <Text style={styles.logoText}>HOMERUNN</Text>
        </View>
        <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}>
          <Ionicons name="filter" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.propertyList}
          showsVerticalScrollIndicator={false}
        >
          {renderSkeletonCards()}
        </ScrollView>
      ) : currentProperties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no saved homes</Text>
        </View>
      ) : (
        <FlatList
          data={filters.onlyLoved ? filteredProperties : currentProperties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProperty}
          contentContainerStyle={styles.propertyList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <SavedFilterModal 
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(newFilters) => {
          // Only use the onlyLoved filter
          applyFilters({ 
            screen: 'saved',
            onlyLoved: newFilters.onlyLoved 
          });
        }}
        onClear={() => {
          const defaultFilters = {
            screen: 'saved',
            onlyLoved: false
          };
          setFilters(defaultFilters);
          applyFilters(defaultFilters);
        }}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fc565b',
  },
  propertyList: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardDetails: {
    padding: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 4,
  },
  address: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  starIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  imageDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  bottomRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  yearBuilt: {
    fontSize: 12,
    color: '#999',
  },
  brokerageInfo: {
    fontSize: 12,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  skeletonImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E9EE',
  },
  skeletonPrice: {
    height: 24,
    width: '40%',
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  skeletonDetailItem: {
    height: 16,
    width: 80,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  skeletonAddress: {
    height: 14,
    width: '80%',
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  skeletonYearBuilt: {
    height: 12,
    width: '30%',
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonBrokerage: {
    height: 12,
    width: '40%',
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: '200%',
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
});

export default SavedScreen;
