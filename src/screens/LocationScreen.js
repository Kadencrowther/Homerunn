import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Vibration,
  Alert
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import ProgressBar from '../components/ProgressBar';
import USAMap from '../components/USAMap';
import CitySelector from '../components/CitySelector';
import IntegrationRequestModal from '../components/IntegrationRequestModal';
import { availableStates, getCitiesForState, allStates } from '../data/statesData';
import { submitIntegrationRequest, isStateIntegrated } from '../services/IntegrationRequestService';

const { width, height } = Dimensions.get('window');

const CURRENT_STEP = 5;
const TOTAL_STEPS = 10;

const DEFAULT_RADIUS = 35;
const MIN_RADIUS = 1;
const MAX_RADIUS = 50;

const LocationScreen = ({ navigation, route }) => {
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [cityCoordinates, setCityCoordinates] = useState(null);
  const [radiusMiles, setRadiusMiles] = useState(DEFAULT_RADIUS);
  const [showCitySelection, setShowCitySelection] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  
  const credentials = route.params?.credentials || {};
  const preferences = route.params?.preferences || [];
  const timeframe = route.params?.timeframe || null;
  const hasAgent = route.params?.hasAgent || null;
  const agentName = route.params?.agentName || null;
  
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const sliderOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-1);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
      opacity: headerOpacity.value,
      transform: [{ translateY: (1 - headerOpacity.value) * -30 }]
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));
  
  const sliderAnimatedStyle = useAnimatedStyle(() => ({
      opacity: sliderOpacity.value,
    height: selectedCity ? 'auto' : 0,
    marginTop: selectedCity ? 20 : 0,
      overflow: 'hidden'
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
      opacity: buttonsOpacity.value,
      transform: [{ translateY: (1 - buttonsOpacity.value) * 20 }]
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value * (width + 100) }]
  }));

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    contentOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    
    // Start shimmer animation
    shimmerTranslate.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  useEffect(() => {
    if (selectedCity) {
      sliderOpacity.value = withTiming(1, { duration: 500 });
    } else {
      sliderOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [selectedCity]);

  // Geocode the city to get coordinates when city is selected
  useEffect(() => {
    if (selectedCity && selectedState) {
      geocodeCity(selectedCity, allStates[selectedState]?.name);
      }
  }, [selectedCity, selectedState]);

  const geocodeCity = async (cityName, stateName) => {
    try {
      const searchQuery = `${cityName}, ${stateName}`;
      const locations = await Location.geocodeAsync(searchQuery);
      
      if (locations.length > 0) {
        const { latitude, longitude } = locations[0];
        setCityCoordinates({ latitude, longitude });
        
        // Calculate zoom level for the radius
        const delta = calculateZoomForRadius(radiusMiles);
        
        setMapRegion({
          latitude,
          longitude,
          latitudeDelta: delta,
          longitudeDelta: delta * (width / height),
        });
      }
    } catch (error) {
      console.error('Error geocoding city:', error);
    }
  };

  // Calculate the appropriate zoom level (delta) based on radius in miles
  const calculateZoomForRadius = (radiusMiles) => {
    const milesPerDelta = 60;
    const delta = (radiusMiles * 2.6) / milesPerDelta;
    return Math.max(0.01, Math.min(delta, 30));
  };

  const handleStatePress = (stateAbbr) => {
    setSelectedState(stateAbbr);
    setSelectedCity(null);
    
    // Check if state is available (only Mississippi for now)
    const state = allStates[stateAbbr];
    if (state && state.available) {
      setShowCitySelection(true);
    } else {
      // For now, just show city selection - we'll add validation modal later
      setShowCitySelection(true);
    }
  };

  const handleCitySelectFromSearch = (cityName, stateAbbr) => {
    setSelectedState(stateAbbr);
    setSelectedCity(cityName);
    setShowCitySelection(true);
  };

  const handleCityPress = (city) => {
    if (city.name === null) {
      // User clicked "Change" - deselect the city
      setSelectedCity(null);
      setCityCoordinates(null);
      setMapRegion(null);
    } else {
      setSelectedCity(city.name);
    }
  };

  const handleBackToStates = () => {
    setShowCitySelection(false);
    setSelectedCity(null);
  };

  const handleRadiusChange = (value) => {
    const newValue = Math.round(value);
    if (newValue !== radiusMiles) {
      Vibration.vibrate(10);
    }
    setRadiusMiles(newValue);
    
    // Update map zoom when radius changes
    if (mapRegion) {
      const delta = calculateZoomForRadius(newValue);
      setMapRegion(prev => ({
        ...prev,
        latitudeDelta: delta,
        longitudeDelta: delta * (width / height),
      }));
    }
  };

  const handleContinue = () => {
    // Check if the state is integrated
    if (!isStateIntegrated(selectedState)) {
      // Show integration request modal
      setShowIntegrationModal(true);
      return;
    }
    
    // State is integrated, proceed normally
    const stateName = availableStates[selectedState]?.name || allStates[selectedState]?.name;
    const locationString = `${selectedCity}, ${stateName}`;
    
    const params = {
      credentials,
      preferences,
      timeframe,
      hasAgent,
      agentName,
      location: locationString,
      state: selectedState,
      city: selectedCity,
      radiusMiles,
      coordinates: cityCoordinates, // Pass the city coordinates
      mapRegion: mapRegion // Pass the full map region for the filter
    };
    
    navigation.navigate('ReviewScreen', params);
  };

  const handleIntegrationRequest = async () => {
    try {
      setIsSubmittingRequest(true);
      
      const stateName = allStates[selectedState]?.name;
      const userInfo = {
        credentials,
        preferences,
        timeframe,
        hasAgent,
        agentName
      };
      
      await submitIntegrationRequest(
        selectedCity,
        stateName,
        selectedState,
        userInfo
      );
      
      setIsSubmittingRequest(false);
      setShowIntegrationModal(false);
      
      // Show success message
      Alert.alert(
        'Request Submitted!',
        `We've received your request for ${selectedCity}, ${stateName}. We'll notify you when it becomes available!`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Go back to state selection
              handleBackToStates();
            }
          }
        ]
      );
    } catch (error) {
      setIsSubmittingRequest(false);
      console.error('Error submitting integration request:', error);
      Alert.alert(
        'Error',
        'Failed to submit integration request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSkip = () => {
    // Default to Jackson, MS if user skips location selection
    const defaultCoordinates = {
      latitude: 32.2988,
      longitude: -90.1848
    };
    
    const defaultDelta = calculateZoomForRadius(DEFAULT_RADIUS);
    const defaultMapRegion = {
      latitude: 32.2988,
      longitude: -90.1848,
      latitudeDelta: defaultDelta,
      longitudeDelta: defaultDelta * (width / height),
    };
    
    const params = {
      credentials,
      preferences,
      timeframe,
      hasAgent,
      agentName,
      location: 'Jackson, Mississippi',
      state: 'MS',
      city: 'Jackson',
      radiusMiles: DEFAULT_RADIUS,
      coordinates: defaultCoordinates,
      mapRegion: defaultMapRegion
    };
    
    navigation.navigate('ReviewScreen', params);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => showCitySelection ? handleBackToStates() : navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.progressContainer}>
            <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
          </View>
        </View>
        
        {!showCitySelection && (
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <Text style={styles.title}>Where are you looking for homes?</Text>
            <Text style={styles.subtitle}>First, select your state</Text>
        </Animated.View>
        )}
        
        <Animated.View style={[styles.content, contentAnimatedStyle]}>
          {!showCitySelection ? (
            <USAMap
              selectedState={selectedState}
              onStatePress={handleStatePress}
              onCitySelect={handleCitySelectFromSearch}
            />
          ) : (
            <CitySelector
              stateAbbr={selectedState}
              stateName={allStates[selectedState]?.name || availableStates[selectedState]?.name}
              selectedCity={selectedCity}
              onCityPress={handleCityPress}
              onBack={handleBackToStates}
            />
          )}
        </Animated.View>
        
        {/* Loading Skeleton for Map and Radius */}
        {selectedCity && !mapRegion && (
          <Animated.View style={[styles.radiusContainer, sliderAnimatedStyle]}>
            <View style={styles.skeletonLabelContainer}>
              <View style={styles.skeletonLabel}>
                <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.skeletonValue}>
                <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
            </View>
            
            <View style={styles.skeletonSlider}>
              <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
            
            <View style={styles.skeletonMap}>
              <Animated.View style={[styles.shimmerOverlay, shimmerAnimatedStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
            </View>
          </Animated.View>
        )}
        
        {/* Actual Map and Radius Controls */}
        {selectedCity && mapRegion && (
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
          
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={(region) => setMapRegion(region)}
              >
                {cityCoordinates && (
                  <>
                    <Marker coordinate={cityCoordinates}>
                      <View style={styles.customMarker}>
                        <View style={styles.markerInner} />
                      </View>
                    </Marker>
                    <Circle
                      center={cityCoordinates}
                      radius={radiusMiles * 1609.34}
                      strokeWidth={2}
                      strokeColor="rgba(252, 86, 91, 0.5)"
                      fillColor="rgba(252, 86, 91, 0.15)"
                    />
                  </>
                )}
              </MapView>
            </View>
        </Animated.View>
        )}

        <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedCity && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedCity}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Integration Request Modal */}
        <IntegrationRequestModal
          visible={showIntegrationModal}
          onClose={() => setShowIntegrationModal(false)}
          onRequest={handleIntegrationRequest}
          city={selectedCity}
          state={allStates[selectedState]?.name}
          isLoading={isSubmittingRequest}
        />
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  headerContainer: {
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: '700',
    marginBottom: height * 0.01,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  radiusContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
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
  mapContainer: {
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fc565b',
    borderWidth: 3,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  bottomContainer: {
    paddingBottom: height * 0.02,
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: 12,
    marginBottom: height * 0.02,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  // Skeleton Loading Styles
  skeletonLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skeletonLabel: {
    width: '40%',
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonValue: {
    width: '20%',
    height: 18,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonSlider: {
    width: '100%',
    height: 40,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonMap: {
    height: 200,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    marginTop: 15,
    overflow: 'hidden',
  },
  shimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: 100,
  },
});

export default LocationScreen; 
