import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Linking, Image, Animated } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getUserConnection, getAgentById } from '../services/agentUserConnectionService';

const { width, height } = Dimensions.get('window');

// Custom Marker Component
const CustomMarker = () => (
  <View style={styles.customMarker}>
    <View style={styles.markerInner} />
  </View>
);

const FlashScreen = () => {
  const navigation = useNavigation();
  const { isGuest } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const [hasAgent, setHasAgent] = useState(false);
  const [connectedAgent, setConnectedAgent] = useState(null);
  const [loadingAgent, setLoadingAgent] = useState(false);
  
  // Skeleton loading animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Start pulse animation when loading
  useEffect(() => {
    if (loadingAgent) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [loadingAgent]);

  // Fetch user data from Firestore
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log('No user is signed in');
        setLoading(false);
        return;
      }

      console.log('Fetching user data for FlashScreen for ID:', userId);
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        console.log('User data retrieved for FlashScreen:', data);
        
        // Get address from Profile if it exists
        if (data.Profile && data.Profile.Address) {
          setAddress(data.Profile.Address);
          geocodeAddress(data.Profile.Address);
        } else {
          // Clear previous address if it was removed
          setAddress('');
          setMapRegion(null);
        }
        
        // Check for connected agent using AgentUserConnectionService
        await checkConnectedAgent(userId);
      } else {
        console.log('No user document found for this user in FlashScreen');
      }
    } catch (error) {
      console.error('Error fetching user data in FlashScreen:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a connected agent
  const checkConnectedAgent = async (userId) => {
    try {
      setLoadingAgent(true);
      const connection = await getUserConnection(userId);
      
      if (connection && connection.Status === 'Accepted') {
        // User has an accepted connection
        setHasAgent(true);
        
        // Fetch agent details
        const agent = await getAgentById(connection.AgentId);
        if (agent) {
          setConnectedAgent({
            ...agent,
            connectionId: connection.id
          });
        }
      } else {
        setHasAgent(false);
        setConnectedAgent(null);
      }
    } catch (error) {
      console.error('Error checking connected agent:', error);
      setHasAgent(false);
      setConnectedAgent(null);
    } finally {
      setLoadingAgent(false);
    }
  };

  // Re-fetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('FlashScreen is now focused, fetching fresh data...');
      fetchUserData();
      
      return () => {
        // Clean up if needed
      };
    }, [])
  );

  // Initial data fetch on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Geocode the address to get coordinates
  const geocodeAddress = async (address) => {
    try {
      if (!address) return;
      
      console.log('Geocoding address:', address);
      const locations = await Location.geocodeAsync(address);
      
      if (locations && locations.length > 0) {
        console.log('Geocoded location:', locations[0]);
        setMapRegion({
          latitude: locations[0].latitude,
          longitude: locations[0].longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05
        });
      } else {
        console.log('Could not geocode the address');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  // Open maps app with the location
  const openMapsApp = () => {
    if (!mapRegion) return;
    
    const { latitude, longitude } = mapRegion;
    const label = address || 'Your Home';
    
    if (Platform.OS === 'ios') {
      // Apple Maps format
      Linking.openURL(`http://maps.apple.com/?q=${label}&ll=${latitude},${longitude}`);
    } else {
      // Google Maps format
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
    }
  };

  // Show guest UI for guests
  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <Ionicons name="flash-outline" size={80} color="#ccc" />
        <Text style={styles.guestTitle}>Sign In Required</Text>
        <Text style={styles.guestMessage}>
          Sign in to access tools, connect with agents, and get pre-qualified for loans
        </Text>
        <TouchableOpacity 
          style={styles.guestSignInButton}
          onPress={() => navigation.navigate('Setup', { screen: 'Welcome' })}
        >
          <Text style={styles.guestSignInButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Home Card - Updated */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Home</Text>
        {userData && userData.Profile && userData.Profile.Address && (
          <Text style={styles.homeDetails}>{userData.Profile.Address}</Text>
        )}
        
        {/* Only show bed/bath if they exist */}
        {userData && userData.Profile && (userData.Profile.Beds || userData.Profile.Baths) && (
          <Text style={styles.homeDetails}>
            {userData.Profile.Beds ? `${userData.Profile.Beds} Bed ` : ''}
            {userData.Profile.Baths ? `${userData.Profile.Baths} Bath ` : ''}
            {userData.Profile.SqFt ? `${userData.Profile.SqFt} Sq Feet` : ''}
          </Text>
        )}
        
        {/* Map View - Kept the same */}
        {mapRegion ? (
          <View style={styles.mapContainer}>
            {/* Static Map with Custom Marker Overlay */}
            <View style={styles.staticMapContainer}>
              <MapView
                style={styles.map}
                region={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                customMapStyle={[
                  {
                    featureType: "poi",
                    elementType: "labels",
                    stylers: [{ visibility: "off" }],
                  }
                ]}
              />
              {/* Custom Marker positioned in center */}
              <View style={styles.customMarkerOverlay}>
                <CustomMarker />
              </View>
            </View>
            <TouchableOpacity 
              style={StyleSheet.absoluteFillObject} 
              onPress={openMapsApp}
              activeOpacity={0.9}
            />
          </View>
        ) : (
          <View style={styles.loadingMapContainer}>
            <Text style={styles.loadingMapText}>Loading map...</Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('GetListingOffer')}
        >
          <Text style={styles.buttonText}>Get an offer on your home</Text>
        </TouchableOpacity>
      </View>

      {/* Agent Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Agent</Text>
        {loadingAgent ? (
          <>
            {/* Loading Skeleton */}
            <Animated.View 
              style={[
                styles.agentInfoContainer,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })
                }
              ]}
            >
              <View style={[styles.agentAvatar, styles.skeletonBackground]} />
              <View style={styles.agentDetails}>
                <View style={[styles.skeletonLine, styles.skeletonName]} />
                <View style={[styles.skeletonLine, styles.skeletonContact]} />
                <View style={[styles.skeletonLine, styles.skeletonContact, { width: '60%' }]} />
              </View>
            </Animated.View>
            <Animated.View 
              style={[
                styles.skeletonLine, 
                { 
                  width: '100%', 
                  height: 40, 
                  marginBottom: height * 0.02,
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })
                }
              ]} 
            />
            <Animated.View 
              style={[
                styles.button, 
                styles.skeletonBackground,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1]
                  })
                }
              ]} 
            />
          </>
        ) : connectedAgent ? (
          <>
            <View style={styles.agentInfoContainer}>
              <View style={styles.agentAvatar}>
                <Text style={styles.agentInitials}>
                  {connectedAgent.name.split(' ').map(n => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.agentDetails}>
                <Text style={styles.agentName}>{connectedAgent.name}</Text>
                {connectedAgent.email && (
                  <Text style={styles.agentContact}>{connectedAgent.email}</Text>
                )}
                {connectedAgent.phone && (
                  <Text style={styles.agentContact}>{connectedAgent.phone}</Text>
                )}
              </View>
            </View>
            <Text style={styles.cardText}>Your connected real estate agent is here to guide you through the home buying process!</Text>
          </>
        ) : (
          <Text style={styles.cardText}>Connect with a market friendly real estate agent to guide you through the process of finding your dream home!</Text>
        )}
        {!loadingAgent && (
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.navigate(hasAgent ? 'MyAgent' : 'FindAnAgent')}
          >
            <Text style={styles.buttonText}>
              {hasAgent ? 'View My Agent' : 'Find an Agent near you'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Loan Team Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Loan Team</Text>
        <Text style={styles.cardText}>Purchase your dream home today with only 3.5% down with a Homerunn trusted loan officer</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate('GetPrequalified')}
        >
          <Text style={styles.buttonText}>Get prequalified today</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f8f8f8',
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  guestMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  guestSignInButton: {
    backgroundColor: '#fc565b',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  guestSignInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContainer: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.08,
    paddingBottom: height * 0.1,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: width * 0.03,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: height * 0.7,
  },
  cardTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: height * 0.01,
    color: '#333',
  },
  homeValue: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#fc565b',
    marginBottom: height * 0.01,
  },
  homeDetails: {
    fontSize: width * 0.035,
    color: '#777',
    marginBottom: height * 0.005,
  },
  mapContainer: {
    width: '100%',
    height: height * 0.15,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMapContainer: {
    width: '100%',
    height: height * 0.15,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMapText: {
    color: '#777',
    fontSize: 16,
  },
  cardText: {
    fontSize: width * 0.035,
    color: '#555',
    marginBottom: height * 0.02,
  },
  button: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
  agentInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
    padding: width * 0.03,
    backgroundColor: '#fff',
    borderRadius: width * 0.02,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  agentAvatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  agentInitials: {
    color: '#fff',
    fontSize: width * 0.05,
    fontWeight: 'bold',
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: width * 0.04,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.003,
  },
  agentContact: {
    fontSize: width * 0.033,
    color: '#666',
    marginBottom: height * 0.002,
  },
  // Loading Skeleton Styles
  skeletonBackground: {
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
  },
  skeletonLine: {
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: height * 0.008,
  },
  skeletonName: {
    width: '70%',
    height: 16,
  },
  skeletonContact: {
    width: '85%',
    height: 12,
  },
  customMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 5,
  },
  markerInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fc565b',
  },
  staticMapContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customMarkerOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default FlashScreen;
