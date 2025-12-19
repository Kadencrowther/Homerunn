import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../config/firebase';
import { getClientHotdecks } from '../services/HotdeckService';
import { getAgentUser } from '../services/AgentUserService';

const { width, height } = Dimensions.get('window');

const HotdeckListScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [hotdecks, setHotdecks] = useState([]);
  const [agentsMap, setAgentsMap] = useState({});

  useEffect(() => {
    fetchHotdecks();
  }, []);

  const fetchHotdecks = async () => {
    try {
      setLoading(true);
      const userId = auth.currentUser?.uid;
      
      console.log('🔍 HotdeckListScreen - Current user ID:', userId);
      
      if (!userId) {
        console.log('❌ No user is signed in');
        setLoading(false);
        return;
      }

      // Get all hotdecks for this client from API
      console.log('🔄 Fetching hotdecks from API...');
      const clientHotdecks = await getClientHotdecks('active');
      console.log('✅ Received hotdecks:', clientHotdecks.length);
      setHotdecks(clientHotdecks);

      // Fetch agent data for each unique agent
      const uniqueAgentIds = [...new Set(clientHotdecks.map(h => h.agent_id))];
      console.log('👥 Unique agent IDs:', uniqueAgentIds);
      const agents = {};
      
      for (const agentId of uniqueAgentIds) {
        try {
          console.log('🔄 Fetching agent data for:', agentId);
          const agentData = await getAgentUser(agentId);
          if (agentData) {
            agents[agentId] = agentData;
            console.log('✅ Agent data loaded:', agentData.FirstName, agentData.LastName);
          }
        } catch (error) {
          console.error('❌ Error fetching agent:', error);
        }
      }
      
      setAgentsMap(agents);
      console.log('✅ All data loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching hotdecks:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleHotdeckPress = (hotdeck) => {
    navigation.navigate('HotdeckView', { 
      hotdeckId: hotdeck.id,
      agentId: hotdeck.agent_id 
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Loading hotdecks...</Text>
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
        <Text style={styles.headerTitle}>Hotdecks</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {hotdecks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="albums-outline" size={80} color="#ccc" />
            <Text style={styles.emptyTitle}>No Hotdecks Yet</Text>
            <Text style={styles.emptyText}>
              When your agent sends you property collections, they'll appear here.
            </Text>
          </View>
        ) : (
          hotdecks.map((hotdeck) => {
            const agent = agentsMap[hotdeck.agent_id];
            const isViewed = hotdeck.client_activity?.viewed > 0;
            
            return (
              <TouchableOpacity 
                key={hotdeck.id}
                style={styles.hotdeckCard}
                onPress={() => handleHotdeckPress(hotdeck)}
              >
                <View style={styles.hotdeckHeader}>
                  <View style={styles.hotdeckTitleContainer}>
                    <Text style={styles.hotdeckTitle}>{hotdeck.name}</Text>
                    {!isViewed && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.hotdeckDate}>
                    {formatDate(hotdeck.created_at)}
                  </Text>
                </View>

                {agent && (
                  <View style={styles.agentRow}>
                    <Ionicons name="person-outline" size={16} color="#666" />
                    <Text style={styles.agentText}>
                      From {agent.FirstName} {agent.LastName}
                    </Text>
                  </View>
                )}

                {hotdeck.description && (
                  <Text style={styles.hotdeckMessage} numberOfLines={2}>
                    "{hotdeck.description}"
                  </Text>
                )}

                {hotdeck.last_message && (
                  <Text style={styles.hotdeckMessage} numberOfLines={2}>
                    "{hotdeck.last_message}"
                  </Text>
                )}

                <View style={styles.hotdeckFooter}>
                  <View style={styles.propertyCount}>
                    {hotdeck.selection_method === 'criteria' ? (
                      <>
                        <Ionicons name="funnel-outline" size={16} color="#fc565b" />
                        <Text style={styles.propertyCountText}>Filter-based</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="home-outline" size={16} color="#fc565b" />
                        <Text style={styles.propertyCountText}>
                          {hotdeck.property_count || 0} {hotdeck.property_count === 1 ? 'property' : 'properties'}
                        </Text>
                      </>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: height * 0.06,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  hotdeckCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  hotdeckHeader: {
    marginBottom: 12,
  },
  hotdeckTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  hotdeckTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  newBadge: {
    backgroundColor: '#fc565b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  hotdeckDate: {
    fontSize: 14,
    color: '#666',
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  agentText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  hotdeckMessage: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  hotdeckFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  propertyCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  propertyCountText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: height * 0.2,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default HotdeckListScreen;

