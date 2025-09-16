export const formatPrice = (price) => {
  // Check if price is undefined or null
  if (price === undefined || price === null) {
    return "$0";
  }
  
  return `$${price.toLocaleString()}`;
}; 