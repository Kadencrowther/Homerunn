/**
 * Property Helper Utilities
 * 
 * Utility functions for handling property data, including ID sanitization
 * for Firestore compatibility and other property-related operations.
 */

/**
 * Sanitize property ID to be safe for Firestore field paths
 * 
 * Firestore field paths cannot contain: ~, *, /, [, ], (, ), '
 * This function extracts clean IDs from URLs or sanitizes any format.
 * 
 * @param {string} propertyId - The raw property ID (may contain URL or special chars)
 * @returns {string} - Sanitized property ID safe for Firestore field paths
 * 
 * @example
 * // URL format from MLS API
 * sanitizePropertyId("https://api.bridgedataoutput.com/api/v2/OData/united/Property('abc123')")
 * // Returns: "abc123"
 * 
 * @example
 * // Already clean ID
 * sanitizePropertyId("property-123-xyz")
 * // Returns: "property-123-xyz"
 * 
 * @example
 * // ID with special characters
 * sanitizePropertyId("prop/123[test]")
 * // Returns: "prop_123_test_"
 */
export const sanitizePropertyId = (propertyId) => {
  if (!propertyId) {
    console.warn('sanitizePropertyId: No property ID provided, using default');
    return 'unknown';
  }
  
  // Convert to string if not already
  const idString = String(propertyId);
  
  // If it's a URL with Property('...') format, extract just the hash
  if (idString.includes('Property(')) {
    const match = idString.match(/Property\('([^']+)'\)/);
    if (match && match[1]) {
      return match[1]; // Return just the hash portion
    }
  }
  
  // Otherwise, replace all invalid Firestore characters with underscores
  const sanitized = idString
    .replace(/[~*\/\[\]()'"]/g, '_')      // Replace forbidden chars
    .replace(/[^a-zA-Z0-9_-]/g, '_')      // Replace any other special chars
    .replace(/_+/g, '_')                   // Collapse multiple underscores
    .replace(/^_|_$/g, '')                 // Remove leading/trailing underscores
    .substring(0, 100);                    // Limit length for Firestore (max 1500, being safe)
  
  return sanitized || 'unknown';
};

/**
 * Extract the original property ID from a sanitized ID (if stored in data)
 * Use this when you need to reverse the sanitization process.
 * 
 * @param {Object} propertyActivity - The property activity object from Firestore
 * @returns {string} - The original property ID if stored, otherwise the key
 * 
 * @example
 * const activity = hotdeck.ClientActivity.PropertyActivity["abc123"];
 * const originalId = getOriginalPropertyId(activity);
 * // Returns: "https://api.bridgedataoutput.com/api/v2/OData/united/Property('abc123')"
 */
export const getOriginalPropertyId = (propertyActivity) => {
  if (!propertyActivity) return null;
  return propertyActivity.OriginalId || null;
};

/**
 * Find property activity by original (unsanitized) ID
 * Useful when you have the full URL and need to look up the activity
 * 
 * @param {Object} propertyActivityMap - The PropertyActivity map from ClientActivity
 * @param {string} originalId - The original (possibly unsanitized) property ID
 * @returns {Object|null} - The property activity object or null if not found
 * 
 * @example
 * const activity = findActivityByOriginalId(
 *   hotdeck.ClientActivity.PropertyActivity,
 *   "https://api.bridgedataoutput.com/api/v2/OData/united/Property('abc123')"
 * );
 */
export const findActivityByOriginalId = (propertyActivityMap, originalId) => {
  if (!propertyActivityMap || !originalId) return null;
  
  // First try with sanitized version (fast lookup)
  const sanitizedId = sanitizePropertyId(originalId);
  if (propertyActivityMap[sanitizedId]) {
    return propertyActivityMap[sanitizedId];
  }
  
  // If not found, search through all activities for matching OriginalId (slower)
  return Object.values(propertyActivityMap).find(
    activity => activity.OriginalId === originalId
  ) || null;
};

/**
 * Check if a property ID needs sanitization
 * Useful for debugging or validation
 * 
 * @param {string} propertyId - The property ID to check
 * @returns {boolean} - True if the ID contains characters that need sanitization
 * 
 * @example
 * needsSanitization("property-123") // false
 * needsSanitization("https://api.../Property('abc')") // true
 */
export const needsSanitization = (propertyId) => {
  if (!propertyId) return false;
  const idString = String(propertyId);
  return /[~*\/\[\]()'"]/.test(idString);
};

/**
 * Validate that a property ID is safe for Firestore
 * 
 * @param {string} propertyId - The property ID to validate
 * @returns {boolean} - True if safe for Firestore field paths
 */
export const isValidFirestoreKey = (propertyId) => {
  if (!propertyId) return false;
  const idString = String(propertyId);
  
  // Check for forbidden characters
  if (/[~*\/\[\]()'"]/.test(idString)) return false;
  
  // Check length (Firestore max is 1500 bytes, we use 100 for safety)
  if (idString.length > 100) return false;
  
  // Check it's not empty after trimming
  if (idString.trim().length === 0) return false;
  
  return true;
};

