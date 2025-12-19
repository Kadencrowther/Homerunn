import { auth, db } from '../config/firebase';
import { doc, updateDoc, increment, serverTimestamp, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { sanitizePropertyId } from '../utils/propertyHelpers';

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

/**
 * Get the initial ClientActivity structure for a new hotdeck
 * Use this when creating a new hotdeck to initialize tracking
 * @returns {Object} - Initial ClientActivity structure
 */
export const getInitialClientActivity = () => {
  return {
    TotalViewed: 0,
    TotalSwipes: 0,
    LeftSwipes: 0,
    RightSwipes: 0,
    UpSwipes: 0,
    LastActivityAt: null
  };
};

/**
 * Track when a property is viewed in a hotdeck (appears as top card)
 * Only updates the summary count in the main hotdeck document
 * @param {string} userId - The client user ID
 * @param {string} agentId - The agent's ID
 * @param {string} deckId - The hotdeck ID
 * @param {string} propertyId - The property ID that was viewed
 * @returns {Promise<void>}
 */
export const trackHotdeckPropertyView = async (userId, agentId, deckId, propertyId) => {
  try {
    if (!userId || !agentId || !deckId || !propertyId) {
      console.error('Missing required parameters for trackHotdeckPropertyView');
      return;
    }

    const deckRef = doc(db, 'AgentUsers', agentId, 'HotDecks', deckId);
    
    // Check if document exists first
    const deckDoc = await getDoc(deckRef);
    if (!deckDoc.exists()) {
      console.error('Hotdeck document does not exist');
      return;
    }

    // Only update summary counts in main document
    const updates = {
      'ClientActivity.TotalViewed': increment(1),
      'ClientActivity.LastActivityAt': serverTimestamp(),
      LastViewedAt: serverTimestamp()
    };
    
    await updateDoc(deckRef, updates);
    console.log(`✅ Tracked view for property ${propertyId} in hotdeck ${deckId}`);
  } catch (error) {
    console.error('❌ Error tracking hotdeck property view:', error);
    // Don't throw - tracking shouldn't break the UI
  }
};

/**
 * Track when a property is swiped in a hotdeck
 * Updates summary counts in main document AND stores full details in subcollections
 * @param {string} userId - The client user ID
 * @param {string} agentId - The agent's ID
 * @param {string} deckId - The hotdeck ID
 * @param {string} propertyId - The property ID that was swiped
 * @param {string} direction - Swipe direction: 'left', 'right', or 'top'
 * @param {Object} propertyDetails - Optional: full property details to store
 * @returns {Promise<void>}
 */
export const trackHotdeckSwipe = async (userId, agentId, deckId, propertyId, direction, propertyDetails = null) => {
  try {
    if (!userId || !agentId || !deckId || !propertyId || !direction) {
      console.error('Missing required parameters for trackHotdeckSwipe');
      return;
    }

    // Sanitize property ID for subcollection document ID
    const sanitizedId = sanitizePropertyId(propertyId);

    // 1. Update summary counts in the main hotdeck document
    const deckRef = doc(db, 'AgentUsers', agentId, 'HotDecks', deckId);
    
    const hotdeckUpdates = {
      'ClientActivity.TotalSwipes': increment(1),
      'ClientActivity.LastActivityAt': serverTimestamp()
    };
    
    // Increment direction-specific counter
    if (direction === 'left') {
      hotdeckUpdates['ClientActivity.LeftSwipes'] = increment(1);
    } else if (direction === 'right') {
      hotdeckUpdates['ClientActivity.RightSwipes'] = increment(1);
    } else if (direction === 'top') {
      hotdeckUpdates['ClientActivity.UpSwipes'] = increment(1);
    }
    
    await updateDoc(deckRef, hotdeckUpdates);
    console.log(`✅ Updated summary counts: ${direction} swipe in hotdeck ${deckId}`);
    
    // 2. Store full property details in appropriate subcollection
    let subcollectionName;
    if (direction === 'left') {
      subcollectionName = 'DislikedProperties';
    } else if (direction === 'right') {
      subcollectionName = 'LikedProperties';
    } else if (direction === 'top') {
      subcollectionName = 'LovedProperties';
    }
    
    if (subcollectionName) {
      const propertyRef = doc(db, 'AgentUsers', agentId, 'HotDecks', deckId, subcollectionName, sanitizedId);
      
      const propertyData = {
        PropertyId: sanitizedId,
        OriginalId: propertyId,
        SwipedAt: serverTimestamp(),
        ClientId: userId
      };
      
      // Add property details if provided (for quick display without additional API calls)
      if (propertyDetails) {
        propertyData.Address = propertyDetails.address || '';
        propertyData.Price = propertyDetails.price || 0;
        propertyData.Beds = propertyDetails.beds || 0;
        propertyData.Baths = propertyDetails.baths || 0;
        propertyData.Sqft = propertyDetails.sqft || 0;
        propertyData.Images = propertyDetails.images ? propertyDetails.images.slice(0, 3) : []; // Store up to 3 image URLs
        propertyData.ListingStatus = propertyDetails.listingStatus || 'Active';
      }
      
      await setDoc(propertyRef, propertyData);
      console.log(`✅ Stored property details in ${subcollectionName}/${sanitizedId}`);
    }
    
    // 3. Update user's global SwipeCount
    const swipeCountRef = doc(db, 'Users', userId, 'SwipeCount', 'Current');
    const swipeCountDoc = await getDoc(swipeCountRef);
    
    let swipeCount = {};
    if (swipeCountDoc.exists()) {
      swipeCount = swipeCountDoc.data();
    } else {
      swipeCount = {
        LeftSwipes: 0,
        RightSwipes: 0,
        UpSwipes: 0,
        TotalSwipes: 0,
        HomeSwipes: 0,
        HotdeckSwipes: 0,
        LastUpdated: new Date()
      };
    }
    
    // Update counts
    if (direction === 'left') {
      swipeCount.LeftSwipes = (swipeCount.LeftSwipes || 0) + 1;
    } else if (direction === 'right') {
      swipeCount.RightSwipes = (swipeCount.RightSwipes || 0) + 1;
    } else if (direction === 'top') {
      swipeCount.UpSwipes = (swipeCount.UpSwipes || 0) + 1;
    }
    
    swipeCount.TotalSwipes = (swipeCount.TotalSwipes || 0) + 1;
    swipeCount.HotdeckSwipes = (swipeCount.HotdeckSwipes || 0) + 1;
    swipeCount.LastUpdated = new Date();
    
    await setDoc(swipeCountRef, swipeCount);
    console.log(`✅ Updated global swipe count: ${swipeCount.TotalSwipes} total (${swipeCount.HotdeckSwipes} from hotdecks)`);
    
    // 4. Optionally update UserMatchMetric if we have property metric
    if (propertyDetails && propertyDetails.propertyMatchMetric) {
      try {
        const { updateUserMatchMetric } = require('../utils/UserMatchMetric');
        await updateUserMatchMetric(userId, propertyId, propertyDetails.propertyMatchMetric, direction);
        console.log(`✅ Updated user match metric for hotdeck swipe`);
      } catch (metricError) {
        console.error('❌ Error updating user match metric:', metricError);
        // Continue - match metric update is optional
      }
    }
    
  } catch (error) {
    console.error('❌ Error tracking hotdeck swipe:', error);
    // Don't throw - tracking shouldn't break the UI
  }
};

/**
 * Get all liked properties from a hotdeck
 * @param {string} agentId - The agent's ID
 * @param {string} deckId - The hotdeck ID
 * @param {number} limitCount - Optional: limit results (default: all)
 * @returns {Promise<Array>} - Array of liked properties
 */
export const getHotdeckLikedProperties = async (agentId, deckId, limitCount = null) => {
  try {
    const likedRef = collection(db, 'AgentUsers', agentId, 'HotDecks', deckId, 'LikedProperties');
    const likedQuery = limitCount 
      ? query(likedRef, orderBy('SwipedAt', 'desc'), limit(limitCount))
      : query(likedRef, orderBy('SwipedAt', 'desc'));
    
    const snapshot = await getDocs(likedQuery);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`✅ Retrieved ${properties.length} liked properties from hotdeck ${deckId}`);
    return properties;
  } catch (error) {
    console.error('❌ Error getting liked properties:', error);
    return [];
  }
};

/**
 * Get all loved properties from a hotdeck
 * @param {string} agentId - The agent's ID
 * @param {string} deckId - The hotdeck ID
 * @param {number} limitCount - Optional: limit results (default: all)
 * @returns {Promise<Array>} - Array of loved properties
 */
export const getHotdeckLovedProperties = async (agentId, deckId, limitCount = null) => {
  try {
    const lovedRef = collection(db, 'AgentUsers', agentId, 'HotDecks', deckId, 'LovedProperties');
    const lovedQuery = limitCount 
      ? query(lovedRef, orderBy('SwipedAt', 'desc'), limit(limitCount))
      : query(lovedRef, orderBy('SwipedAt', 'desc'));
    
    const snapshot = await getDocs(lovedQuery);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`✅ Retrieved ${properties.length} loved properties from hotdeck ${deckId}`);
    return properties;
  } catch (error) {
    console.error('❌ Error getting loved properties:', error);
    return [];
  }
};

/**
 * Get all disliked properties from a hotdeck
 * @param {string} agentId - The agent's ID
 * @param {string} deckId - The hotdeck ID
 * @param {number} limitCount - Optional: limit results (default: all)
 * @returns {Promise<Array>} - Array of disliked properties
 */
export const getHotdeckDislikedProperties = async (agentId, deckId, limitCount = null) => {
  try {
    const dislikedRef = collection(db, 'AgentUsers', agentId, 'HotDecks', deckId, 'DislikedProperties');
    const dislikedQuery = limitCount 
      ? query(dislikedRef, orderBy('SwipedAt', 'desc'), limit(limitCount))
      : query(dislikedRef, orderBy('SwipedAt', 'desc'));
    
    const snapshot = await getDocs(dislikedQuery);
    const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    console.log(`✅ Retrieved ${properties.length} disliked properties from hotdeck ${deckId}`);
    return properties;
  } catch (error) {
    console.error('❌ Error getting disliked properties:', error);
    return [];
  }
};

