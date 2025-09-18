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
        UserId: auth.currentUser.uid,
        AgentId: agent.id,
        AgentName: `${agent.FirstName} ${agent.LastName}`,
        UserName: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
        Status: 'Requested',
        CreatedAt: serverTimestamp(),
        UserContact: {
          Name: `${userData?.Profile?.FirstName || ''} ${userData?.Profile?.LastName || ''}`.trim(),
          Email: userData?.Email || auth.currentUser.email,
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
    paddingTop: height * 0.06,
  },
  backButton: {
    padding: width * 0.025,
    marginLeft: width * 0.025,
    marginBottom: height * 0.01,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.025,
    paddingHorizontal: width * 0.05,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: height * 0.01,
    fontSize: width * 0.04,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.05,
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
  mlsAgentLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#666',
    marginBottom: height * 0.015,
    marginTop: height * 0.01,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.075,
  },
  successIconContainer: {
    marginBottom: height * 0.025,
  },
  successTitle: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.02,
  },
  successText: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    lineHeight: width * 0.06,
    marginBottom: height * 0.03,
  },
  doneButton: {
    backgroundColor: '#fc565b',
    borderRadius: width * 0.075,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
});

export default FindAnAgent; 