import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Dimensions,
  Image
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const AgentSearch = ({ navigation, connectedAgentIds = [], onInviteAgent }) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchAgents = async () => {
    if (!searchText.trim()) return;

    try {
      setLoading(true);
      setHasSearched(true);
      
      const searchLower = searchText.toLowerCase().trim();
      const searchDigits = searchText.replace(/\D/g, ''); // Extract digits for phone search
      
      // Get all agents
      const agentsQuery = query(collection(db, 'AgentUsers'));
      const agentSnapshot = await getDocs(agentsQuery);
      
      if (!agentSnapshot.empty) {
        // Filter agents based on search text
        const results = agentSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(agent => {
            // Search by name, email, phone, company, state, or zip codes
            const firstName = (agent.FirstName || '').toLowerCase();
            const lastName = (agent.LastName || '').toLowerCase();
            const email = (agent.Email || '').toLowerCase();
            const phone = (agent.Phone || '').replace(/\D/g, ''); // Normalize phone
            const company = (agent.Company || '').toLowerCase();
            const state = (agent.State || '').toLowerCase();
            const zipCodes = agent.ZipCodes || [];
            
            return (
              firstName.includes(searchLower) ||
              lastName.includes(searchLower) ||
              `${firstName} ${lastName}`.includes(searchLower) ||
              email.includes(searchLower) ||
              (searchDigits && phone.includes(searchDigits)) ||
              company.includes(searchLower) ||
              state.includes(searchLower) ||
              zipCodes.some(zip => zip.includes(searchText.trim()))
            );
          })
          .slice(0, 10); // Limit to 10 results
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching agents:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const isConnected = (agentId) => {
    return connectedAgentIds.includes(agentId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Agents</Text>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, phone, or location"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={searchAgents}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={searchAgents}
          disabled={!searchText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.searchButtonText}>Search</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Results */}
      {hasSearched && (
        <View style={styles.resultsContainer}>
          {searchResults.length > 0 ? (
            <>
              <Text style={styles.resultsHeader}>
                Found {searchResults.length} {searchResults.length === 1 ? 'agent' : 'agents'}
              </Text>
              {searchResults.map((agent) => (
                <TouchableOpacity 
                  key={agent.id} 
                  style={styles.agentCard}
                  onPress={() => navigation.navigate('AgentDetails', { agent })}
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
                      {agent.Company || 'Real Estate Agent'}
                    </Text>
                    {agent.State && (
                      <Text style={styles.agentLocation}>
                        <FontAwesome name="map-marker" size={12} color="#999" /> {agent.State}
                      </Text>
                    )}
                  </View>
                  
                  {isConnected(agent.id) ? (
                    <View style={styles.connectedBadge}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.connectedText}>Invite Sent</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={24} color="#ccc" />
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Invite Agent Button */}
              <TouchableOpacity 
                style={styles.inviteAgentButtonPrimary}
                onPress={onInviteAgent}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.inviteAgentButtonPrimaryText}>
                  Don't see your agent? Invite them here
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search" size={40} color="#ccc" />
              <Text style={styles.noResultsText}>No agents found</Text>
              <Text style={styles.noResultsSubtext}>
                Try searching by name, email, phone, or location
              </Text>
              
              {/* Invite Agent Button */}
              <TouchableOpacity 
                style={styles.inviteAgentButtonPrimary}
                onPress={onInviteAgent}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.inviteAgentButtonPrimaryText}>
                  Invite Your Agent
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  title: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: height * 0.015,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: width * 0.02,
    paddingHorizontal: width * 0.03,
    marginRight: width * 0.02,
  },
  searchIcon: {
    marginRight: width * 0.02,
  },
  searchInput: {
    flex: 1,
    height: height * 0.05,
    fontSize: width * 0.04,
    color: '#333',
  },
  clearButton: {
    padding: width * 0.01,
  },
  searchButton: {
    backgroundColor: '#fc565b',
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: width * 0.2,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: height * 0.02,
  },
  resultsHeader: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#666',
    marginBottom: height * 0.015,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  agentImageContainer: {
    marginRight: width * 0.03,
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
  },
  agentName: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginBottom: height * 0.003,
  },
  agentCompany: {
    fontSize: width * 0.035,
    color: '#666',
    marginBottom: height * 0.003,
  },
  agentLocation: {
    fontSize: width * 0.033,
    color: '#999',
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: width * 0.025,
    paddingVertical: height * 0.008,
    borderRadius: width * 0.03,
  },
  connectedText: {
    fontSize: width * 0.033,
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: width * 0.015,
  },
  noResultsContainer: {
    alignItems: 'center',
    paddingVertical: height * 0.04,
  },
  noResultsText: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#333',
    marginTop: height * 0.015,
    marginBottom: height * 0.005,
  },
  noResultsSubtext: {
    fontSize: width * 0.035,
    color: '#999',
    textAlign: 'center',
  },
  inviteAgentButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.05,
    borderRadius: width * 0.02,
    marginTop: height * 0.02,
  },
  inviteAgentButtonPrimaryText: {
    fontSize: width * 0.04,
    color: '#fff',
    fontWeight: '600',
    marginLeft: width * 0.02,
  },
});

export default AgentSearch;

