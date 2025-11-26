import { db, auth } from '../config/firebase';
import { collection, addDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';

/**
 * Service for handling integration requests
 * Manages requests for new state/city integrations
 */

/**
 * Submit an integration request for a new location
 * @param {string} city - City name
 * @param {string} state - State name
 * @param {string} stateAbbr - State abbreviation (e.g., 'CA', 'TX')
 * @param {Object} userInfo - Additional user information (credentials, preferences, etc.)
 * @returns {Promise<string>} - Document ID of the created request
 */
export const submitIntegrationRequest = async (city, state, stateAbbr, userInfo = {}) => {
  try {
    const userId = auth.currentUser?.uid || null;
    const userEmail = auth.currentUser?.email || userInfo.credentials?.email || '';

    // Check if this user/email already requested this location
    if (userId || userEmail) {
      const existingRequest = await checkExistingRequest(userId, userEmail, city, state);
      
      if (existingRequest) {
        console.log('User already requested this location');
        return existingRequest.id;
      }
    }

    // Create the integration request document (ALL PascalCase)
    const requestData = {
      UserId: userId,
      City: city,
      State: state,
      StateAbbr: stateAbbr,
      UserEmail: userEmail,
      
      // User info from onboarding (PascalCase)
      Credentials: userInfo.credentials || null,
      Preferences: userInfo.preferences || [],
      Timeframe: userInfo.timeframe || null,
      HasAgent: userInfo.hasAgent || null,
      AgentName: userInfo.agentName || null,
      
      // Request metadata (PascalCase)
      Status: 'Pending', // Pending, InProgress, Completed, Rejected
      RequestedAt: Timestamp.now(),
      CreatedAt: Timestamp.now(),
      
      // Tracking (PascalCase)
      Priority: 'Normal', // Normal, High, Critical
      Notes: '',
    };

    // Add to IntegrationRequests collection
    const requestsRef = collection(db, 'IntegrationRequests');
    const docRef = await addDoc(requestsRef, requestData);
    
    console.log('Integration request submitted:', docRef.id);
    
    return docRef.id;
  } catch (error) {
    console.error('Error submitting integration request:', error);
    throw error;
  }
};

/**
 * Check if user already submitted a request for this location
 * @param {string|null} userId - User ID (can be null for unauthenticated)
 * @param {string} userEmail - User email
 * @param {string} city - City name
 * @param {string} state - State name
 * @returns {Promise<Object|null>} - Existing request or null
 */
const checkExistingRequest = async (userId, userEmail, city, state) => {
  try {
    const requestsRef = collection(db, 'IntegrationRequests');
    
    // Query by userId if available, otherwise by email
    const q = userId 
      ? query(
          requestsRef,
          where('UserId', '==', userId),
          where('City', '==', city),
          where('State', '==', state)
        )
      : query(
          requestsRef,
          where('UserEmail', '==', userEmail),
          where('City', '==', city),
          where('State', '==', state)
        );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking existing request:', error);
    return null;
  }
};

/**
 * Check if a state is currently integrated
 * @param {string} stateAbbr - State abbreviation
 * @returns {boolean} - True if integrated
 */
export const isStateIntegrated = (stateAbbr) => {
  // Currently only Mississippi is integrated
  const integratedStates = ['MS'];
  return integratedStates.includes(stateAbbr?.toUpperCase());
};

/**
 * Get all integration requests for the current user
 * @returns {Promise<Array>} - Array of integration requests
 */
export const getUserIntegrationRequests = async () => {
  try {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      return [];
    }

    const requestsRef = collection(db, 'IntegrationRequests');
    const q = query(requestsRef, where('UserId', '==', userId));
    
    const querySnapshot = await getDocs(q);
    
    const requests = [];
    querySnapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() });
    });
    
    return requests;
  } catch (error) {
    console.error('Error getting user integration requests:', error);
    return [];
  }
};

