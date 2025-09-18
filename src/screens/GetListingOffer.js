import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, Platform, Modal, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

// Custom Marker Component
const CustomMarker = () => (
  <View style={styles.customMarker}>
    <View style={styles.markerInner} />
  </View>
);

const GetListingOffer = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [mapRegion, setMapRegion] = useState(null);
  const [zipCode, setZipCode] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agentToConnect, setAgentToConnect] = useState(null);
  const [searchingRadius, setSearchingRadius] = useState(false);

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

      console.log('Fetching user data for GetCashOffer for ID:', userId);
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        console.log('User data retrieved for GetCashOffer:', data);
        
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
        console.log('No user document found for this user in GetCashOffer');
      }
    } catch (error) {
      console.error('Error fetching user data in GetCashOffer:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Geocode the address to get coordinates and extract zip code
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
        
        // Get the zip code from the address
        const geocodedAddress = await Location.reverseGeocodeAsync({
          latitude: locations[0].latitude,
          longitude: locations[0].longitude
        });
        
        if (geocodedAddress && geocodedAddress.length > 0) {
          console.log('Reverse geocoded address:', geocodedAddress[0]);
          setZipCode(geocodedAddress[0].postalCode);
        }
      } else {
        console.log('Could not geocode the address');
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    }
  };

  // Fetch some default agents if none are found for the zip code
  const fetchDefaultAgents = async () => {
    try {
      console.log('Fetching default agents');
      
      // Query for any agents, limited to 5
      const agentsQuery = query(
        collection(db, 'AgentUsers')  // Changed from Users to AgentUsers
      );
      
      const agentSnapshot = await getDocs(agentsQuery);
      
      if (!agentSnapshot.empty) {
        const agentsData = agentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).slice(0, 5); // Limit to 5 agents
        
        console.log('Found default agents:', agentsData);
        setAvailableAgents(agentsData);
      } else {
        console.log('No agents found at all');
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error fetching default agents:', error);
    }
  };

  // Get nearby zip codes within 30 miles radius
  const getNearbyZipCodes = async (centerLat, centerLng) => {
    try {
      console.log('Getting nearby zip codes for:', centerLat, centerLng);
      
      // This is a simplified approach - in a real app you'd use a zip code database
      // For now, we'll create a rough approximation of nearby coordinates
      const radiusInDegrees = 0.5; // Approximately 30 miles
      
      const nearbyCoordinates = [
        { lat: centerLat + radiusInDegrees, lng: centerLng },
        { lat: centerLat - radiusInDegrees, lng: centerLng },
        { lat: centerLat, lng: centerLng + radiusInDegrees },
        { lat: centerLat, lng: centerLng - radiusInDegrees },
        { lat: centerLat + radiusInDegrees * 0.7, lng: centerLng + radiusInDegrees * 0.7 },
        { lat: centerLat - radiusInDegrees * 0.7, lng: centerLng + radiusInDegrees * 0.7 },
        { lat: centerLat + radiusInDegrees * 0.7, lng: centerLng - radiusInDegrees * 0.7 },
        { lat: centerLat - radiusInDegrees * 0.7, lng: centerLng - radiusInDegrees * 0.7 },
      ];
      
      const nearbyZipCodes = [];
      
      for (const coord of nearbyCoordinates) {
        try {
          const geocodedAddress = await Location.reverseGeocodeAsync({
            latitude: coord.lat,
            longitude: coord.lng
          });
          
          if (geocodedAddress && geocodedAddress.length > 0 && geocodedAddress[0].postalCode) {
            nearbyZipCodes.push(geocodedAddress[0].postalCode);
          }
        } catch (error) {
          console.log('Error getting zip code for coordinates:', coord, error);
        }
      }
      
      console.log('Found nearby zip codes:', nearbyZipCodes);
      return nearbyZipCodes;
    } catch (error) {
      console.error('Error getting nearby zip codes:', error);
      return [];
    }
  };

  // Find agents within radius when no exact match
  const findAgentsInRadius = async (nearbyZipCodes) => {
    try {
      console.log('Finding agents in radius for zip codes:', nearbyZipCodes);
      
      // Query for all agents
      const agentsQuery = query(
        collection(db, 'AgentUsers')
      );
      
      const agentSnapshot = await getDocs(agentsQuery);
      
      if (!agentSnapshot.empty) {
        // Process all agents
        const allAgents = agentSnapshot.docs.map(doc => {
          const data = doc.data();
          // Check if this agent has any of the nearby zipcodes in their ZipCodes array
          const hasNearbyZipCode = Array.isArray(data.ZipCodes) && 
            data.ZipCodes.some(zip => nearbyZipCodes.includes(zip));
          
          return {
            id: doc.id,
            ...data,
            isCertified: false, // Mark as non-certified since they're not in exact zip
            isNearby: hasNearbyZipCode
          };
        });
        
        // Find agents in the radius
        const nearbyAgents = allAgents.filter(agent => agent.isNearby);
        
        if (nearbyAgents.length > 0) {
          console.log('Found nearby agents:', nearbyAgents);
          setAvailableAgents(nearbyAgents);
        } else {
          console.log('No nearby agents found, showing Kaden Crowther as fallback');
          // Show Kaden Crowther as fallback
          setAvailableAgents([{
            id: 'kaden-crowther',
            FirstName: 'Kaden',
            LastName: 'Crowther',
            Phone: '801-616-6985',
            Company: 'Homerunn',
            isCertified: false,
            isNearby: false,
            isFallback: true
          }]);
        }
      } else {
        console.log('No agents found, showing Kaden Crowther as fallback');
        // Show Kaden Crowther as fallback
        setAvailableAgents([{
          id: 'kaden-crowther',
          FirstName: 'Kaden',
          LastName: 'Crowther',
          Phone: '801-616-6985',
          Company: 'Homerunn',
          isCertified: false,
          isNearby: false,
          isFallback: true
        }]);
      }
    } catch (error) {
      console.error('Error finding agents in radius:', error);
      // Show Kaden Crowther as fallback on error
      setAvailableAgents([{
        id: 'kaden-crowther',
        FirstName: 'Kaden',
        LastName: 'Crowther',
        Phone: '801-616-6985',
        Company: 'Homerunn',
        isCertified: false,
        isNearby: false,
        isFallback: true
      }]);
    } finally {
      setLoadingAgents(false);
    }
  };

  // Modify the findAgentsForZipCode function to include radius fallback
  const findAgentsForZipCode = async () => {
    if (!zipCode) return;
    
    try {
      setLoadingAgents(true);
      console.log('Finding agents for zip code:', zipCode);
      
      // Query for all agents
      const agentsQuery = query(
        collection(db, 'AgentUsers')
      );
      
      const agentSnapshot = await getDocs(agentsQuery);
      
      if (!agentSnapshot.empty) {
        // Process all agents
        const allAgents = agentSnapshot.docs.map(doc => {
          const data = doc.data();
          // Check if this agent has the zipcode in their ZipCodes array
          const hasZipCode = Array.isArray(data.ZipCodes) && data.ZipCodes.includes(zipCode);
          
          return {
            id: doc.id,
            ...data,
            isCertified: hasZipCode
          };
        });
        
        // Find certified agents
        const certifiedAgents = allAgents.filter(agent => agent.isCertified);
        
        if (certifiedAgents.length > 0) {
          console.log('Found certified agents for this zipcode:', certifiedAgents);
          // ONLY show certified agents
          setAvailableAgents(certifiedAgents);
        } else {
          // No certified agents found, try radius search
          console.log('No certified agents found, searching in 30-mile radius...');
          setSearchingRadius(true);
          
          // Get the coordinates for the current zip code
          if (mapRegion) {
            const nearbyZipCodes = await getNearbyZipCodes(mapRegion.latitude, mapRegion.longitude);
            if (nearbyZipCodes.length > 0) {
              await findAgentsInRadius(nearbyZipCodes);
            } else {
              console.log('No nearby zip codes found, showing no agents');
              setAvailableAgents([]);
            }
          } else {
            console.log('No map region available for radius search');
            setAvailableAgents([]);
          }
          setSearchingRadius(false);
        }
      } else {
        console.log('No agents found, showing Kaden Crowther as fallback');
        // Show Kaden Crowther as fallback
        setAvailableAgents([{
          id: 'kaden-crowther',
          FirstName: 'Kaden',
          LastName: 'Crowther',
          Phone: '801-616-6985',
          Company: 'Homerunn',
          isCertified: false,
          isNearby: false,
          isFallback: true
        }]);
      }
    } catch (error) {
      console.error('Error finding agents:', error);
      // Show Kaden Crowther as fallback on error
      setAvailableAgents([{
        id: 'kaden-crowther',
        FirstName: 'Kaden',
        LastName: 'Crowther',
        Phone: '801-616-6985',
        Company: 'Homerunn',
        isCertified: false,
        isNearby: false,
        isFallback: true
      }]);
    } finally {
      setLoadingAgents(false);
    }
  };

  // When zip code is set, find agents
  useEffect(() => {
    if (zipCode) {
      findAgentsForZipCode();
    }
  }, [zipCode]);

  // Send cash offer request to the selected agent
  const sendListingOfferRequest = async () => {
    // Log the current state to help debug
    console.log('Sending request with agent:', selectedAgent?.id || agentToConnect?.id);
    
    // Use either selectedAgent or agentToConnect, whichever is available
    const agentForRequest = selectedAgent || agentToConnect;
    
    if (!agentForRequest) {
      console.error('No agent available for request');
      Alert.alert('Error', 'Please select an agent to connect with.');
      return;
    }
    
    try {
      setRequestSent(true);
      
      // Create a new listing request document in the Listings collection
      const listingData = {
        UserId: auth.currentUser.uid,
        AgentId: agentForRequest.id,
        AgentName: `${agentForRequest.FirstName} ${agentForRequest.LastName}`,
        UserName: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
        Address: address,
        ZipCode: zipCode,
        Status: 'Requested',
        CreatedAt: serverTimestamp(),
        // Include any property details if available
        PropertyDetails: {
          Beds: userData?.Profile?.Beds || null,
          Baths: userData?.Profile?.Baths || null,
          SqFt: userData?.Profile?.SqFt || null,
          Address: address
        },
        // Add user contact info - pull from Profile section
        UserContact: {
          Name: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
          Email: userData?.Email || auth.currentUser.email,
          Phone: userData?.Profile?.PhoneNumber || ''
        },
        // Add agent contact info
        AgentContact: {
          Name: `${agentForRequest.FirstName} ${agentForRequest.LastName}`,
          Email: agentForRequest.Email || '',
          Phone: agentForRequest.Phone || ''
        },
        // Add request type
        RequestType: 'Listing',
        Notes: `Listing request for ${address}`,
        // Add notification tracking fields
        TextSent: false,
        EmailSent: false,
        LastNotificationSent: null
      };
      
      // Add the document to Firestore
      const docRef = await addDoc(collection(db, 'Listings'), listingData);
      
      console.log('Listing request created with ID:', docRef.id);
      console.log('Listing offer request sent to agent:', agentForRequest.id);
      
    } catch (error) {
      console.error('Error sending listing offer request:', error);
      setRequestSent(false);
      // Show an error message to the user
      Alert.alert(
        'Error',
        'There was a problem sending your listing request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Select an agent and send request
  const handleAgentSelect = (agent) => {
    console.log('Agent selected:', agent.id);
    setAgentToConnect(agent);
    setShowConfirmModal(true);
  };

  // Add a function to confirm and send the request
  const confirmAndSendRequest = () => {
    setShowConfirmModal(false);
    
    // Make sure we have the agent to connect with
    if (!agentToConnect) {
      console.error('No agent selected for connection');
      return;
    }
    
    console.log('Confirming request with agent:', agentToConnect.id);
    
    // Set the selected agent and immediately send the request
    setSelectedAgent(agentToConnect);
    
    // Use setTimeout to ensure the state update has completed before sending the request
    setTimeout(() => {
      sendListingOfferRequest();
    }, 100);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Get an Offer</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Loading your home details...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Property Card */}
          <View style={styles.propertyCard}>
            {/* Map View */}
            {mapRegion ? (
              <View style={styles.mapContainer}>
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
            ) : (
              <View style={styles.placeholderMap}>
                <MaterialCommunityIcons name="home-search" size={40} color="#ccc" />
                <Text style={styles.placeholderText}>No address found</Text>
              </View>
            )}
            
            {/* Address */}
            <View style={styles.addressContainer}>
              <Text style={styles.addressText}>{address || 'No address available'}</Text>
              
              {/* Only show bed/bath if they exist in userData */}
              {userData && userData.Profile && (userData.Profile.Beds || userData.Profile.Baths) && (
                <Text style={styles.propertyDetails}>
                  {userData.Profile.Beds ? `${userData.Profile.Beds} Bed ` : ''}
                  {userData.Profile.Baths ? `${userData.Profile.Baths} Bath ` : ''}
                  {userData.Profile.SqFt ? `${userData.Profile.SqFt} Sq Feet` : ''}
                </Text>
              )}
            </View>
          </View>
          
          {/* Cash Offer Info - Updated and made more concise */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>List with a Homerunn Agent</Text>
            <Text style={styles.infoText}>
              Our certified Intelligent Agents combine market expertise with cutting-edge technology to maximize your home's value.
            </Text>
            
            {/* Benefits in a more compact layout */}
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="line-chart" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Data-Driven Pricing</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="camera" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Premium Marketing</Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="handshake-o" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Expert Negotiation</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="check-circle" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Faster Closing</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Agent Section */}
          {!requestSent ? (
            <View style={styles.agentSection}>
              <Text style={styles.agentSectionTitle}>
                Agents Available in Your Area
              </Text>
              
              {loadingAgents ? (
                <View style={styles.loadingAgentsContainer}>
                  <ActivityIndicator size="small" color="#fc565b" />
                  <Text style={styles.loadingAgentsText}>
                    {searchingRadius 
                      ? 'Searching for agents within 30 miles...' 
                      : 'Finding agents in your area...'}
                  </Text>
                </View>
              ) : availableAgents.length > 0 ? (
                <>
                  {/* Check if we have certified agents */}
                  {availableAgents.some(agent => agent.isCertified) ? (
                    <View style={styles.certifiedLabelContainer}>
                      <View style={styles.certifiedIconContainer}>
                        <FontAwesome name="shield" size={16} color="#fc565b" />
                      </View>
                      <Text style={styles.certifiedAgentLabel}>
                        Homerunn Intelligent Agent
                      </Text>
                    </View>
                  ) : availableAgents.some(agent => agent.isNearby) ? (
                    <View style={styles.nearbyLabelContainer}>
                      <View style={styles.nearbyIconContainer}>
                        <FontAwesome name="map-marker" size={16} color="#4CAF50" />
                      </View>
                      <Text style={styles.nearbyAgentLabel}>
                        Agents in Your Area (30-mile radius)
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.otherAgentLabel}>
                      Available Agents
                    </Text>
                  )}
                  
                  {/* Display all agents */}
                  {availableAgents.map((agent) => (
                    <TouchableOpacity 
                      key={agent.id} 
                      style={styles.agentCard}
                      onPress={() => handleAgentSelect(agent)}
                    >
                      <View style={styles.agentImageContainer}>
                        {agent.ProfileImage ? (
                          <Image 
                            source={{ uri: agent.ProfileImage }} 
                            style={styles.agentImage} 
                          />
                        ) : (
                          <View style={styles.agentImagePlaceholder}>
                            <Text style={styles.agentInitials}>
                              {agent.FirstName && agent.LastName 
                                ? `${agent.FirstName.charAt(0)}${agent.LastName.charAt(0)}`
                                : 'AG'}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.agentInfo}>
                        <Text style={styles.agentName}>
                          {agent.FirstName} {agent.LastName}
                        </Text>
                        <Text style={styles.agentCompany}>
                          {agent.Company || (agent.isCertified ? 'Homerunn Agent' : 'Real Estate Agent')}
                        </Text>
                        {agent.Phone && (
                          <Text style={styles.agentContact}>{agent.Phone}</Text>
                        )}
                        {/* Show distance indicator for nearby agents */}
                        {agent.isNearby && (
                          <Text style={styles.agentDistance}>Within 30 miles</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={24} color="#ccc" />
                    </TouchableOpacity>
                  ))}
                </>
              ) : (
                <View style={styles.noAgentsContainer}>
                  <MaterialCommunityIcons name="account-search" size={50} color="#ccc" />
                  <Text style={styles.noAgentsTitle}>No Agents Found</Text>
                  <Text style={styles.noAgentsText}>
                    We couldn't find any agents serving your area. Please try again later or contact support.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Request Sent!</Text>
              <Text style={styles.successText}>
                {selectedAgent 
                  ? `Your Listing Request has been sent to ${selectedAgent.FirstName} ${selectedAgent.LastName}. They will contact you shortly.`
                  : "Your Listing Request has been sent. An agent will contact you shortly."}
              </Text>
              <TouchableOpacity 
                style={styles.doneButton}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContainer}>
            <Text style={styles.confirmModalTitle}>
              Send Listing Request
            </Text>
            <Text style={styles.confirmModalText}>
              Connect with {agentToConnect?.FirstName} {agentToConnect?.LastName} to get a listing offer for your home?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.cancelButton]}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.connectButton]}
                onPress={confirmAndSendRequest}
              >
                <Text style={styles.connectButtonText}>Connect with Agent</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  propertyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapContainer: {
    width: '100%',
    height: height * 0.2,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
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
  customMarkerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -14,
    marginTop: -14,
    zIndex: 2,
  },
  placeholderMap: {
    width: '100%',
    height: height * 0.2,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 10,
    color: '#999',
    fontSize: 16,
  },
  addressContainer: {
    padding: 15,
  },
  addressText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: width * 0.04,
    padding: width * 0.04,
    marginBottom: height * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  infoText: {
    fontSize: width * 0.038,
    color: '#666',
    lineHeight: width * 0.055,
    marginBottom: height * 0.015,
  },
  benefitsContainer: {
    marginTop: height * 0.01,
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.015,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    minHeight: height * 0.04,
  },
  benefitIcon: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: width * 0.0375,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.02,
  },
  benefitTitle: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    flexWrap: 'wrap',
  },
  agentSection: {
    backgroundColor: '#fff',
    borderRadius: width * 0.04,
    padding: width * 0.05,
    marginBottom: height * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentSectionTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.02,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    minHeight: height * 0.08,
  },
  agentImageContainer: {
    marginRight: width * 0.04,
  },
  agentImage: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
  },
  agentImagePlaceholder: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInitials: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#999',
  },
  agentInfo: {
    flex: 1,
    marginRight: width * 0.03,
  },
  agentName: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.005,
  },
  agentCompany: {
    fontSize: width * 0.035,
    color: '#666',
    marginBottom: height * 0.005,
  },
  agentContact: {
    fontSize: width * 0.035,
    color: '#999',
  },
  loadingAgentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: height * 0.04,
  },
  loadingAgentsText: {
    marginTop: height * 0.01,
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
  },
  noAgentsContainer: {
    alignItems: 'center',
    padding: height * 0.04,
  },
  noAgentsTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  noAgentsText: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.025,
    lineHeight: width * 0.055,
  },
  certifiedLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
    marginTop: height * 0.01,
  },
  certifiedIconContainer: {
    width: width * 0.075,
    height: width * 0.075,
    borderRadius: width * 0.0375,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.02,
  },
  certifiedAgentLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
  },
  otherAgentLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#666',
    marginBottom: height * 0.015,
    marginTop: height * 0.01,
  },
  successContainer: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  successIconContainer: {
    marginBottom: 20,
    transform: [{scale: 1.2}],
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  doneButton: {
    backgroundColor: '#fc565b',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  confirmModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  confirmModalButton: {
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    width: '45%',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  connectButton: {
    backgroundColor: '#fc565b',
    width: '52%',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  agentDistance: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  nearbyLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  nearbyIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  nearbyAgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  fallbackLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  fallbackIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  fallbackAgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  agentFallbackMessage: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 5,
  },
});

export default GetListingOffer; 