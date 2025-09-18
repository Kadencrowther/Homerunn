import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const MyAgent = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState(null);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log('No user is signed in');
        setLoading(false);
        return;
      }

      // First get the user document to find the agent ID
      const userDocRef = doc(db, 'Users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user has AgentId field
        if (userData.AgentId) {
          // Fetch agent data
          const agentDocRef = doc(db, 'Agents', userData.AgentId);
          const agentDoc = await getDoc(agentDocRef);
          
          if (agentDoc.exists()) {
            setAgentData(agentDoc.data());
          } else {
            console.log('Agent document not found');
            // If agent document doesn't exist, use the AgentName from user data if available
            if (userData.AgentName) {
              setAgentData({
                name: userData.AgentName,
                // Set default values for other fields
                photo: 'https://via.placeholder.com/150',
                phone: 'Not available',
                email: 'Not available',
                bio: 'Information not available'
              });
            }
          }
        } else if (userData.AgentName) {
          // If there's no AgentId but there is an AgentName, use that
          setAgentData({
            name: userData.AgentName,
            // Set default values for other fields
            photo: 'https://via.placeholder.com/150',
            phone: 'Not available',
            email: 'Not available',
            bio: 'Information not available'
          });
        } else {
          console.log('No agent information found for this user');
        }
      } else {
        console.log('User document not found');
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const callAgent = () => {
    if (agentData && agentData.phone) {
      Linking.openURL(`tel:${agentData.phone}`);
    }
  };

  const emailAgent = () => {
    if (agentData && agentData.email) {
      Linking.openURL(`mailto:${agentData.email}`);
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

      <Text style={styles.title}>My Agent</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Loading agent information...</Text>
        </View>
      ) : agentData ? (
        <View style={styles.agentContainer}>
          <Image 
            source={{ uri: agentData.photo || 'https://via.placeholder.com/150' }} 
            style={styles.agentPhoto} 
          />
          
          <Text style={styles.agentName}>{agentData.name}</Text>
          
          {agentData.company && (
            <Text style={styles.agentCompany}>{agentData.company}</Text>
          )}
          
          {agentData.bio && (
            <Text style={styles.agentBio}>{agentData.bio}</Text>
          )}
          
          <View style={styles.contactContainer}>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={callAgent}
            >
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={emailAgent}
            >
              <Ionicons name="mail" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>About Your Agent</Text>
            <Text style={styles.infoText}>
              Your agent is here to help you find your dream home. They can assist with property viewings, negotiations, and guiding you through the entire home buying process.
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.noAgentContainer}>
          <Ionicons name="person-outline" size={80} color="#ccc" />
          <Text style={styles.noAgentText}>No agent information available</Text>
          <TouchableOpacity 
            style={styles.findAgentButton}
            onPress={() => navigation.navigate('FindAnAgent')}
          >
            <Text style={styles.findAgentButtonText}>Find an Agent</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.04,
    backgroundColor: '#fff',
  },
  backButton: {
    marginTop: height * 0.06,
    marginBottom: height * 0.02,
    padding: width * 0.02,
  },
  title: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#fc565b',
    marginBottom: height * 0.03,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: height * 0.02,
    fontSize: width * 0.04,
    color: '#555',
  },
  agentContainer: {
    alignItems: 'center',
  },
  agentPhoto: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    marginBottom: height * 0.02,
  },
  agentName: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.01,
  },
  agentCompany: {
    fontSize: width * 0.04,
    color: '#555',
    marginBottom: height * 0.02,
  },
  agentBio: {
    fontSize: width * 0.04,
    color: '#555',
    textAlign: 'center',
    marginBottom: height * 0.03,
    paddingHorizontal: width * 0.04,
  },
  contactContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: height * 0.03,
  },
  contactButton: {
    backgroundColor: '#fc565b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: width * 0.02,
    minWidth: width * 0.35,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
  },
  infoContainer: {
    backgroundColor: '#f9f9f9',
    padding: width * 0.04,
    borderRadius: width * 0.02,
    marginTop: height * 0.02,
    width: '100%',
  },
  infoTitle: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    marginBottom: height * 0.01,
  },
  infoText: {
    fontSize: width * 0.035,
    color: '#555',
    lineHeight: height * 0.025,
  },
  noAgentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.1,
  },
  noAgentText: {
    fontSize: width * 0.045,
    color: '#555',
    textAlign: 'center',
    marginVertical: height * 0.03,
  },
  findAgentButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.06,
    borderRadius: width * 0.02,
    marginTop: height * 0.02,
  },
  findAgentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width * 0.04,
  },
});

export default MyAgent;
