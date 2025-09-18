/**
 * PropertyMatchMetric.js
 * 
 * This utility calculates a property match metric score based on various property attributes.
 * The score is a multi-digit string where each digit represents a specific property attribute category.
 * 
 * The metric can be used for:
 * - Property comparison and filtering
 * - Matching user preferences with available listings
 * - Data analysis and machine learning applications
 */

/**
 * Generates a PropertyMatchMetric score for a given property listing
 * @param {Object} listing - The property listing object from the MLS API
 * @returns {String} - A multi-digit string representing the property's attributes
 */
export function getPropertyMatchMetric(listing) {
  if (!listing) return '000000000000000';

  // 1) Price range
  let priceDigit;
  const price = listing.price || 0;
  if (price < 100000) priceDigit = '1';
  else if (price < 200000) priceDigit = '2';
  else if (price < 300000) priceDigit = '3';
  else if (price < 400000) priceDigit = '4';
  else if (price < 500000) priceDigit = '5';
  else if (price < 600000) priceDigit = '6';
  else if (price < 700000) priceDigit = '7';
  else if (price < 800000) priceDigit = '8';
  else if (price < 900000) priceDigit = '9';
  else if (price < 1000000) priceDigit = 'A'; // $900K-$1M
  else if (price < 1100000) priceDigit = 'B'; // $1M-$1.1M
  else if (price < 1200000) priceDigit = 'C'; // $1.1M-$1.2M
  else if (price < 1300000) priceDigit = 'D'; // $1.2M-$1.3M
  else if (price < 1400000) priceDigit = 'E'; // $1.3M-$1.4M
  else if (price < 1500000) priceDigit = 'F'; // $1.4M-$1.5M
  else if (price < 1600000) priceDigit = 'G'; // $1.5M-$1.6M
  else if (price < 1700000) priceDigit = 'H'; // $1.6M-$1.7M
  else if (price < 1800000) priceDigit = 'I'; // $1.7M-$1.8M
  else if (price < 1900000) priceDigit = 'J'; // $1.8M-$1.9M
  else if (price < 2000000) priceDigit = 'K'; // $1.9M-$2M
  else priceDigit = 'L'; // $2M+

  // 2) Bedrooms range
  const beds = listing.beds || 0;
  const bedsDigit = beds <= 2 ? '1' : beds === 3 ? '2' : beds === 4 ? '3' : '4';

  // 3) Square footage range
  const sqft = listing.sqft || 0;
  const sqftDigit = sqft < 1000 ? '1' : sqft < 2000 ? '2' : sqft < 3000 ? '3' : '4';

  // 4) Age of Home
  let ageDigit;
  const yearBuilt = parseInt(listing.yearBuilt) || 0;
  if (yearBuilt < 1950) ageDigit = '1';
  else if (yearBuilt < 1980) ageDigit = '2';
  else if (yearBuilt < 2000) ageDigit = '3';
  else if (yearBuilt < 2015) ageDigit = '4';
  else ageDigit = '5';

  // 5) Property Type
  let typeDigit;
  const propertyType = listing.propertyType || '';
  const propertySubType = listing.propertySubType || '';
  
  if (propertySubType.includes('Single Family')) typeDigit = '1';
  else if (propertySubType.includes('Condo') || propertySubType.includes('Townhouse')) typeDigit = '2';
  else if (propertySubType.includes('Multi-Family')) typeDigit = '3';
  else if (propertySubType.includes('Mobile')) typeDigit = '4';
  else if (propertySubType.includes('Land')) typeDigit = '5';
  else typeDigit = '9'; // Unknown

  // 6) Lot Size
  const lotSize = listing.lotSize || 0;
  const lotDigit = lotSize < 5000 ? '1' : lotSize < 10000 ? '2' : lotSize < 20000 ? '3' : '4';

  // 7) Garage Parking
  // Since we don't have direct garage data, we'll estimate based on property type
  // This would need to be updated if garage data becomes available
  let garageDigit = '0';
  if (propertySubType.includes('Single Family')) {
    garageDigit = '2'; // Assume most single family homes have 1-car garage
  } else if (propertySubType.includes('Condo')) {
    garageDigit = '1'; // Assume most condos have covered parking
  }

  // 8) Home Condition / Renovation Status
  // Since we don't have direct condition data, we'll estimate based on year built and property type
  let conditionDigit;
  if (yearBuilt > 2015) {
    conditionDigit = '4'; // New construction
  } else if (yearBuilt > 2000) {
    conditionDigit = '3'; // Move-in Ready
  } else if (yearBuilt > 1980) {
    conditionDigit = '2'; // Some Updates
  } else {
    conditionDigit = '1'; // Needs Work
  }

  // 9) HOA Fees
  // Since we don't have direct HOA data, we'll estimate based on property type
  let hoaDigit;
  if (propertySubType.includes('Condo') || propertySubType.includes('Townhouse')) {
    hoaDigit = '3'; // Assume moderate HOA fees
  } else if (propertySubType.includes('Single Family')) {
    hoaDigit = '1'; // Assume no or low HOA fees
  } else {
    hoaDigit = '0'; // Unknown
  }

  // 10) Pool
  // Since we don't have direct pool data, we'll default to '0'
  const poolDigit = '0';

  // 11) Investment Opportunity
  // Since we don't have direct investment data, we'll estimate based on property type and price
  let investmentDigit;
  if (propertySubType.includes('Multi-Family') || 
      (price < 300000 && sqft > 1000) || 
      propertySubType.includes('Land')) {
    investmentDigit = '1'; // Potential investment
  } else {
    investmentDigit = '0'; // Not primarily an investment
  }

  // 12) Smart Home Features
  // Since we don't have direct smart home data, we'll estimate based on year built
  const smartHomeDigit = yearBuilt > 2015 ? '1' : '0';

  // 13) Outdoor Feature & View
  // Since we don't have direct view data, we'll estimate based on lot size
  let outdoorDigit;
  if (lotSize > 20000) {
    outdoorDigit = '4'; // Large lot, potential for great views
  } else if (lotSize > 10000) {
    outdoorDigit = '3'; // Good sized yard
  } else if (lotSize > 5000) {
    outdoorDigit = '2'; // Small yard
  } else {
    outdoorDigit = '1'; // Minimal outdoor space
  }

  // 14) Heating, Cooling, Energy Efficiency
  // Since we don't have direct HVAC data, we'll estimate based on year built
  let heatingDigit;
  if (yearBuilt > 2015) {
    heatingDigit = '4'; // Modern, likely energy efficient
  } else if (yearBuilt > 2000) {
    heatingDigit = '3'; // Relatively modern
  } else if (yearBuilt > 1980) {
    heatingDigit = '2'; // Standard systems
  } else {
    heatingDigit = '1'; // Older systems
  }

  // 15) School District Rating
  // Since we don't have direct school rating data, we'll default to '0'
  const schoolDigit = '0';

  // Combine into a metric string
  return priceDigit + bedsDigit + sqftDigit + ageDigit + typeDigit + 
         lotDigit + garageDigit + conditionDigit + hoaDigit + poolDigit + 
         investmentDigit + smartHomeDigit + outdoorDigit + heatingDigit + schoolDigit;
}

/**
 * Returns a human-readable description of a property match metric
 * @param {String} metric - The property match metric string
 * @returns {Object} - An object containing human-readable descriptions of each metric component
 */
export function describePropertyMatchMetric(metric) {
  if (!metric || metric.length !== 15) {
    return { error: 'Invalid metric format' };
  }

  const priceRanges = {
    '1': '$0-$100,000',
    '2': '$100,000-$200,000',
    '3': '$200,000-$300,000',
    '4': '$300,000-$400,000',
    '5': '$400,000-$500,000',
    '6': '$500,000-$600,000',
    '7': '$600,000-$700,000',
    '8': '$700,000-$800,000',
    '9': '$800,000-$900,000',
    'A': '$900,000-$1M',
    'B': '$1M-$1.1M',
    'C': '$1.1M-$1.2M',
    'D': '$1.2M-$1.3M',
    'E': '$1.3M-$1.4M',
    'F': '$1.4M-$1.5M',
    'G': '$1.5M-$1.6M',
    'H': '$1.6M-$1.7M',
    'I': '$1.7M-$1.8M',
    'J': '$1.8M-$1.9M',
    'K': '$1.9M-$2M',
    'L': '$2M+'
  };

  const bedroomRanges = {
    '1': '0-2 bedrooms',
    '2': '3 bedrooms',
    '3': '4 bedrooms',
    '4': '5+ bedrooms'
  };

  const sqftRanges = {
    '1': 'Under 1,000 sq ft',
    '2': '1,000-2,000 sq ft',
    '3': '2,000-3,000 sq ft',
    '4': '3,000+ sq ft'
  };

  const ageRanges = {
    '1': 'Built before 1950',
    '2': 'Built 1950-1979',
    '3': 'Built 1980-1999',
    '4': 'Built 2000-2014',
    '5': 'Built 2015 or newer'
  };

  const propertyTypes = {
    '1': 'Single-Family Home',
    '2': 'Condo/Townhouse',
    '3': 'Multi-Family',
    '4': 'Mobile Home',
    '5': 'Land',
    '9': 'Other Property Type'
  };

  const lotSizes = {
    '1': 'Small lot (under 5,000 sq ft)',
    '2': 'Medium lot (5,000-10,000 sq ft)',
    '3': 'Large lot (10,000-20,000 sq ft)',
    '4': 'Very large lot (20,000+ sq ft)'
  };

  const garageOptions = {
    '0': 'No garage information',
    '1': 'No garage/carport',
    '2': '1-car garage',
    '3': '2-car garage',
    '4': '3+ car garage'
  };

  const conditionOptions = {
    '1': 'Needs work',
    '2': 'Some updates needed',
    '3': 'Move-in ready',
    '4': 'Fully updated/new construction'
  };

  const hoaOptions = {
    '0': 'No HOA information',
    '1': 'No HOA',
    '2': 'Low HOA fees (under $100/month)',
    '3': 'Moderate HOA fees ($100-$300/month)',
    '4': 'High HOA fees ($300+/month)'
  };

  const poolOptions = {
    '0': 'No pool',
    '1': 'Has pool'
  };

  const investmentOptions = {
    '0': 'Not primarily an investment property',
    '1': 'Potential investment opportunity'
  };

  const smartHomeOptions = {
    '0': 'No smart home features',
    '1': 'Has smart home features'
  };

  const outdoorOptions = {
    '1': 'Minimal outdoor space',
    '2': 'Small yard',
    '3': 'Large yard/good views',
    '4': 'Exceptional outdoor space/views'
  };

  const heatingOptions = {
    '1': 'Basic/older systems',
    '2': 'Standard heating/cooling',
    '3': 'Energy efficient systems',
    '4': 'Smart climate control'
  };

  const schoolOptions = {
    '0': 'No school rating information',
    '1': 'Lower-rated schools (under 5/10)',
    '2': 'Medium-rated schools (5-7/10)',
    '3': 'High-rated schools (8+/10)'
  };

  return {
    price: priceRanges[metric[0]] || 'Unknown price range',
    bedrooms: bedroomRanges[metric[1]] || 'Unknown bedroom count',
    squareFootage: sqftRanges[metric[2]] || 'Unknown square footage',
    age: ageRanges[metric[3]] || 'Unknown age',
    propertyType: propertyTypes[metric[4]] || 'Unknown property type',
    lotSize: lotSizes[metric[5]] || 'Unknown lot size',
    garage: garageOptions[metric[6]] || 'Unknown garage information',
    condition: conditionOptions[metric[7]] || 'Unknown condition',
    hoa: hoaOptions[metric[8]] || 'Unknown HOA information',
    pool: poolOptions[metric[9]] || 'Unknown pool information',
    investment: investmentOptions[metric[10]] || 'Unknown investment potential',
    smartHome: smartHomeOptions[metric[11]] || 'Unknown smart home features',
    outdoor: outdoorOptions[metric[12]] || 'Unknown outdoor features',
    heating: heatingOptions[metric[13]] || 'Unknown heating/cooling',
    schools: schoolOptions[metric[14]] || 'Unknown school information'
  };
}

/**
 * Calculates the similarity between two property match metrics
 * Higher score means more similar properties
 * @param {String} metric1 - First property match metric
 * @param {String} metric2 - Second property match metric
 * @returns {Number} - Similarity score (0-100)
 */
export function calculateMetricSimilarity(metric1, metric2) {
  if (!metric1 || !metric2 || metric1.length !== 15 || metric2.length !== 15) {
    return 0;
  }

  // Define weights for each category (total should be 100)
  const weights = {
    price: 15,       // Price range (digit 0)
    bedrooms: 15,    // Bedrooms (digit 1)
    sqft: 15,        // Square footage (digit 2)
    age: 5,          // Age of home (digit 3)
    type: 10,        // Property type (digit 4)
    lot: 5,          // Lot size (digit 5)
    garage: 5,       // Garage (digit 6)
    condition: 10,   // Condition (digit 7)
    hoa: 5,          // HOA (digit 8)
    pool: 3,         // Pool (digit 9)
    investment: 2,   // Investment (digit 10)
    smartHome: 2,    // Smart home (digit 11)
    outdoor: 3,      // Outdoor (digit 12)
    heating: 3,      // Heating/cooling (digit 13)
    schools: 2       // Schools (digit 14)
  };

  let similarityScore = 0;
  
  // Price similarity (allow for adjacent price ranges)
  const price1 = metric1[0];
  const price2 = metric2[0];
  if (price1 === price2) {
    similarityScore += weights.price;
  } else {
    // For numeric price ranges (1-9)
    if (price1 >= '1' && price1 <= '9' && price2 >= '1' && price2 <= '9') {
      if (Math.abs(price1.charCodeAt(0) - price2.charCodeAt(0)) === 1) {
        // Adjacent price range
        similarityScore += weights.price * 0.5;
      }
    } 
    // For alphabetic price ranges (A-L)
    else if (price1 >= 'A' && price1 <= 'L' && price2 >= 'A' && price2 <= 'L') {
      if (Math.abs(price1.charCodeAt(0) - price2.charCodeAt(0)) === 1) {
        // Adjacent price range
        similarityScore += weights.price * 0.5;
      }
    }
    // For transition between numeric and alphabetic (9 to A)
    else if ((price1 === '9' && price2 === 'A') || (price1 === 'A' && price2 === '9')) {
      similarityScore += weights.price * 0.5;
    }
  }

  // Bedrooms similarity
  if (metric1[1] === metric2[1]) {
    similarityScore += weights.bedrooms;
  } else if (Math.abs(metric1[1].charCodeAt(0) - metric2[1].charCodeAt(0)) === 1) {
    // Adjacent bedroom count
    similarityScore += weights.bedrooms * 0.5;
  }

  // Square footage similarity
  if (metric1[2] === metric2[2]) {
    similarityScore += weights.sqft;
  } else if (Math.abs(metric1[2].charCodeAt(0) - metric2[2].charCodeAt(0)) === 1) {
    // Adjacent square footage range
    similarityScore += weights.sqft * 0.5;
  }

  // Age similarity
  if (metric1[3] === metric2[3]) {
    similarityScore += weights.age;
  } else if (Math.abs(metric1[3].charCodeAt(0) - metric2[3].charCodeAt(0)) === 1) {
    // Adjacent age range
    similarityScore += weights.age * 0.5;
  }

  // Property type similarity
  if (metric1[4] === metric2[4]) {
    similarityScore += weights.type;
  }

  // Lot size similarity
  if (metric1[5] === metric2[5]) {
    similarityScore += weights.lot;
  } else if (Math.abs(metric1[5].charCodeAt(0) - metric2[5].charCodeAt(0)) === 1) {
    // Adjacent lot size
    similarityScore += weights.lot * 0.5;
  }

  // Garage similarity
  if (metric1[6] === metric2[6]) {
    similarityScore += weights.garage;
  } else if (Math.abs(metric1[6].charCodeAt(0) - metric2[6].charCodeAt(0)) === 1) {
    // Adjacent garage size
    similarityScore += weights.garage * 0.5;
  }

  // Condition similarity
  if (metric1[7] === metric2[7]) {
    similarityScore += weights.condition;
  } else if (Math.abs(metric1[7].charCodeAt(0) - metric2[7].charCodeAt(0)) === 1) {
    // Adjacent condition
    similarityScore += weights.condition * 0.5;
  }

  // HOA similarity
  if (metric1[8] === metric2[8]) {
    similarityScore += weights.hoa;
  }

  // Pool similarity
  if (metric1[9] === metric2[9]) {
    similarityScore += weights.pool;
  }

  // Investment similarity
  if (metric1[10] === metric2[10]) {
    similarityScore += weights.investment;
  }

  // Smart home similarity
  if (metric1[11] === metric2[11]) {
    similarityScore += weights.smartHome;
  }

  // Outdoor similarity
  if (metric1[12] === metric2[12]) {
    similarityScore += weights.outdoor;
  } else if (Math.abs(metric1[12].charCodeAt(0) - metric2[12].charCodeAt(0)) === 1) {
    // Adjacent outdoor rating
    similarityScore += weights.outdoor * 0.5;
  }

  // Heating/cooling similarity
  if (metric1[13] === metric2[13]) {
    similarityScore += weights.heating;
  } else if (Math.abs(metric1[13].charCodeAt(0) - metric2[13].charCodeAt(0)) === 1) {
    // Adjacent heating/cooling rating
    similarityScore += weights.heating * 0.5;
  }

  // School similarity
  if (metric1[14] === metric2[14]) {
    similarityScore += weights.schools;
  }

  return Math.round(similarityScore);
} 