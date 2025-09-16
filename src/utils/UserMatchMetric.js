/**
 * UserMatchMetric.js
 * 
 * This utility manages user property match metrics based on their swipe actions.
 * It tracks which property attributes users prefer and calculates match scores
 * between users and properties.
 */

import { auth, db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Initialize a new user's match metric
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The initialized user match metric
 */
export async function initializeUserMatchMetric(userId) {
  try {
    // Create initial digit preferences (15 positions)
    const digitPreferences = Array(15).fill().map(() => ({}));
    
    // Default metric (all zeros)
    const defaultMetric = "000000000000000";
    
    // Create the user match metric object with PascalCase for database fields
    const metricData = {
      CurrentMetric: defaultMetric,
      DigitPreferences: digitPreferences,
      DislikedProperties: [],
      LikedProperties: [],
      LovedProperties: []
    };
    
    // Save to Firestore
    const metricDocRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
    await setDoc(metricDocRef, metricData);
    
    // Return in camelCase for client-side use
    return {
      currentMetric: defaultMetric,
      digitPreferences: digitPreferences,
      dislikedProperties: [],
      likedProperties: [],
      lovedProperties: []
    };
  } catch (error) {
    console.error('Error initializing user match metric:', error);
    throw error;
  }
}

/**
 * Get a user's match metric data
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The user's match metric data
 */
export const getUserMatchMetric = async (userId) => {
  try {
    // Check if the user document exists first
    const userDocRef = doc(db, 'Users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.log('User document does not exist, creating default match metric');
      // Create the user document
      await setDoc(userDocRef, { HasMatchMetric: true }, { merge: true });
      // Initialize and return a new match metric
      return initializeUserMatchMetric(userId);
    }
    
    // Try to get the existing metric
    const metricDocRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
    const metricDoc = await getDoc(metricDocRef);
    
    if (!metricDoc.exists()) {
      console.log('UserMatchMetric does not exist, creating default');
      // Initialize and return a new match metric
      return initializeUserMatchMetric(userId);
    }
    
    const metricData = metricDoc.data();
    
    // Check if the metric data has the new format
    if (!metricData.DigitPreferences && !metricData.digitPreferences) {
      console.log('Converting old metric format to new format');
      // Convert old format to new format with PascalCase for database
      const newMetricData = {
        CurrentMetric: "000000000000000", // Default metric
        DigitPreferences: Array(15).fill().map(() => ({})),
        DislikedProperties: metricData.DislikedProperties || metricData.dislikedProperties || [],
        LikedProperties: metricData.LikedProperties || metricData.likedProperties || [],
        LovedProperties: []
      };
      
      // Save the converted metric
      await setDoc(metricDocRef, newMetricData);
      
      // Return in camelCase for client-side use
      return {
        currentMetric: newMetricData.CurrentMetric,
        digitPreferences: newMetricData.DigitPreferences,
        dislikedProperties: newMetricData.DislikedProperties,
        likedProperties: newMetricData.LikedProperties,
        lovedProperties: newMetricData.LovedProperties
      };
    }
    
    // Convert from PascalCase in database to camelCase for client-side use
    return {
      currentMetric: metricData.CurrentMetric || metricData.currentMetric,
      digitPreferences: metricData.DigitPreferences || metricData.digitPreferences,
      dislikedProperties: metricData.DislikedProperties || metricData.dislikedProperties || [],
      likedProperties: metricData.LikedProperties || metricData.likedProperties || [],
      lovedProperties: metricData.LovedProperties || metricData.lovedProperties || [],
      globalSwipeCount: metricData.GlobalSwipeCount || metricData.globalSwipeCount
    };
  } catch (error) {
    console.error('Error getting user match metric:', error);
    // Return a default metric if there's an error
    return {
      currentMetric: "000000000000000",
      digitPreferences: Array(15).fill().map(() => ({})),
      dislikedProperties: [],
      likedProperties: [],
      lovedProperties: []
    };
  }
};

/**
 * Update a user's match metric based on a swipe action
 * @param {string} userId - The user's ID
 * @param {string} propertyId - The property's ID
 * @param {string} propertyMetric - The property's match metric
 * @param {string} swipeDirection - The swipe direction ('left', 'right', or 'top')
 * @returns {Promise<Object>} - The updated user match metric data
 */
export const updateUserMatchMetric = async (userId, propertyId, propertyMetric, swipeDirection) => {
  try {
    if (!userId || !propertyId) {
      console.error('Missing userId or propertyId in updateUserMatchMetric');
      return null;
    }

    // Get the current user match metric
    const userMatchMetricRef = doc(db, 'Users', userId, 'UserMatchMetric', 'Current');
    const userMatchMetricDoc = await getDoc(userMatchMetricRef);
    
    // Get or initialize the swipe count
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
        LastUpdated: new Date()
      };
    }
    
    // Update the appropriate swipe counter
    if (swipeDirection === 'left') {
      swipeCount.LeftSwipes = (swipeCount.LeftSwipes || 0) + 1;
    } else if (swipeDirection === 'right') {
      swipeCount.RightSwipes = (swipeCount.RightSwipes || 0) + 1;
    } else if (swipeDirection === 'top') {
      swipeCount.UpSwipes = (swipeCount.UpSwipes || 0) + 1;
    }
    
    // Increment the total swipes counter
    swipeCount.TotalSwipes = (swipeCount.TotalSwipes || 0) + 1;
    swipeCount.LastUpdated = new Date();
    
    // Save the updated swipe count
    await setDoc(swipeCountRef, swipeCount);
    
    // Get current user metric or create default if it doesn't exist
    let userMetric = await getUserMatchMetric(userId);
    
    // Ensure digitPreferences exists and has 15 positions
    if (!userMetric.digitPreferences || userMetric.digitPreferences.length !== 15) {
      userMetric.digitPreferences = Array(15).fill().map(() => ({}));
    }
    
    // Ensure property lists exist
    userMetric.dislikedProperties = userMetric.dislikedProperties || [];
    userMetric.likedProperties = userMetric.likedProperties || [];
    userMetric.lovedProperties = userMetric.lovedProperties || [];
    
    // Update property lists based on swipe direction
    if (swipeDirection === 'left') {
      // For disliked properties, store the swipe count when it was disliked
      const dislikedEntry = {
        id: propertyId,
        dislikedAtSwipeCount: swipeCount.TotalSwipes
      };
      
      // Remove from all lists first to avoid duplicates
      userMetric.dislikedProperties = userMetric.dislikedProperties.filter(item => 
        typeof item === 'string' ? item !== propertyId : item.id !== propertyId
      );
      userMetric.likedProperties = userMetric.likedProperties.filter(id => id !== propertyId);
      userMetric.lovedProperties = userMetric.lovedProperties.filter(id => id !== propertyId);
      
      // Add to disliked properties
      userMetric.dislikedProperties.push(dislikedEntry);
    } 
    else if (swipeDirection === 'right') {
      // Remove from all lists first to avoid duplicates
      userMetric.dislikedProperties = userMetric.dislikedProperties.filter(item => 
        typeof item === 'string' ? item !== propertyId : item.id !== propertyId
      );
      userMetric.likedProperties = userMetric.likedProperties.filter(id => id !== propertyId);
      userMetric.lovedProperties = userMetric.lovedProperties.filter(id => id !== propertyId);
      
      // Add to liked properties (at the end, which is most recent)
      userMetric.likedProperties.push(propertyId);
    }
    else if (swipeDirection === 'top') {
      // Remove from all lists first to avoid duplicates
      userMetric.dislikedProperties = userMetric.dislikedProperties.filter(item => 
        typeof item === 'string' ? item !== propertyId : item.id !== propertyId
      );
      userMetric.likedProperties = userMetric.likedProperties.filter(id => id !== propertyId);
      userMetric.lovedProperties = userMetric.lovedProperties.filter(id => id !== propertyId);
      
      // Add to loved properties (at the end, which is most recent)
      userMetric.lovedProperties.push(propertyId);
    }
    
    // Update digit preferences based on property metric and swipe direction
    if (propertyMetric && propertyMetric.length === 15) {
      for (let i = 0; i < 15; i++) {
        const digitValue = propertyMetric[i];
        
        // Initialize the counter for this digit value if it doesn't exist
        if (!userMetric.digitPreferences[i][digitValue]) {
          userMetric.digitPreferences[i][digitValue] = 0;
        }
        
        // Update the counter based on swipe direction
        if (swipeDirection === 'left') {
          // Dislike: subtract 1 point (minimum 0)
          userMetric.digitPreferences[i][digitValue] = Math.max(0, userMetric.digitPreferences[i][digitValue] - 1);
        } 
        else if (swipeDirection === 'right') {
          // Like: add 1 point
          userMetric.digitPreferences[i][digitValue] += 1;
        }
        else if (swipeDirection === 'top') {
          // Love: add 3 points
          userMetric.digitPreferences[i][digitValue] += 3;
        }
      }
      
      // Recalculate the current metric based on highest scores
      let newMetric = "";
      for (let i = 0; i < 15; i++) {
        const preferences = userMetric.digitPreferences[i];
        let highestScore = -1;
        let preferredValue = "0"; // Default if no preferences
        
        // Find the value with the highest score for this digit position
        for (const [value, score] of Object.entries(preferences)) {
          if (score > highestScore) {
            highestScore = score;
            preferredValue = value;
          }
        }
        
        // If all scores are 0 or negative, keep the previous value or use a default
        if (highestScore <= 0) {
          // If we have a previous metric, use that value
          if (userMetric.currentMetric && userMetric.currentMetric.length === 15) {
            preferredValue = userMetric.currentMetric[i];
          }
          // Otherwise use the property's value (even if disliked, it's better than nothing)
          else if (propertyMetric && propertyMetric.length === 15) {
            preferredValue = propertyMetric[i];
          }
        }
        
        newMetric += preferredValue;
      }
      
      // Update the current metric
      userMetric.currentMetric = newMetric;
      
      console.log(`Updated user match metric: ${newMetric}`);
      console.log(`Digit preferences sample (position 0): ${JSON.stringify(userMetric.digitPreferences[0])}`);
    }
    
    // Convert to PascalCase for database storage
    const dbMetricData = {
      CurrentMetric: userMetric.currentMetric,
      DigitPreferences: userMetric.digitPreferences,
      DislikedProperties: userMetric.dislikedProperties,
      LikedProperties: userMetric.likedProperties,
      LovedProperties: userMetric.lovedProperties,
      GlobalSwipeCount: swipeCount.TotalSwipes,
      LastUpdated: new Date()
    };
    
    // Save the updated metric
    await setDoc(userMatchMetricRef, dbMetricData);
    
    // Return in camelCase for client-side use
    return {
      currentMetric: userMetric.currentMetric,
      digitPreferences: userMetric.digitPreferences,
      dislikedProperties: userMetric.dislikedProperties,
      likedProperties: userMetric.likedProperties,
      lovedProperties: userMetric.lovedProperties,
      globalSwipeCount: swipeCount.TotalSwipes
    };
  } catch (error) {
    console.error('Error updating user match metric:', error);
    return null;
  }
};

/**
 * Calculate the match score between a user's metric and a property metric
 * @param {string} userMetric - The user's match metric
 * @param {string} propertyMetric - The property's match metric
 * @returns {number} - The match score (higher is better)
 */
export function calculateMatchScore(userMetric, propertyMetric) {
  if (!userMetric || !propertyMetric || userMetric.length !== 15 || propertyMetric.length !== 15) {
    return 0;
  }
  
  let score = 0;
  
  // Score each digit position based on how close the values are
  for (let i = 0; i < 15; i++) {
    // Get the character codes for comparison
    const userVal = userMetric[i].charCodeAt(0);
    const propVal = propertyMetric[i].charCodeAt(0);
    
    // Calculate the difference between the values
    const diff = Math.abs(userVal - propVal);
    
    // Assign points based on the difference
    if (diff === 0) {
      // Exact match
      score += 10;
    } else if (diff === 1) {
      // One value away (above or below)
      score += 5;
    } else if (diff === 2) {
      // Two values away (above or below)
      score += 3;
    }
    // Values more than 2 away get 0 points
  }
  
  return score;
}

/**
 * Sort properties based on their match score with the user's metric
 * @param {string} userMetric - The user's match metric
 * @param {Array} properties - The array of properties to sort
 * @returns {Array} - The sorted array of properties
 */
export function sortPropertiesByMatchScore(userMetric, properties) {
  return [...properties].sort((a, b) => {
    const scoreA = calculateMatchScore(userMetric, a.propertyMatchMetric);
    const scoreB = calculateMatchScore(userMetric, b.propertyMatchMetric);
    return scoreB - scoreA; // Sort in descending order (higher scores first)
  });
}

/**
 * Filter out properties that the user has disliked
 * @param {Array} properties - The array of properties to filter
 * @param {Object} dislikedProperties - Object containing disliked property IDs as keys
 * @param {number} blockDuration - Duration in milliseconds to block disliked properties (default: 7 days)
 * @returns {Array} - The filtered array of properties
 */
export function filterDislikedProperties(properties, dislikedProperties, blockDuration = 7 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  
  return properties.filter(property => {
    // Check if the property is in the disliked list
    const dislikedTimestamp = dislikedProperties[property.id];
    
    // If not disliked or the block duration has passed, include the property
    return !dislikedTimestamp || (now - dislikedTimestamp > blockDuration);
  });
}

/**
 * Get a list of properties the user has loved (swiped up on)
 * @param {Array} properties - The array of all properties
 * @param {Object} lovedProperties - Object containing loved property IDs as keys
 * @returns {Array} - The array of loved properties
 */
export function getLovedProperties(properties, lovedProperties) {
  return properties.filter(property => lovedProperties[property.id]);
}

/**
 * Process properties for a user: filter disliked properties and sort by match score
 * @param {string} userMetric - The user's match metric
 * @param {Array} properties - The array of properties to process
 * @param {Array} dislikedProperties - Array of disliked property IDs
 * @param {boolean} respectStableCards - Whether to respect stable cards
 * @param {number} cooldownSwipes - Cooldown period in swipes
 * @returns {Array} - The processed array of properties
 */
export function processPropertiesForUser(userMetric, properties, dislikedProperties = [], respectStableCards = true, cooldownSwipes = 50) {
  console.log(`Processing ${properties.length} properties based on user metric: ${userMetric}`);
  
  // Filter out disliked properties with cooldown if applicable
  let filteredProperties = properties.filter(property => {
    // IMPORTANT: Always include properties with the bypass filtering flag
    if (property.bypassFiltering || property.forceDisplay || property.isRedoCard) {
      console.log(`Including property ${property.address || property.id} because it has bypass filtering flag`);
      return true;
    }
    
    // Check if the property is in the disliked list
    const dislikedEntry = dislikedProperties.find(item => 
      typeof item === 'string' ? item === property.id : item.id === property.id
    );
    
    // If not disliked, include the property
    if (!dislikedEntry) return true;
    
    // If it's a string (old format), exclude it
    if (typeof dislikedEntry === 'string') {
      return false;
    }
    
    // Check if the cooldown period has passed
    const swipesSinceDisliked = dislikedEntry.globalSwipeCount - dislikedEntry.dislikedAtSwipeCount;
    const inCooldown = swipesSinceDisliked < cooldownSwipes;
    
    // Include the property only if the cooldown period has passed
    return !inCooldown;
  });
  
  // If we need to respect stable cards (currently visible in the deck)
  if (respectStableCards) {
    // We don't sort the properties here - the calling code will handle this
    // by only reordering cards beyond the visible deck
    return filteredProperties;
  }
  
  // Otherwise, sort all properties by match score (highest first)
  const sortedProperties = filteredProperties.sort((a, b) => {
    const scoreA = calculateMatchScore(userMetric, a.propertyMatchMetric);
    const scoreB = calculateMatchScore(userMetric, b.propertyMatchMetric);
    
    // Add match scores to properties for debugging
    a.matchScore = scoreA;
    b.matchScore = scoreB;
    
    return scoreB - scoreA;
  });
  
  // Log score distribution
  const scoreGroups = {};
  sortedProperties.forEach(prop => {
    const score = prop.matchScore || calculateMatchScore(userMetric, prop.propertyMatchMetric);
    if (!scoreGroups[score]) scoreGroups[score] = 0;
    scoreGroups[score]++;
  });
  
  console.log('Match score distribution:');
  Object.entries(scoreGroups)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .forEach(([score, count]) => {
      console.log(`  Score ${score}: ${count} properties`);
    });
  
  return sortedProperties;
}

// Add this function to get the user's swipe count
export const getUserSwipeCount = async (userId) => {
  try {
    if (!userId) {
      console.error('No user ID provided to getUserSwipeCount');
      return null;
    }
    
    const swipeCountRef = doc(db, 'Users', userId, 'SwipeCount', 'Current');
    const swipeCountDoc = await getDoc(swipeCountRef);
    
    if (swipeCountDoc.exists()) {
      return swipeCountDoc.data();
    } else {
      // Initialize swipe count if it doesn't exist
      const initialSwipeCount = {
        LeftSwipes: 0,
        RightSwipes: 0,
        UpSwipes: 0,
        TotalSwipes: 0,
        LastUpdated: new Date()
      };
      
      // Create the SwipeCount document
      await setDoc(swipeCountRef, initialSwipeCount);
      console.log('Created initial swipe count for user:', userId);
      
      return initialSwipeCount;
    }
  } catch (error) {
    console.error('Error getting user swipe count:', error);
    return null;
  }
}; 