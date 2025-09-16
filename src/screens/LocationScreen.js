import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  FlatList,
  Vibration
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';
import * as Location from 'expo-location';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 5;
const TOTAL_STEPS = 10;

// Default radius in miles
const DEFAULT_RADIUS = 5;
const MIN_RADIUS = 1;
const MAX_RADIUS = 50;

// Sample list of popular US cities for quick selection
const popularCities = [
  { id: '1', name: 'New York, NY' },
  { id: '2', name: 'Los Angeles, CA' },
  { id: '3', name: 'Chicago, IL' },
  { id: '4', name: 'Houston, TX' },
  { id: '5', name: 'Phoenix, AZ' },
  { id: '6', name: 'Philadelphia, PA' },
  { id: '7', name: 'San Antonio, TX' },
  { id: '8', name: 'San Diego, CA' },
  { id: '9', name: 'Dallas, TX' },
  { id: '10', name: 'San Francisco, CA' },
  { id: '11', name: 'Austin, TX' },
  { id: '12', name: 'Seattle, WA' },
  { id: '13', name: 'Denver, CO' },
  { id: '14', name: 'Boston, MA' },
  { id: '15', name: 'Miami, FL' }
];

// Map graphic component to visually represent the radius
const MapGraphic = ({ radius }) => {
  // Calculate the size of the circle based on the radius value
  // Using a percentage between min and max radius to determine size
  const percentage = (radius - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS);
  const minSize = width * 0.1; // Smallest the circle can be
  const maxSize = width * 0.7; // Largest the circle can be
  const circleSize = minSize + percentage * (maxSize - minSize);
  
  return (
    <View style={styles.mapGraphicContainer}>
      {/* Map-like background */}
      <View style={styles.mapBackground}>
        {/* Roads */}
        <View style={[styles.road, { top: '30%', left: 0, width: '100%' }]} />
        <View style={[styles.road, { top: 0, left: '40%', height: '100%', width: 5 }]} />
        <View style={[styles.road, { top: '60%', left: 0, width: '100%' }]} />
        <View style={[styles.road, { top: 0, left: '70%', height: '100%', width: 5 }]} />
        
        {/* City blocks */}
        <View style={[styles.cityBlock, { top: '10%', left: '10%' }]} />
        <View style={[styles.cityBlock, { top: '10%', left: '50%' }]} />
        <View style={[styles.cityBlock, { top: '40%', left: '20%' }]} />
        <View style={[styles.cityBlock, { top: '40%', left: '60%' }]} />
        <View style={[styles.cityBlock, { top: '70%', left: '30%' }]} />
        <View style={[styles.cityBlock, { top: '70%', left: '80%' }]} />
        
        {/* Central location marker */}
        <View style={styles.centerMarkerContainer}>
          <View style={styles.centerMarker} />
          <View style={styles.centerPin} />
        </View>
        
        {/* Circle representing the radius */}
        <Animated.View 
          style={[
            styles.radiusCircle, 
            { 
              width: circleSize, 
              height: circleSize,
              borderRadius: circleSize / 2,
              transform: [{ translateX: -circleSize / 2 }, { translateY: -circleSize / 2 }]
            }
          ]}
        />
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <Ionicons name="location" size={16} color="#fc565b" />
        <Text style={styles.legendText}>Selected location</Text>
        <View style={styles.legendDot} />
        <Text style={styles.legendText}>{radius} mile radius</Text>
      </View>
    </View>
  );
};

const LocationScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredCities, setFilteredCities] = useState(popularCities);
  
  const credentials = route.params?.credentials || {};
  const preferences = route.params?.preferences || [];
  const timeframe = route.params?.timeframe || null;
  const hasAgent = route.params?.hasAgent || null;
  const agentName = route.params?.agentName || null;
  
  // Add logging to debug received parameters
  console.log('LocationScreen received params:', {
    hasCredentials: !!credentials,
    credentialsType: typeof credentials,
    email: credentials?.email,
    hasPassword: !!credentials?.password,
    preferencesCount: preferences.length,
    timeframe: timeframe,
    hasAgent: hasAgent,
    agentName: agentName
  });
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const searchOpacity = useSharedValue(0);
  const citiesOpacity = useSharedValue(0);
  const sliderOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: (1 - headerOpacity.value) * -30 }]
    };
  });

  const searchAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: searchOpacity.value,
      transform: [{ translateY: (1 - searchOpacity.value) * -20 }]
    };
  });

  const citiesAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: citiesOpacity.value,
      display: selectedLocation ? 'none' : 'flex'
    };
  });
  
  const sliderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: sliderOpacity.value,
      height: selectedLocation ? 'auto' : 0,
      marginTop: selectedLocation ? 20 : 0,
      overflow: 'hidden'
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
      transform: [{ translateY: (1 - buttonsOpacity.value) * 20 }]
    };
  });

  // Animate elements on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    searchOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    citiesOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(700, withTiming(1, { duration: 800 }));
  }, []);

  // Update slider animation when location is selected
  useEffect(() => {
    if (selectedLocation) {
      sliderOpacity.value = withTiming(1, { duration: 500 });
    } else {
      sliderOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [selectedLocation]);

  // Filter popular cities based on search query
  useEffect(() => {
    if (searchQuery) {
      const filtered = popularCities.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
      
      // If query is specific enough, attempt to search for additional locations
      if (searchQuery.length > 2) {
        searchLocations(searchQuery);
      } else {
        setSearchResults([]);
      }
    } else {
      setFilteredCities(popularCities);
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchLocations = async (query) => {
    setIsSearching(true);
    try {
      const locations = await Location.geocodeAsync(query);
      
      if (locations.length > 0) {
        // Get location names for each result
        const resultsWithNames = await Promise.all(
          locations.slice(0, 3).map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            
            let name = query;
            if (address.length > 0) {
              name = address[0].city 
                ? `${address[0].city}, ${address[0].region}`
                : address[0].region || query;
            }
            
            return {
              ...loc,
              name,
              id: `${loc.latitude}-${loc.longitude}`
            };
          })
        );
        
        setSearchResults(resultsWithNames);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      // Don't show the error to the user - just continue
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation({
      name: location.name,
      coordinates: location.latitude && location.longitude ? 
        { latitude: location.latitude, longitude: location.longitude } : null
    });
    
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCityPress = (city) => {
    setSelectedLocation({
      name: city.name,
      coordinates: null // We don't have coordinates for the sample cities
    });
  };

  const handleRadiusChange = (value) => {
    const newValue = Math.round(value);
    // Vibrate when the rounded value changes
    if (newValue !== radiusMiles) {
      Vibration.vibrate(10); // Short, subtle vibration
    }
    setRadiusMiles(newValue);
  };

  const handleContinue = () => {
    const params = {
      credentials: credentials,
      preferences: preferences,
      timeframe: timeframe,
      hasAgent: hasAgent,
      agentName: agentName,
      location: selectedLocation.name,
      coordinates: selectedLocation.coordinates,
      radiusMiles: radiusMiles
    };
    
    console.log('LocationScreen navigating to ReviewScreen with params:', {
      hasCredentials: !!params.credentials,
      credentialsType: typeof params.credentials,
      email: params.credentials?.email,
      hasPassword: !!params.credentials?.password,
      location: params.location
    });
    
    navigation.navigate('ReviewScreen', params);
  };

  const handleCancel = () => {
    const params = {
      credentials: credentials,
      preferences: preferences,
      timeframe: timeframe,
      hasAgent: hasAgent,
      agentName: agentName,
      location: null,
      coordinates: null
    };
    
    console.log('LocationScreen cancelling, navigating to ProfileCompletion with params:', {
      hasCredentials: !!params.credentials,
      email: params.credentials?.email
    });
    
    navigation.navigate('ProfileCompletion', params);
  };

  const skipButton = () => {
    const params = {
      credentials: credentials,
      preferences: preferences,
      timeframe: timeframe,
      hasAgent: hasAgent,
      agentName: agentName,
      location: null,
      coordinates: null
    };
    
    console.log('LocationScreen skipping, navigating to ReviewScreen with params:', {
      hasCredentials: !!params.credentials,
      email: params.credentials?.email
    });
    
    navigation.navigate('ReviewScreen', params);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const renderCityItem = ({ item }) => {
    const isSelected = selectedLocation && selectedLocation.name === item.name;
    return (
      <TouchableOpacity
        style={[styles.cityItem, isSelected && styles.selectedCityItem]}
        onPress={() => handleCityPress(item)}
      >
        <Ionicons 
          name="location" 
          size={18} 
          color={isSelected ? "#fff" : "#666"} 
          style={styles.cityItemIcon}
        />
        <Text style={[styles.cityItemText, isSelected && styles.selectedCityItemText]}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkmark} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header row with back button and progress bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
          </View>
        </View>
        
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.title}>Where are you looking for homes?</Text>
          <Text style={styles.subtitle}>Select a location and set your search radius</Text>
        </Animated.View>
        
        <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search cities or ZIP codes"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          
          {searchResults.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map((location) => (
                <TouchableOpacity
                  key={location.id}
                  style={styles.searchResultItem}
                  onPress={() => handleLocationSelect(location)}
                >
                  <Ionicons name="location-outline" size={18} color="#666" />
                  <Text style={styles.searchResultText}>{location.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {isSearching && (
            <View style={styles.searchingIndicator}>
              <ActivityIndicator color="#fc565b" size="small" />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Selected Location Display */}
        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedLocationBadge}>
              <Ionicons name="location" size={24} color="#fc565b" />
              <Text style={styles.selectedLocationText}>{selectedLocation.name}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.changeLocationButton}
              onPress={() => setSelectedLocation(null)}
            >
              <Text style={styles.changeLocationText}>Change</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Popular Cities List */}
        <Animated.View style={[styles.citiesContainer, citiesAnimatedStyle]}>
          <Text style={styles.citiesTitle}>Popular Cities</Text>
          <FlatList
            data={filteredCities}
            renderItem={renderCityItem}
            keyExtractor={item => item.id}
            numColumns={2}
            style={styles.citiesList}
            contentContainerStyle={styles.citiesListContent}
          />
        </Animated.View>
        
        {/* Radius Slider */}
        <Animated.View style={[styles.radiusContainer, sliderAnimatedStyle]}>
          <View style={styles.radiusLabelContainer}>
            <Text style={styles.radiusLabel}>Search Radius</Text>
            <Text style={styles.radiusValue}>{radiusMiles} miles</Text>
          </View>
          <Slider
            style={styles.radiusSlider}
            minimumValue={MIN_RADIUS}
            maximumValue={MAX_RADIUS}
            value={radiusMiles}
            onValueChange={handleRadiusChange}
            step={1}
            minimumTrackTintColor="#fc565b"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#fc565b"
          />
          
          {/* Map Graphic visualization */}
          <MapGraphic radius={radiusMiles} />
        </Animated.View>

        <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedLocation && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedLocation}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={skipButton}
          >
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.06,
    marginBottom: height * 0.02,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  headerContainer: {
    marginTop: height * 0.03,
    marginBottom: height * 0.04,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.075,
    fontWeight: '700',
    marginBottom: height * 0.01,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: height * 0.02,
    zIndex: 2,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: width * 0.03,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: width * 0.04,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  searchResultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchResultText: {
    marginLeft: 10,
    fontSize: width * 0.04,
    color: '#333',
  },
  searchingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    marginTop: 5,
  },
  searchingText: {
    marginLeft: 10,
    fontSize: width * 0.035,
    color: '#666',
  },
  selectedLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: width * 0.03,
    padding: 12,
  },
  selectedLocationBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLocationText: {
    marginLeft: 10,
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#333',
  },
  changeLocationButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
  },
  changeLocationText: {
    fontSize: width * 0.035,
    color: '#666',
  },
  citiesContainer: {
    flex: 1,
  },
  citiesTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  citiesList: {
    flex: 1,
  },
  citiesListContent: {
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: width * 0.02,
    padding: 12,
    marginBottom: 10,
    marginRight: 10,
    width: '48%',
  },
  selectedCityItem: {
    backgroundColor: '#fc565b',
  },
  cityItemIcon: {
    marginRight: 8,
  },
  cityItemText: {
    fontSize: width * 0.035,
    color: '#333',
    flex: 1,
  },
  selectedCityItemText: {
    color: '#fff',
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 5,
  },
  radiusContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: width * 0.03,
    padding: 15,
    marginBottom: 15,
  },
  radiusLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  radiusLabel: {
    fontSize: width * 0.04,
    fontWeight: '500',
    color: '#333',
  },
  radiusValue: {
    fontSize: width * 0.04,
    color: '#fc565b',
    fontWeight: '600',
  },
  radiusSlider: {
    width: '100%',
    height: 40,
  },
  bottomContainer: {
    marginTop: 'auto',
    paddingBottom: height * 0.02,
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(252, 86, 91, 0.5)',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: height * 0.01,
  },
  skipButtonText: {
    color: '#fc565b',
    textAlign: 'center',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
  // Map graphic styles
  mapGraphicContainer: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  mapBackground: {
    position: 'relative',
    width: width * 0.8,
    height: width * 0.5,
    backgroundColor: '#eff3f6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    backgroundColor: '#d9dde0',
    height: 8,
  },
  cityBlock: {
    position: 'absolute',
    width: width * 0.07,
    height: width * 0.07,
    backgroundColor: '#dce4e8',
    borderRadius: 3,
  },
  centerMarkerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    borderWidth: 2,
    borderColor: 'white',
  },
  centerPin: {
    position: 'absolute',
    width: 2,
    height: 6,
    backgroundColor: '#fc565b',
    bottom: -4,
    transform: [{ rotate: '45deg' }],
  },
  radiusCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: 'rgba(252, 86, 91, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(252, 86, 91, 0.3)',
    zIndex: 1,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  legendText: {
    fontSize: width * 0.032,
    color: '#666',
    marginRight: 10,
    marginLeft: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(252, 86, 91, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(252, 86, 91, 0.6)',
  },
});

export default LocationScreen; 