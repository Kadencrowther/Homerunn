import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform, Linking, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// Custom Marker Component
const CustomMarker = () => (
  <View style={styles.customMarker}>
    <View style={styles.markerInner} />
  </View>
);

const FlashScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const [hasAgent, setHasAgent] = useState(false);

  // Fetch user data from Firestore
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid ?? 'guest';
      console.log('Fetching user data for FlashScreen for ID:', userId);
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        console.log('User data retrieved for FlashScreen:', data);
        
        // Check if user has an agent
        if (data.HasAgent === "Yes") {
          setHasAgent(true);
        } else {
          setHasAgent(false);
        }
        
        // Get address from Profile if it exists
        if (data.Profile && data.Profile.Address) {
          setAddress(data.Profile.Address);
          geocodeAddress(data.Profile.Address);
        } else {
          // Clear previous address if it was removed
          setAddress('');
          setMapRegion(null);
        }
      } else {
        console.log('No user document found for this user in FlashScreen');
      }
    } catch (error) {
      console.error('Error fetching user data in FlashScreen:', error);
    } finally {
      setLoading(false);
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
        <Text style={styles.cardText}>Connect with a market friendly real estate agent to guide you through the process of finding your dream home!</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => navigation.navigate(hasAgent ? 'MyAgent' : 'FindAnAgent')}
        >
          <Text style={styles.buttonText}>
            {hasAgent ? 'My Agent' : 'Find an Agent near you'}
          </Text>
        </TouchableOpacity>
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
