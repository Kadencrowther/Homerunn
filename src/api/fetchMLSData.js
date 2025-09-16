// src/api/fetchMLSData.js
export const fetchMLSData = async (filters = null) => {
  try {
    let url = 'https://us-central1-homerunn-973b3.cloudfunctions.net/getListings';
    
    // Only append filters if they exist
    if (filters) {
      // If a specific listing ID is provided, create a special filter for it
      if (filters.listingId) {
        console.log(`Looking up specific property with ListingId: ${filters.listingId}`);
        
        // Create a modified filters object with ONLY the listing ID filter
        // This ensures no other filters interfere with the specific property lookup
        const listingIdFilter = {
          listingId: filters.listingId,
          // Add a timestamp to prevent caching issues
          _t: new Date().getTime()
        };
        
        url += `?filters=${encodeURIComponent(JSON.stringify(listingIdFilter))}`;
        console.log('Using URL with specific listingId:', url);
      } else {
        // Use the regular filters
        // Add a timestamp to prevent caching if not already present
        const filtersWithTimestamp = filters._timestamp ? 
          filters : 
          { ...filters, _timestamp: new Date().getTime() };
        
        url += `?filters=${encodeURIComponent(JSON.stringify(filtersWithTimestamp))}`;
      }
    } else {
      // If no filters, still add a timestamp to prevent caching
      url += `?_timestamp=${new Date().getTime()}`;
    }
    
    console.log('Fetching MLS data with URL:', url);
    
    // Add cache-busting headers for all requests, not just property detail requests
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    // For specific property requests, don't apply additional filtering
    if (filters && filters.listingId) {
      console.log(`Received data for property ${filters.listingId}:`, 
        data.value.length > 0 ? `Found ${data.value.length} properties` : 'No properties found');
      
      // Return the data without additional filtering
      return {
        properties: data.value,
        pagination: {
          hasMoreProperties: false,
          nextPageToken: null,
          currentPage: 1,
          totalFetched: data.value.length
        }
      };
    }
    
    // Check if filters were applied
    const filterStatus = data.filterApplied === 'none' ? 'none' : data.filterApplied;
    console.log(`Fetched ${data.value.length} listings with filter applied: ${filterStatus}`);
    
    // Filter the data client-side to ensure it matches the criteria
    console.log('Performing client-side filtering to ensure all criteria are met...');
    let filteredCount = 0;
    const filteredData = data.value.filter(property => {
      // Only apply additional filtering if filters were provided
      if (!filters) return true;
      
      // Check price range
      if (filters.priceRange && filters.priceRange.max && 
          property.ListPrice > parseInt(filters.priceRange.max)) {
        filteredCount++;
        return false;
      }
      
      // Check beds
      if (filters.beds && filters.beds.length > 0) {
        const bedMatch = filters.beds.some(bed => {
          if (bed === '5+') return property.BedroomsTotal >= 5;
          return property.BedroomsTotal === parseInt(bed);
        });
        if (!bedMatch) {
          filteredCount++;
          return false;
        }
      }
      
      // Check baths
      if (filters.baths && filters.baths.length > 0) {
        const bathMatch = filters.baths.some(bath => {
          if (bath === '5+') return property.BathroomsTotalInteger >= 5;
          return property.BathroomsTotalInteger === parseInt(bath);
        });
        if (!bathMatch) {
          filteredCount++;
          return false;
        }
      }
      
      // Check property type
      if (filters.homeType && filters.homeType.length > 0) {
        const propertyTypeMatch = filters.homeType.some(type => {
          // Map our UI property types to MLS PropertyType and PropertySubType values
          switch(type) {
            case 'House':
              return (property.PropertyType === 'Residential' && 
                     property.PropertySubType === 'Single Family Residence');
            case 'Townhouse':
              return property.PropertySubType === 'Townhouse';
            case 'Condo':
              return property.PropertySubType === 'Condominium';
            case 'Apt':
              return (property.PropertySubType === 'Condominium' || 
                      property.PropertySubType === 'Multi Family' || 
                      property.PropertyType === 'Residential Income');
            case 'Land':
              return (property.PropertyType === 'Land' || 
                      property.PropertySubType === 'Unimproved Land' || 
                      property.PropertySubType === 'Single Family Residence Lot' || 
                      property.PropertySubType === 'Acreage (more than 10 acres)' || 
                      property.PropertySubType === 'Acreage (10 acres or less)');
            case 'Multifamily':
              return (property.PropertySubType === 'Multi Family' || 
                      property.PropertyType === 'Residential Income');
            case 'Manufactured House':
              return property.PropertySubType === 'Manufactured Home';
            case 'Commercial':
              return (property.PropertyType === 'Commercial' || 
                      property.PropertyType === 'Commercial Lease' || 
                      property.PropertyType === 'Commercial Sale' || 
                      property.PropertyType === 'Business Opportunity' ||
                      (property.PropertySubType && 
                       ['Business', 'Industrial', 'Office', 'Retail'].includes(property.PropertySubType)));
            default:
              // Fallback to the previous implementation for any other types
              return property.PropertyType && 
                     property.PropertyType.toLowerCase().includes(type.toLowerCase());
          }
        });
        if (!propertyTypeMatch) {
          filteredCount++;
          // Only log a summary instead of every property
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`After client-side filtering: ${filteredData.length} properties remain (filtered out ${filteredCount} properties)`);
    
    // Ensure pagination information is properly extracted and passed along
    const pagination = {
      hasMoreProperties: !!data.pagination?.nextPageToken,
      nextPageToken: data.pagination?.nextPageToken || null,
      currentPage: data.pagination?.currentPage || 1,
      totalFetched: filteredData.length
    };
    
    // Log pagination info for debugging
    console.log('Pagination info:', JSON.stringify(pagination));
    
    // Return the filtered data along with pagination information
    return {
      properties: filteredData,
      pagination: pagination
    };
  } catch (error) {
    console.error('Error fetching MLS data:', error);
    return {
      properties: [],
      pagination: {
        hasMoreProperties: false,
        nextPageToken: null,
        currentPage: 1,
        totalFetched: 0
      }
    };
  }
};

// New function to fetch additional properties
export const fetchMoreMLSData = async (nextPageToken, filters = null) => {
  try {
    if (!nextPageToken) {
      console.error('No pagination token provided');
      return {
        properties: [],
        pagination: {
          hasMoreProperties: false,
          nextPageToken: null
        }
      };
    }
    
    // Add a timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `https://us-central1-homerunn-973b3.cloudfunctions.net/getMoreListings?nextPageToken=${nextPageToken}&_timestamp=${timestamp}`;
    console.log('Fetching more MLS data with URL:', url);
    
    // Add cache-busting headers for all requests
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    console.log(`Fetched ${data.value.length} additional listings`);
    
    // Filter the data client-side to ensure it matches the criteria
    console.log('Performing client-side filtering on additional properties...');
    let filteredCount = 0;
    const filteredData = data.value.filter(property => {
      // Only apply additional filtering if filters were provided
      if (!filters) return true;
      
      // Check price range
      if (filters.priceRange && filters.priceRange.max && 
          property.ListPrice > parseInt(filters.priceRange.max)) {
        filteredCount++;
        return false;
      }
      
      // Check beds
      if (filters.beds && filters.beds.length > 0) {
        const bedMatch = filters.beds.some(bed => {
          if (bed === '5+') return property.BedroomsTotal >= 5;
          return property.BedroomsTotal === parseInt(bed);
        });
        if (!bedMatch) {
          filteredCount++;
          return false;
        }
      }
      
      // Check baths
      if (filters.baths && filters.baths.length > 0) {
        const bathMatch = filters.baths.some(bath => {
          if (bath === '5+') return property.BathroomsTotalInteger >= 5;
          return property.BathroomsTotalInteger === parseInt(bath);
        });
        if (!bathMatch) {
          filteredCount++;
          return false;
        }
      }
      
      // Check property type
      if (filters.homeType && filters.homeType.length > 0) {
        const propertyTypeMatch = filters.homeType.some(type => {
          // Map our UI property types to MLS PropertyType and PropertySubType values
          switch(type) {
            case 'House':
              return (property.PropertyType === 'Residential' && 
                     property.PropertySubType === 'Single Family Residence');
            case 'Townhouse':
              return property.PropertySubType === 'Townhouse';
            case 'Condo':
              return property.PropertySubType === 'Condominium';
            case 'Apt':
              return (property.PropertySubType === 'Condominium' || 
                      property.PropertySubType === 'Multi Family' || 
                      property.PropertyType === 'Residential Income');
            case 'Land':
              return (property.PropertyType === 'Land' || 
                      property.PropertySubType === 'Unimproved Land' || 
                      property.PropertySubType === 'Single Family Residence Lot' || 
                      property.PropertySubType === 'Acreage (more than 10 acres)' || 
                      property.PropertySubType === 'Acreage (10 acres or less)');
            case 'Multifamily':
              return (property.PropertySubType === 'Multi Family' || 
                      property.PropertyType === 'Residential Income');
            case 'Manufactured House':
              return property.PropertySubType === 'Manufactured Home';
            case 'Commercial':
              return (property.PropertyType === 'Commercial' || 
                      property.PropertyType === 'Commercial Lease' || 
                      property.PropertyType === 'Commercial Sale' || 
                      property.PropertyType === 'Business Opportunity' ||
                      (property.PropertySubType && 
                       ['Business', 'Industrial', 'Office', 'Retail'].includes(property.PropertySubType)));
            default:
              // Fallback to the previous implementation for any other types
              return property.PropertyType && 
                     property.PropertyType.toLowerCase().includes(type.toLowerCase());
          }
        });
        if (!propertyTypeMatch) {
          filteredCount++;
          return false;
        }
      }
      
      return true;
    });
    
    console.log(`After client-side filtering: ${filteredData.length} additional properties remain (filtered out ${filteredCount} properties)`);
    
    // Ensure pagination information is properly extracted and passed along
    const pagination = {
      hasMoreProperties: !!data.pagination?.nextPageToken,
      nextPageToken: data.pagination?.nextPageToken || null,
      currentPage: data.pagination?.currentPage || 1,
      totalFetched: filteredData.length
    };
    
    // Log pagination info for debugging
    console.log('More properties pagination info:', JSON.stringify(pagination));
    
    return {
      properties: filteredData,
      pagination: pagination
    };
  } catch (error) {
    console.error('Error fetching additional MLS data:', error);
    return {
      properties: [],
      pagination: {
        hasMoreProperties: false,
        nextPageToken: null
      }
    };
  }
};

// Add this new function to fetch a single property by its ID
export const fetchPropertyById = async (propertyId) => {
  try {
    console.log(`Fetching single property with ID: ${propertyId}`);
    
    // Clean up the property ID if it's a full URL
    let cleanPropertyId = propertyId;
    if (propertyId.includes('api.bridgedataoutput.com')) {
      // Extract just the ID portion from the URL
      const matches = propertyId.match(/Property\('([^']+)'\)/);
      if (matches && matches[1]) {
        cleanPropertyId = matches[1];
      }
    }
    
    // Create a direct URL to fetch this specific property
    const timestamp = new Date().getTime();
    const url = `https://us-central1-homerunn-973b3.cloudfunctions.net/getPropertyById?propertyId=${encodeURIComponent(cleanPropertyId)}&_timestamp=${timestamp}`;
    
    console.log('Fetching property with URL:', url);
    
    // Add cache-busting headers
    const headers = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    if (data.error) {
      console.error('API returned error:', data.error);
      return null;
    }
    
    if (data.property) {
      console.log(`Successfully fetched property ${propertyId}`);
      return data.property;
    } else {
      console.log(`No property found with ID ${propertyId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    return null;
  }
};
  