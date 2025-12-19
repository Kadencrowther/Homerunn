import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  ActivityIndicator, 
  Dimensions, 
  Alert,
  Linking 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getAgentUser } from '../services/AgentUserService';

const { width, height } = Dimensions.get('window');

const AgentDetailsScreen = ({ navigation, route }) => {
  const { agent: initialAgent } = route.params;
  const [agent, setAgent] = useState(initialAgent);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [requestSent, setRequestSent] = useState(false);
  const [alreadyConnected, setAlreadyConnected] = useState(false);

  useEffect(() => {
    fetchAgentDetails();
    fetchUserData();
    checkExistingConnection();
  }, []);

  const fetchAgentDetails = async () => {
    try {
      setLoading(true);
      const agentData = await getAgentUser(initialAgent.id);
      if (agentData) {
        setAgent({ ...initialAgent, ...agentData });
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const checkExistingConnection = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const connectionsQuery = query(
        collection(db, 'AgentConnections'),
        where('UserId', '==', userId),
        where('AgentId', '==', initialAgent.id)
      );
      
      const connectionsSnapshot = await getDocs(connectionsQuery);
      
      if (!connectionsSnapshot.empty) {
        setAlreadyConnected(true);
        setRequestSent(true);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleConnectAgent = async () => {
    try {
      setRequestSent(true);
      
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
      
      await addDoc(collection(db, 'AgentConnections'), connectionData);
      
      Alert.alert(
        'Request Sent!',
        `Your connection request has been sent to ${agent.FirstName} ${agent.LastName}. They will contact you shortly.`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error connecting with agent:', error);
      Alert.alert('Error', 'There was a problem connecting with this agent. Please try again.');
      setRequestSent(false);
    }
  };

  const handleCallAgent = () => {
    if (agent.Phone) {
      Linking.openURL(`tel:${agent.Phone}`);
    }
  };

  const handleEmailAgent = () => {
    if (agent.Email) {
      Linking.openURL(`mailto:${agent.Email}`);
    }
  };

  const handleWebsite = () => {
    if (agent.Website) {
      Linking.openURL(agent.Website);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fc565b" />
        <Text style={styles.loadingText}>Loading agent details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileImageContainer}>
            {agent.ProfileImage ? (
              <Image 
                source={{ uri: agent.ProfileImage }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileInitials}>
                  {agent.FirstName && agent.LastName 
                    ? `${agent.FirstName.charAt(0)}${agent.LastName.charAt(0)}`
                    : 'AG'}
                </Text>
              </View>
            )}
            {agent.isCertified && (
              <View style={styles.certifiedBadge}>
                <FontAwesome name="shield" size={16} color="#fff" />
              </View>
            )}
          </View>
          
          <Text style={styles.agentName}>
            {agent.FirstName} {agent.LastName}
          </Text>
          
          <Text style={styles.agentCompany}>
            {agent.Company || (agent.isCertified ? 'Homerunn Intelligent Agent' : 'Real Estate Agent')}
          </Text>

          {agent.isCertified && (
            <View style={styles.certifiedLabel}>
              <FontAwesome name="shield" size={14} color="#fc565b" />
              <Text style={styles.certifiedLabelText}>Homerunn Certified</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {agent.Phone && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleCallAgent}
            >
              <Ionicons name="call" size={20} color="#fc565b" />
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {agent.Email && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleEmailAgent}
            >
              <Ionicons name="mail" size={20} color="#fc565b" />
              <Text style={styles.quickActionText}>Email</Text>
            </TouchableOpacity>
          )}
          
          {agent.Website && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleWebsite}
            >
              <Ionicons name="globe" size={20} color="#fc565b" />
              <Text style={styles.quickActionText}>Website</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* About Section */}
        {agent.Bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{agent.Bio}</Text>
          </View>
        )}

        {/* Experience & Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Details</Text>
          
          {agent.YearsExperience > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome name="calendar" size={16} color="#fc565b" />
              </View>
              <Text style={styles.detailText}>
                {agent.YearsExperience} {agent.YearsExperience === 1 ? 'year' : 'years'} of experience
              </Text>
            </View>
          )}
          
          {agent.State && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome name="map-marker" size={16} color="#fc565b" />
              </View>
              <Text style={styles.detailText}>Licensed in {agent.State}</Text>
            </View>
          )}
          
          {agent.MLS && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome name="building" size={16} color="#fc565b" />
              </View>
              <Text style={styles.detailText}>MLS: {agent.MLS}</Text>
            </View>
          )}

          {agent.ZipCodes && agent.ZipCodes.length > 0 && (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <FontAwesome name="location-arrow" size={16} color="#fc565b" />
              </View>
              <Text style={styles.detailText}>
                Serves {agent.ZipCodes.length} {agent.ZipCodes.length === 1 ? 'area' : 'areas'}
              </Text>
            </View>
          )}
        </View>

        {/* Specialties */}
        {agent.Specialties && agent.Specialties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.specialtiesContainer}>
              {agent.Specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {agent.Phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.contactText}>{agent.Phone}</Text>
            </View>
          )}
          
          {agent.Email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.contactText}>{agent.Email}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity 
          style={[styles.connectButton, (requestSent || alreadyConnected) && styles.connectButtonDisabled]}
          onPress={handleConnectAgent}
          disabled={requestSent || alreadyConnected}
        >
          <Text style={styles.connectButtonText}>
            {alreadyConnected || requestSent ? 'Invite Sent' : 'Connect with Agent'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: height * 0.06,
    paddingHorizontal: width * 0.025,
    paddingBottom: height * 0.01,
  },
  backButton: {
    padding: width * 0.025,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    paddingBottom: height * 0.12,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: height * 0.015,
  },
  profileImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  profileImagePlaceholder: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f0f0f0',
  },
  profileInitials: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#999',
  },
  certifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fc565b',
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.04,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  agentName: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.005,
  },
  agentCompany: {
    fontSize: width * 0.04,
    color: '#666',
    marginBottom: height * 0.01,
  },
  certifiedLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    borderRadius: width * 0.04,
    marginTop: height * 0.01,
  },
  certifiedLabelText: {
    fontSize: width * 0.035,
    fontWeight: '600',
    color: '#fc565b',
    marginLeft: width * 0.02,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: height * 0.025,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: width * 0.03,
  },
  quickActionText: {
    fontSize: width * 0.035,
    color: '#333',
    marginTop: height * 0.005,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.015,
  },
  bioText: {
    fontSize: width * 0.04,
    color: '#666',
    lineHeight: width * 0.06,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  detailIcon: {
    width: width * 0.08,
    height: width * 0.08,
    borderRadius: width * 0.04,
    backgroundColor: 'rgba(252, 86, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: width * 0.03,
  },
  detailText: {
    fontSize: width * 0.04,
    color: '#666',
    flex: 1,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: height * 0.01,
  },
  specialtyTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.01,
    borderRadius: width * 0.04,
    marginRight: width * 0.02,
    marginBottom: height * 0.01,
  },
  specialtyText: {
    fontSize: width * 0.035,
    color: '#333',
    fontWeight: '500',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.015,
  },
  contactText: {
    fontSize: width * 0.04,
    color: '#666',
    marginLeft: width * 0.03,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.02,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  connectButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.02,
    borderRadius: width * 0.03,
    alignItems: 'center',
  },
  connectButtonDisabled: {
    backgroundColor: '#4CAF50',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: 'bold',
  },
});

export default AgentDetailsScreen;

