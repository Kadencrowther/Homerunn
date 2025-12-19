import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Image, 
  Linking, 
  ActivityIndicator,
  Alert,
  Dimensions 
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { getUserConnection, disconnectConnection } from '../services/agentUserConnectionService';
import { getAgentUser } from '../services/AgentUserService';

const { width, height} = Dimensions.get('window');

const MyAgent = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState(null);
  const [agent, setAgent] = useState(null);

  useEffect(() => {
    fetchConnectedAgent();
  }, []);

  const fetchConnectedAgent = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      console.log('🔍 MyAgent - User ID:', userId);
      
      if (!userId) {
        console.log('❌ MyAgent - No user is signed in');
        setLoading(false);
        return;
      }

      // Get the connection
      console.log('🔄 MyAgent - Fetching user connection...');
      const userConnection = await getUserConnection(userId);
      console.log('📊 MyAgent - Connection data:', userConnection);
      
      if (userConnection && userConnection.Status === 'Accepted') {
        console.log('✅ MyAgent - Connection accepted, AgentId:', userConnection.AgentId);
        setConnection(userConnection);
        
        // Fetch full agent details from AgentUsers collection
        console.log('🔄 MyAgent - Fetching agent details from AgentUsers...');
        const agentData = await getAgentUser(userConnection.AgentId);
        console.log('👤 MyAgent - Agent data:', agentData);
        
        if (agentData) {
          console.log('✅ MyAgent - Agent data loaded successfully');
          setAgent(agentData);
        } else {
          console.log('❌ MyAgent - No agent data found for ID:', userConnection.AgentId);
        }
      } else {
        // No accepted connection
        console.log('⚠️ MyAgent - No accepted connection. Status:', userConnection?.Status);
      }
    } catch (error) {
      console.error('❌ MyAgent - Error fetching connected agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (agent && agent.Phone) {
      Linking.openURL(`tel:${agent.Phone}`);
    }
  };

  const handleEmail = () => {
    if (agent && agent.Email) {
      Linking.openURL(`mailto:${agent.Email}`);
    }
  };

  const handleWebsite = () => {
    if (agent && agent.Website) {
      Linking.openURL(agent.Website);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Agent',
      `Are you sure you want to disconnect from ${agent?.name}? You can always reconnect later.`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              if (connection) {
                await disconnectConnection(connection.id);
                Alert.alert('Success', 'You have been disconnected from your agent.');
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error disconnecting:', error);
              Alert.alert('Error', 'Failed to disconnect. Please try again.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Loading agent information...</Text>
        </View>
      </View>
    );
  }

  if (!agent || !connection) {
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.noAgentContainer}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <Text style={styles.noAgentTitle}>No Agent Connected</Text>
          <Text style={styles.noAgentText}>
            You don't have a connected agent yet. Find an agent to help you with your home search!
          </Text>
          <TouchableOpacity 
            style={styles.findAgentButton}
            onPress={() => navigation.navigate('FindAnAgent')}
          >
            <Text style={styles.findAgentButtonText}>Find an Agent</Text>
          </TouchableOpacity>
        </View>
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
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
          </View>
          
          <Text style={styles.agentName}>
            {agent.FirstName} {agent.LastName}
          </Text>
          <Text style={styles.agentTitle}>
            {agent.Company || 'Your Connected Agent'}
          </Text>
          
          <View style={styles.connectionStatus}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.connectionStatusText}>
              Connected since {new Date(connection.ConnectionActivatedAt).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {agent.Phone && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleCall}
            >
              <Ionicons name="call" size={24} color="#fc565b" />
              <Text style={styles.quickActionText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {agent.Email && (
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={handleEmail}
            >
              <Ionicons name="mail" size={24} color="#fc565b" />
              <Text style={styles.quickActionText}>Email</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('HotdeckList')}
          >
            <Ionicons name="albums" size={24} color="#fc565b" />
            <Text style={styles.quickActionText}>Hotdecks</Text>
          </TouchableOpacity>
        </View>

        {/* About Agent */}
        {agent.Bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{agent.Bio}</Text>
          </View>
        )}

        {/* Professional Details */}
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
          
          {agent.Email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={20} color="#666" />
              <Text style={styles.contactText}>{agent.Email}</Text>
            </View>
          )}
          
          {agent.Phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={20} color="#666" />
              <Text style={styles.contactText}>{agent.Phone}</Text>
            </View>
          )}
          
          {agent.State && (
            <View style={styles.contactRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.contactText}>Licensed in {agent.State}</Text>
            </View>
          )}
        </View>

        {/* Disconnect Button */}
        <TouchableOpacity 
          style={styles.disconnectButton}
          onPress={handleDisconnect}
        >
          <Ionicons name="unlink-outline" size={20} color="#ff3b30" />
          <Text style={styles.disconnectButtonText}>Disconnect Agent</Text>
        </TouchableOpacity>
      </ScrollView>
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
  },
  loadingText: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: height * 0.05,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: height * 0.03,
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
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImagePlaceholder: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitials: {
    fontSize: width * 0.08,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: width * 0.05,
    padding: width * 0.01,
  },
  agentName: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.005,
  },
  agentTitle: {
    fontSize: width * 0.04,
    color: '#666',
    marginBottom: height * 0.01,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.008,
    borderRadius: width * 0.04,
    marginTop: height * 0.01,
  },
  connectionStatusText: {
    fontSize: width * 0.033,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: width * 0.015,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: height * 0.025,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  quickActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.03,
    flex: 1,
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
  aboutText: {
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
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: width * 0.05,
    marginTop: height * 0.03,
    paddingVertical: height * 0.015,
    borderWidth: 1,
    borderColor: '#ff3b30',
    borderRadius: width * 0.02,
  },
  disconnectButtonText: {
    fontSize: width * 0.04,
    color: '#ff3b30',
    fontWeight: '600',
    marginLeft: width * 0.02,
  },
  noAgentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  noAgentTitle: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#333',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  noAgentText: {
    fontSize: width * 0.04,
    color: '#666',
    textAlign: 'center',
    lineHeight: width * 0.06,
    marginBottom: height * 0.03,
  },
  findAgentButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.08,
    borderRadius: width * 0.02,
  },
  findAgentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
});

export default MyAgent;
