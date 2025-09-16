import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const FindAnAgent = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [zipCode, setZipCode] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [requestSent, setRequestSent] = useState(false);

  // Fetch user data to get zip code
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log('No user is signed in');
        setLoading(false);
        return;
      }

      console.log('Fetching user data for FindAnAgent for ID:', userId);
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        console.log('User data retrieved for FindAnAgent:', data);
        
        // Try to get zip code from Profile address
        if (data.Profile && data.Profile.Address) {
          // Extract zip code from address (simple approach)
          const addressParts = data.Profile.Address.split(' ');
          const possibleZip = addressParts[addressParts.length - 1];
          
          // Basic validation for US zip code
          if (/^\d{5}(-\d{4})?$/.test(possibleZip)) {
            setZipCode(possibleZip.substring(0, 5)); // Get first 5 digits
          } else {
            // If no zip in address, check Location preferences
            if (data.Location && data.Location.Name) {
              // Extract zip from location name if possible
              const locationParts = data.Location.Name.split(' ');
              const lastPart = locationParts[locationParts.length - 1];
              if (/^\d{5}$/.test(lastPart)) {
                setZipCode(lastPart);
              }
            }
          }
        } else if (data.Location && data.Location.Name) {
          // Extract zip from location name if possible
          const locationParts = data.Location.Name.split(' ');
          const lastPart = locationParts[locationParts.length - 1];
          if (/^\d{5}$/.test(lastPart)) {
            setZipCode(lastPart);
          }
        }
      } else {
        console.log('No user document found for this user in FindAnAgent');
      }
    } catch (error) {
      console.error('Error fetching user data in FindAnAgent:', error);
    } finally {
      setLoading(false);
    }
  };

  // When zip code is set, find agents
  useEffect(() => {
    if (zipCode) {
      findAgentsForZipCode();
    } else {
      // If no zip code found, try to fetch default agents
      fetchDefaultAgents();
    }
  }, [zipCode]);

  // Find agents for the user's zip code
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
          // No certified agents, try to fetch from MLS
          console.log('No certified agents found, trying MLS agents');
          fetchMLSAgents();
        }
      } else {
        console.log('No agents found');
        fetchMLSAgents();
      }
    } catch (error) {
      console.error('Error finding agents:', error);
      fetchMLSAgents();
    } finally {
      setLoadingAgents(false);
    }
  };

  // Fetch agents from MLS (simulated)
  const fetchMLSAgents = async () => {
    try {
      console.log('Fetching MLS agents');
      
      // In a real app, you would query your MLS database
      // For now, we'll just fetch any agents as a fallback
      const agentsQuery = query(
        collection(db, 'AgentUsers')
      );
      
      const agentSnapshot = await getDocs(agentsQuery);
      
      if (!agentSnapshot.empty) {
        const agentsData = agentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isMLSAgent: true
        })).slice(0, 5); // Limit to 5 agents
        
        console.log('Found MLS agents:', agentsData);
        setAvailableAgents(agentsData);
      } else {
        console.log('No MLS agents found');
        setAvailableAgents([]);
      }
    } catch (error) {
      console.error('Error fetching MLS agents:', error);
      setAvailableAgents([]);
    }
  };

  // Fetch some default agents if none are found
  const fetchDefaultAgents = async () => {
    try {
      console.log('Fetching default agents');
      
      // Query for any agents, limited to 5
      const agentsQuery = query(
        collection(db, 'AgentUsers')
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

  // Handle agent selection
  const handleAgentSelect = async (agent) => {
    try {
      setSelectedAgent(agent);
      setRequestSent(true);
      
      // Create a connection request in Firestore
      const connectionData = {
        UserId: auth.currentUser?.uid ?? 'guest',
        AgentId: agent.id,
        AgentName: `${agent.FirstName} ${agent.LastName}`,
        UserName: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
        Status: 'Requested',
        CreatedAt: serverTimestamp(),
        UserContact: {
          Name: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
          Email: userData?.Email || (auth.currentUser?.email ?? 'guest@homerunn.com'),
          Phone: userData?.Profile?.PhoneNumber || ''
        },
        AgentContact: {
          Name: `${agent.FirstName} ${agent.LastName}`,
          Email: agent.Email || '',
          Phone: agent.Phone || ''
        },
        RequestType: 'AgentConnection',
        Notes: `User requested to connect with agent`,
        TextSent: false,
        EmailSent: false,
        LastNotificationSent: null
      };
      
      // Add the document to Firestore
      await addDoc(collection(db, 'AgentConnections'), connectionData);
      
      console.log('Agent connection request sent to:', agent.id);
      
    } catch (error) {
      console.error('Error connecting with agent:', error);
      Alert.alert('Error', 'There was a problem connecting with this agent. Please try again.');
      setRequestSent(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Find an Agent</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Finding the best agents for you...</Text>
        </View>
      ) : requestSent ? (
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Request Sent!</Text>
          <Text style={styles.successText}>
            {`Your connection request has been sent to ${selectedAgent.FirstName} ${selectedAgent.LastName}. They will contact you shortly.`}
          </Text>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Why Choose a Homerunn Agent?</Text>
            <Text style={styles.infoText}>
              Our agents combine local expertise with cutting-edge technology to help you find your perfect home faster and with less stress.
            </Text>
            
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="search" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Smart Home Search</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="dollar" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Better Pricing</Text>
                </View>
              </View>
              
              <View style={styles.benefitRow}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="clock-o" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Faster Closings</Text>
                </View>
                
                <View style={styles.benefitItem}>
                  <View style={styles.benefitIcon}>
                    <FontAwesome name="shield" size={16} color="#fc565b" />
                  </View>
                  <Text style={styles.benefitTitle}>Expert Guidance</Text>
                </View>
              </View>
            </View>
          </View>
          
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
                {/* If any agents are certified, show the certified label */}
                {availableAgents[0].isCertified && (
                  <View style={styles.certifiedLabelContainer}>
                    <View style={styles.certifiedIconContainer}>
                      <FontAwesome name="shield" size={16} color="#fc565b" />
                    </View>
                    <Text style={styles.certifiedAgentLabel}>
                      Homerunn Intelligent Agent
                    </Text>
                  </View>
                )}
                
                {/* If agents are from MLS, show MLS label */}
                {availableAgents[0].isMLSAgent && (
                  <Text style={styles.mlsAgentLabel}>
                    Local MLS Agents
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
                    </View>
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.noAgentsContainer}>
                <Ionicons name="people" size={50} color="#ccc" />
                <Text style={styles.noAgentsTitle}>No Agents Found</Text>
                <Text style={styles.noAgentsText}>
                  We couldn't find any agents serving your area. Please try again later or contact support.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
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
  mlsAgentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginTop: 5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIconContainer: {
    marginBottom: 20,
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
});

export default FindAnAgent; 