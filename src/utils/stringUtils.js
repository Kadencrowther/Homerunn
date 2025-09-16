/**
 * Converts a string to PascalCase format
 * @param {string} str - The string to convert
 * @returns {string} The PascalCase formatted string
 */
export const toPascalCase = (str) => {
  if (!str) return '';
  
  // Remove any non-alphanumeric characters and split the string by spaces or special characters
  return str
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
};

/**
 * Converts a string from PascalCase to camelCase
 * @param {string} str - The PascalCase string to convert
 * @returns {string} The camelCase formatted string
 */
export const pascalToCamelCase = (str) => {
  if (!str) return '';
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/**
 * Converts an object with PascalCase keys to camelCase keys
 * @param {Object} obj - The object with PascalCase keys
 * @returns {Object} A new object with camelCase keys
 */
export const convertObjectKeysToCamelCase = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return obj;
  
  const result = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    const camelKey = pascalToCamelCase(key);
    result[camelKey] = value;
  });
  
  return result;
}; 