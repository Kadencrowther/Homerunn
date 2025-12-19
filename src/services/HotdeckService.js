import { auth } from '../config/firebase';

const API_BASE_URL = 'https://hotdecks-api-1006467951298.us-central1.run.app/v1';

/**
 * Get authentication token for API requests
 */
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.getIdToken();
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🌐 Making API request to:', url);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📦 Response data:', JSON.stringify(data, null, 2));

    if (!response.ok || !data.success) {
      const errorMsg = data.error?.message || 'API request failed';
      console.error('❌ API error:', errorMsg);
      throw new Error(errorMsg);
    }

    return data.data;
  } catch (error) {
    console.error('❌ API request error:', error);
    console.error('❌ Error stack:', error.stack);
    throw error;
  }
};

/**
 * Get all hotdecks for the current client
 * @param {string} status - Optional status filter ('active', 'draft', 'archived', or 'all')
 * @returns {Promise<Array>} Array of hotdecks
 */
export const getClientHotdecks = async (status = 'all') => {
  try {
    const user = auth.currentUser;
    console.log('🔍 Fetching hotdecks for user:', user?.uid);
    
    const queryParam = status && status !== 'all' ? `?status=${status}` : '';
    const endpoint = `/client/hot-decks${queryParam}`;
    console.log('🔍 API endpoint:', `${API_BASE_URL}${endpoint}`);
    
    const decks = await apiRequest(endpoint);
    console.log(`✅ Found ${decks.length} hotdecks for client`);
    console.log('📦 Hotdecks data:', JSON.stringify(decks, null, 2));
    return decks;
  } catch (error) {
    console.error('❌ Error getting client hotdecks:', error);
    console.error('❌ Error details:', error.message);
    throw error;
  }
};

/**
 * Get a specific hotdeck by agent ID and deck ID
 * @param {string} agentId - The ID of the agent
 * @param {string} deckId - The ID of the hotdeck
 * @returns {Promise<Object|null>} The hotdeck data or null
 */
export const getHotdeck = async (agentId, deckId) => {
  try {
    const deck = await apiRequest(`/client/hot-decks/${agentId}/${deckId}`);
    console.log('✅ Retrieved hotdeck:', deck.id);
    return deck;
  } catch (error) {
    console.error('❌ Error getting hotdeck:', error);
    throw error;
  }
};

/**
 * Get properties in a hotdeck with pagination
 * @param {string} deckId - The ID of the hotdeck
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 50)
 * @returns {Promise<Object>} Object with properties array and pagination info
 */
export const getHotdeckProperties = async (deckId, page = 1, limit = 50) => {
  try {
    const response = await apiRequest(`/hot-decks/${deckId}/properties?page=${page}&limit=${limit}`);
    console.log(`✅ Retrieved ${response.properties?.length || 0} properties for hotdeck ${deckId}`);
    return response;
  } catch (error) {
    console.error('❌ Error getting hotdeck properties:', error);
    throw error;
  }
};

/**
 * Mark a hotdeck as viewed (track client activity)
 * Note: This would need to be added to the API if activity tracking is implemented
 * @param {string} agentId - The ID of the agent
 * @param {string} deckId - The ID of the hotdeck
 * @returns {Promise<void>}
 */
export const markHotdeckAsViewed = async (agentId, deckId) => {
  try {
    // This is a placeholder - the API would need an endpoint for this
    // For now, we'll just log it
    console.log('✅ Marked hotdeck as viewed:', deckId);
    // In the future: await apiRequest(`/client/hot-decks/${agentId}/${deckId}/view`, { method: 'POST' });
  } catch (error) {
    console.error('❌ Error marking hotdeck as viewed:', error);
    throw error;
  }
};

/**
 * Track property activity (view, like, love)
 * Note: This would need to be added to the API if activity tracking is implemented
 * @param {string} deckId - The ID of the hotdeck
 * @param {string} propertyId - The ID of the property
 * @param {string} action - The action ('viewed', 'liked', 'loved')
 * @returns {Promise<void>}
 */
export const trackPropertyActivity = async (deckId, propertyId, action) => {
  try {
    // This is a placeholder - the API would need an endpoint for this
    console.log(`✅ Tracked property activity: ${action} on ${propertyId} in deck ${deckId}`);
    // In the future: await apiRequest(`/hot-decks/${deckId}/properties/${propertyId}/activity`, { 
    //   method: 'POST',
    //   body: JSON.stringify({ action })
    // });
  } catch (error) {
    console.error('❌ Error tracking property activity:', error);
    throw error;
  }
};
