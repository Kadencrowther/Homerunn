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

  // Modify the findAgentsForZipCode function to only show certified agents
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
          // No certified agents, show NO agents
          console.log('No certified agents found, showing no agents');
          setAvailableAgents([]);
        }
      } else {
        console.log('No agents found');
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error finding agents:', error);
    } finally {
      setLoadingAgents(false);
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

  // When zip code is set, find agents
  useEffect(() => {
    if (zipCode) {
      findAgentsForZipCode();
    }
  }, [zipCode]);

  // Send cash offer request to the selected agent
  const sendListingOfferRequest = async () => {
    if (!selectedAgent) return;
    
    try {
      setRequestSent(true);
      
      // Create a new listing request document in the Listings collection
      const listingData = {
        UserId: auth.currentUser.uid,
        AgentId: selectedAgent.id,
        AgentName: `${selectedAgent.FirstName} ${selectedAgent.LastName}`,
        UserName: `${userData?.FirstName || ''} ${userData?.LastName || ''}`.trim(),
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
        // Add user contact info
        UserContact: {
          Name: `${userData?.FirstName || ''} ${userData?.LastName || ''}`.trim(),
          Email: userData?.Email || auth.currentUser.email,
          Phone: userData?.Phone || ''
        },
        // Add agent contact info
        AgentContact: {
          Name: `${selectedAgent.FirstName} ${selectedAgent.LastName}`,
          Email: selectedAgent.Email || '',
          Phone: selectedAgent.Phone || ''
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
      console.log('Listing offer request sent to agent:', selectedAgent.id);
      
      // You could also send a notification to the agent here
      // This would typically be done via a Cloud Function
      
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
    setAgentToConnect(agent);
    setShowConfirmModal(true);
  };

  // Add a function to confirm and send the request
  const confirmAndSendRequest = () => {
    setShowConfirmModal(false);
    setSelectedAgent(agentToConnect);
    sendListingOfferRequest();
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
                  <Text style={styles.loadingAgentsText}>Finding agents in your area...</Text>
                </View>
              ) : availableAgents.length > 0 ? (
                <>
                  {/* If any agents are certified, they're the only ones in the array */}
                  {availableAgents[0].isCertified ? (
                    <View style={styles.certifiedLabelContainer}>
                      <View style={styles.certifiedIconContainer}>
                        <FontAwesome name="shield" size={16} color="#fc565b" />
                      </View>
                      <Text style={styles.certifiedAgentLabel}>
                        Homerunn Intelligent Agent
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.otherAgentLabel}>
                      Other Available Agents
                    </Text>
                  )}
                  
                  {/* Display all agents in the array (which will be either only certified or only non-certified) */}
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
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 12,
  },
  benefitsContainer: {
    marginTop: 5,
  },
  benefitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  agentSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  agentSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  agentImageContainer: {
    marginRight: 15,
  },
  agentImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  agentImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  agentCompany: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  agentContact: {
    fontSize: 14,
    color: '#999',
  },
  loadingAgentsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingAgentsText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  noAgentsContainer: {
    alignItems: 'center',
    padding: 30,
  },
  noAgentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  noAgentsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  certifiedLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 5,
  },
  certifiedIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  certifiedAgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  otherAgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 5,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GetListingOffer; 