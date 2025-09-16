const functions = require("firebase-functions");
const axios = require("axios");

// Export a Gen 1 HTTPS function
exports.getListings = functions
  .region("us-central1")
  .runWith({ memory: "512MB", timeoutSeconds: 300 })
  .https.onRequest(async (req, res) => {
    try {
      // Set CORS headers
      res.set('Access-Control-Allow-Origin', '*');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
      }
      
      // Fetch server token from Firebase config
      const SERVER_TOKEN = functions.config().mls.server_token;
      if (!SERVER_TOKEN) {
        return res.status(500).json({ error: "Server token not configured." });
      }

      // Get filters from query parameters
      const filtersParam = req.query.filters;
      let filters = null;
      let filtersApplied = false;
      let filterString = "StandardStatus eq 'Active'"; // Default filter for active listings
      
      if (filtersParam) {
        try {
          filters = JSON.parse(filtersParam);
          console.log('Received filters:', filters);
          
          // Check if we're looking for a specific listing by ID
          if (filters.listingId) {
            console.log(`Looking for specific listing with ID: ${filters.listingId}`);
            
            // Override all other filters and just search for this specific listing
            // Use ListingId or ListingKey depending on what's available
            filterString = `(ListingId eq '${filters.listingId}' or ListingKey eq '${filters.listingId}')`;
            
            console.log(`Using direct listing ID filter: ${filterString}`);
            filtersApplied = true;
            
            // Skip all other filters since we're looking for a specific property
            // Make the API call directly
            const url = `https://api.bridgedataoutput.com/api/v2/OData/united/Property?access_token=${SERVER_TOKEN}&$filter=${encodeURIComponent(filterString)}`;
            console.log("Direct property lookup URL:", url);
            
            const response = await axios.get(url);
            
            if (response.data && response.data.value) {
              console.log(`Found ${response.data.value.length} properties matching ID ${filters.listingId}`);
              
              // Return the results directly
              return res.status(200).json({
                value: response.data.value,
                filterApplied: 'listingId',
                pagination: null
              });
            } else {
              console.log(`No properties found with ID ${filters.listingId}`);
              return res.status(200).json({
                value: [],
                filterApplied: 'listingId',
                pagination: null
              });
            }
          }
          
          // Continue with regular filters if not looking for a specific listing
          filtersApplied = true;
          
          // Add geographic filtering if mapRegion and radiusMiles are provided
          if (filters.mapRegion && filters.radiusMiles) {
            console.log(`Processing geographic filter: Center(${filters.mapRegion.latitude}, ${filters.mapRegion.longitude}), Radius: ${filters.radiusMiles} miles`);
            
            // Convert miles to degrees (approximate conversion)
            // 1 degree of latitude is approximately 69 miles
            // 1 degree of longitude varies based on latitude, but at the equator it's about 69 miles
            const latDegrees = filters.radiusMiles / 69;
            
            // Adjust longitude degrees based on latitude (longitude degrees get smaller as you move away from equator)
            const latRadian = filters.mapRegion.latitude * (Math.PI / 180);
            const longDegrees = filters.radiusMiles / (69 * Math.cos(latRadian));
            
            // Calculate bounding box
            const minLat = filters.mapRegion.latitude - latDegrees;
            const maxLat = filters.mapRegion.latitude + latDegrees;
            const minLong = filters.mapRegion.longitude - longDegrees;
            const maxLong = filters.mapRegion.longitude + longDegrees;
            
            console.log(`Geographic bounding box: Lat(${minLat} to ${maxLat}), Long(${minLong} to ${maxLong})`);
            
            // Add geographic filter to the filter string
            filterString += ` and Latitude ge ${minLat} and Latitude le ${maxLat} and Longitude ge ${minLong} and Longitude le ${maxLong}`;
          } else if (filters.mapRegion) {
            console.log('WARNING: mapRegion provided but no radiusMiles, cannot apply geographic filter');
          } else if (filters.radiusMiles) {
            console.log('WARNING: radiusMiles provided but no mapRegion, cannot apply geographic filter');
          }
          
          // IMPORTANT: Check for property type filter first to ensure it's included
          if (filters.homeType && filters.homeType.length > 0) {
            console.log(`Processing property type filter: ${JSON.stringify(filters.homeType)}`);
            
            // Build property type filter
            const propertyTypeFilters = [];
            
            filters.homeType.forEach(type => {
              // Normalize type to handle case sensitivity
              const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
              console.log(`Processing property type: ${normalizedType}`);
              
              switch(normalizedType) {
                case 'House':
                  propertyTypeFilters.push(`(PropertyType eq 'Residential' and PropertySubType eq 'Single Family Residence')`);
                  break;
                case 'Townhouse':
                  propertyTypeFilters.push(`(PropertySubType eq 'Townhouse')`);
                  break;
                case 'Condo':
                  propertyTypeFilters.push(`(PropertySubType eq 'Condominium')`);
                  break;
                case 'Apt':
                  propertyTypeFilters.push(`(PropertySubType eq 'Condominium' or PropertySubType eq 'Multi Family' or PropertyType eq 'Residential Income')`);
                  break;
                case 'Land':
                  propertyTypeFilters.push(`(PropertyType eq 'Land' or PropertySubType eq 'Unimproved Land' or PropertySubType eq 'Single Family Residence Lot')`);
                  break;
                case 'Multifamily':
                  propertyTypeFilters.push(`(PropertySubType eq 'Multi Family' or PropertySubType eq 'Multi-Family' or PropertyType eq 'Residential Income')`);
                  break;
                case 'Manufactured house':
                case 'Manufactured House':
                  propertyTypeFilters.push(`(PropertySubType eq 'Manufactured Home')`);
                  break;
                case 'Commercial':
                  propertyTypeFilters.push(`(PropertyType eq 'Commercial' or PropertyType eq 'Commercial Lease' or PropertyType eq 'Commercial Sale' or PropertyType eq 'Business Opportunity')`);
                  propertyTypeFilters.push(`(PropertySubType eq 'Retail' or PropertySubType eq 'Office' or PropertySubType eq 'Industrial' or PropertySubType eq 'Business')`);
                  break;
                default:
                  console.log(`Using default case for type: ${normalizedType}`);
                  propertyTypeFilters.push(`PropertyType eq '${normalizedType}'`);
              }
            });
            
            if (propertyTypeFilters.length > 0) {
              const propertyTypeFilterString = ` and (${propertyTypeFilters.join(' or ')})`;
              console.log(`Adding property type filter: ${propertyTypeFilterString}`);
              filterString += propertyTypeFilterString;
            } else {
              console.log('WARNING: No property type filters were created!');
            }
          }
          
          // Add price range filter if provided
          if (filters.priceRange) {
            if (filters.priceRange.min && filters.priceRange.min !== '' && parseInt(filters.priceRange.min) > 0) {
              filterString += ` and ListPrice ge ${parseInt(filters.priceRange.min)}`;
            }
            if (filters.priceRange.max && filters.priceRange.max !== '' && parseInt(filters.priceRange.max) < 10000000) {
              filterString += ` and ListPrice le ${parseInt(filters.priceRange.max)}`;
            }
          }
          
          // Add bedrooms filter if provided
          if (filters.beds && filters.beds.length > 0) {
            const bedFilters = [];
            
            filters.beds.forEach(bed => {
              if (bed === '5+') {
                bedFilters.push(`BedroomsTotal ge 5`);
              } else {
                bedFilters.push(`BedroomsTotal eq ${parseInt(bed)}`);
              }
            });
            
            if (bedFilters.length > 0) {
              filterString += ` and (${bedFilters.join(' or ')})`;
            }
          }
          
          // Add bathrooms filter if provided
          if (filters.baths && filters.baths.length > 0) {
            const bathFilters = [];
            
            filters.baths.forEach(bath => {
              if (bath === '5+') {
                bathFilters.push(`BathroomsTotalInteger ge 5`);
              } else {
                bathFilters.push(`BathroomsTotalInteger eq ${parseInt(bath)}`);
              }
            });
            
            if (bathFilters.length > 0) {
              filterString += ` and (${bathFilters.join(' or ')})`;
            }
          }
          
          // Add square footage filter if provided
          if (filters.sqft) {
            if (filters.sqft.min && filters.sqft.min !== '' && parseInt(filters.sqft.min) > 0) {
              filterString += ` and LivingArea ge ${parseInt(filters.sqft.min)}`;
            }
            if (filters.sqft.max && filters.sqft.max !== '' && parseInt(filters.sqft.max) < 100000) {
              filterString += ` and LivingArea le ${parseInt(filters.sqft.max)}`;
            }
          }
          
          // Add year built filter if provided
          if (filters.yearBuilt) {
            if (filters.yearBuilt.min && filters.yearBuilt.min !== '' && parseInt(filters.yearBuilt.min) > 1800) {
              filterString += ` and YearBuilt ge ${parseInt(filters.yearBuilt.min)}`;
            }
            if (filters.yearBuilt.max && filters.yearBuilt.max !== '' && parseInt(filters.yearBuilt.max) <= new Date().getFullYear()) {
              filterString += ` and YearBuilt le ${parseInt(filters.yearBuilt.max)}`;
            }
          }
        } catch (error) {
          console.error("❌ Error parsing filters:", error);
          return res.status(400).json({ error: "Failed to parse filters" });
        }
      }
      
      console.log(`Using filter: ${filterString}`);
      console.log(`Filters applied: ${filtersApplied ? 'YES' : 'NO'}`);

      // Increase the number of properties per page to 100 and don't limit the number of pages
      let url = `https://api.bridgedataoutput.com/api/v2/OData/united/Property?access_token=${SERVER_TOKEN}&$top=100&$filter=${encodeURIComponent(filterString)}`;

      // Verify the URL contains the property type filter if one was provided
      if (filters && filters.homeType && filters.homeType.length > 0) {
        const encodedFilter = encodeURIComponent(filterString);
        console.log(`Encoded filter string: ${encodedFilter}`);
        
        // Check for specific property types
        if (filters.homeType.includes('Multifamily') || filters.homeType.includes('multifamily')) {
          if (encodedFilter.includes('Multi%20Family') || encodedFilter.includes('Residential%20Income')) {
            console.log('✅ Multifamily filter confirmed in URL');
          } else {
            console.warn('⚠️ WARNING: Multifamily filter NOT found in URL!');
          }
        }
      }

      // Verify the URL contains the geographic filter if one was provided
      if (filters && filters.mapRegion && filters.radiusMiles) {
        const encodedFilter = encodeURIComponent(filterString);
        
        // Check if latitude and longitude filters are in the URL
        if (encodedFilter.includes('Latitude%20ge') && encodedFilter.includes('Longitude%20ge')) {
          console.log('✅ Geographic filter confirmed in URL');
        } else {
          console.warn('⚠️ WARNING: Geographic filter NOT found in URL!');
        }
      }

      // Log the final URL for debugging
      console.log("API URL:", url);

      let allListings = [];
      let nextPageUrl = url; // Start with the first page
      let pageCounter = 0;
      const targetListingCount = 500; // Target up to 500 properties
      const maxPages = 25; // Set a higher limit to avoid infinite loops (25 pages = up to 2500 properties)

      // Fetch listings using pagination
      while (nextPageUrl && pageCounter < maxPages && allListings.length < targetListingCount) {
        console.log(`Fetching page ${pageCounter + 1} from: ${nextPageUrl}`);
        console.log(`Current property count: ${allListings.length}/${targetListingCount}`);

        try {
          const response = await axios.get(nextPageUrl);
          const data = response.data;

          if (data.value && Array.isArray(data.value)) {
            // Check if property type filter is being applied by the MLS API
            if (filters && filters.homeType && filters.homeType.length > 0 && data.value.length > 0) {
              // Count how many properties match the requested property type
              let matchCount = 0;
              const sampleSize = Math.min(20, data.value.length);
              
              for (let i = 0; i < sampleSize; i++) {
                const property = data.value[i];
                let matches = false;
                
                // Check if this property matches any of the requested property types
                for (const type of filters.homeType) {
                  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                  
                  switch(normalizedType) {
                    case 'Multifamily':
                      if (property.PropertySubType === 'Multi Family' || 
                          property.PropertySubType === 'Multi-Family' || 
                          property.PropertyType === 'Residential Income') {
                        matches = true;
                      }
                      break;
                    // Add other cases as needed
                  }
                  
                  if (matches) break;
                }
                
                if (matches) {
                  matchCount++;
                }
              }
              
              const matchPercentage = (matchCount / sampleSize) * 100;
              console.log(`MLS API filter effectiveness: ${matchCount}/${sampleSize} (${matchPercentage.toFixed(2)}%) of sampled properties match the requested property type`);
              
              if (matchPercentage < 30) {
                console.warn('⚠️ WARNING: Less than 30% of properties match the requested property type. The MLS API filter may not be working correctly!');
                console.warn('⚠️ Will rely on client-side filtering for property types.');
              }
            }
            
            // Check if the geographic filter is being applied correctly
            if (filters && filters.mapRegion && filters.radiusMiles && data.value.length > 0) {
              let inRadiusCount = 0;
              const sampleSize = Math.min(20, data.value.length);
              
              for (let i = 0; i < sampleSize; i++) {
                const property = data.value[i];
                
                if (property.Latitude && property.Longitude) {
                  // Calculate distance using Haversine formula
                  const lat1 = filters.mapRegion.latitude;
                  const lon1 = filters.mapRegion.longitude;
                  const lat2 = property.Latitude;
                  const lon2 = property.Longitude;
                  
                  const R = 3958.8; // Earth's radius in miles
                  const dLat = (lat2 - lat1) * Math.PI / 180;
                  const dLon = (lon2 - lon1) * Math.PI / 180;
                  const a = 
                    Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
                  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                  const distance = R * c; // Distance in miles
                  
                  if (distance <= filters.radiusMiles) {
                    inRadiusCount++;
                  }
                }
              }
              
              const inRadiusPercentage = (inRadiusCount / sampleSize) * 100;
              console.log(`Geographic filter effectiveness: ${inRadiusCount}/${sampleSize} (${inRadiusPercentage.toFixed(2)}%) of sampled properties are within the ${filters.radiusMiles} mile radius`);
              
              if (inRadiusPercentage < 70) {
                console.warn('⚠️ WARNING: Less than 70% of properties are within the specified radius. The geographic filter may not be working correctly!');
                console.warn('⚠️ Will rely on client-side filtering for geographic constraints.');
              }
            }
            
            // Log a sample of the first few properties
            if (data.value.length > 0) {
              const sampleSize = Math.min(3, data.value.length);
              console.log(`Sample of ${sampleSize} properties returned by MLS API:`);
              for (let i = 0; i < sampleSize; i++) {
                const property = data.value[i];
                console.log(`Property ${i+1}: Type=${property.PropertyType}, SubType=${property.PropertySubType}, Price=${property.ListPrice}, Beds=${property.BedroomsTotal}, Baths=${property.BathroomsTotalInteger}`);
                
                // Log coordinates if available
                if (property.Latitude && property.Longitude) {
                  console.log(`Property ${i+1} Coordinates: Lat=${property.Latitude}, Long=${property.Longitude}`);
                  
                  // If we have map region filters, calculate and log the distance
                  if (filters && filters.mapRegion && filters.radiusMiles) {
                    const lat1 = filters.mapRegion.latitude;
                    const lon1 = filters.mapRegion.longitude;
                    const lat2 = property.Latitude;
                    const lon2 = property.Longitude;
                    
                    const R = 3958.8; // Earth's radius in miles
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLon = (lon2 - lon1) * Math.PI / 180;
                    const a = 
                      Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                      Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c; // Distance in miles
                    
                    console.log(`Property ${i+1} Distance from center: ${distance.toFixed(2)} miles (Radius: ${filters.radiusMiles} miles)`);
                  }
                } else {
                  console.log(`Property ${i+1}: No coordinates available`);
                }
              }
              
              // Check if the property type filter is being applied
              if (filters && filters.homeType && filters.homeType.length > 0) {
                const propertyTypeCheck = filters.homeType[0].toLowerCase();
                let matchCount = 0;
                let totalCount = Math.min(10, data.value.length);
                
                for (let i = 0; i < totalCount; i++) {
                  const property = data.value[i];
                  let matches = false;
                  
                  if (propertyTypeCheck === 'multifamily') {
                    matches = (property.PropertySubType === 'Multi Family' || 
                              property.PropertySubType === 'Multi-Family' || 
                              property.PropertyType === 'Residential Income');
                  }
                  
                  if (matches) {
                    matchCount++;
                  }
                }
                
                const matchPercentage = (matchCount / totalCount) * 100;
                console.log(`Property type filter effectiveness: ${matchCount}/${totalCount} (${matchPercentage.toFixed(2)}%) of sampled properties match the '${propertyTypeCheck}' filter`);
                
                if (matchPercentage < 50) {
                  console.warn('WARNING: Less than 50% of properties match the requested property type. The MLS API filter may not be working correctly!');
                }
              }
            }
            
            // Verify each property meets the filter criteria before adding
            const filteredProperties = data.value.filter(property => {
              // Verify price range
              if (filters && filters.priceRange) {
                if (filters.priceRange.max && property.ListPrice > parseInt(filters.priceRange.max)) {
                  console.log(`Filtering out property that exceeds max price: ${property.ListPrice} > ${filters.priceRange.max}`);
                  return false;
                }
              }
              
              // Verify beds
              if (filters && filters.beds && filters.beds.length > 0) {
                const bedMatch = filters.beds.some(bed => {
                  if (bed === '5+') return property.BedroomsTotal >= 5;
                  return property.BedroomsTotal === parseInt(bed);
                });
                if (!bedMatch) {
                  console.log(`Filtering out property with incorrect beds: ${property.BedroomsTotal}`);
                  return false;
                }
              }
              
              // Verify baths
              if (filters && filters.baths && filters.baths.length > 0) {
                const bathMatch = filters.baths.some(bath => {
                  if (bath === '5+') return property.BathroomsTotalInteger >= 5;
                  return property.BathroomsTotalInteger === parseInt(bath);
                });
                if (!bathMatch) {
                  console.log(`Filtering out property with incorrect baths: ${property.BathroomsTotalInteger}`);
                  return false;
                }
              }
              
              // Verify property type
              if (filters && filters.homeType && filters.homeType.length > 0) {
                let propertyTypeMatch = false;
                
                // Check each property type in the filter
                for (const type of filters.homeType) {
                  // Normalize type to handle case sensitivity
                  const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
                  
                  switch(normalizedType) {
                    case 'House':
                      if (property.PropertyType === 'Residential' && 
                          property.PropertySubType === 'Single Family Residence') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Townhouse':
                      if (property.PropertySubType === 'Townhouse') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Condo':
                      if (property.PropertySubType === 'Condominium') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Apt':
                      if (property.PropertySubType === 'Condominium' || 
                          property.PropertySubType === 'Multi Family' || 
                          property.PropertyType === 'Residential Income') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Land':
                      if (property.PropertyType === 'Land' || 
                          property.PropertySubType === 'Unimproved Land' || 
                          property.PropertySubType === 'Single Family Residence Lot') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Multifamily':
                      if (property.PropertySubType === 'Multi Family' || 
                          property.PropertySubType === 'Multi-Family' || 
                          property.PropertyType === 'Residential Income') {
                        propertyTypeMatch = true;
                      }
                      break;
                    case 'Manufactured house':
                    case 'Manufactured House':
                      if (property.PropertySubType === 'Manufactured Home') {
                        propertyTypeMatch = true;
                      }
                      break;
                    default:
                      if (property.PropertyType === normalizedType) {
                        propertyTypeMatch = true;
                      }
                  }
                  
                  // If we found a match, no need to check other types
                  if (propertyTypeMatch) break;
                }
                
                if (!propertyTypeMatch) {
                  console.log(`Filtering out property with type: ${property.PropertyType}/${property.PropertySubType}`);
                  return false;
                }
              }
              
              // Verify geographic location if mapRegion and radiusMiles are provided
              if (filters && filters.mapRegion && filters.radiusMiles && 
                  property.Latitude && property.Longitude) {
                
                // Calculate distance between property and center point using Haversine formula
                const lat1 = filters.mapRegion.latitude;
                const lon1 = filters.mapRegion.longitude;
                const lat2 = property.Latitude;
                const lon2 = property.Longitude;
                
                // Haversine formula to calculate distance between two points on Earth
                const R = 3958.8; // Earth's radius in miles
                const dLat = (lat2 - lat1) * Math.PI / 180;
                const dLon = (lon2 - lon1) * Math.PI / 180;
                const a = 
                  Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                const distance = R * c; // Distance in miles
                
                if (distance > filters.radiusMiles) {
                  console.log(`Filtering out property outside radius: ${distance.toFixed(2)} miles > ${filters.radiusMiles} miles`);
                  return false;
                }
              }
              
              return true;
            });
            
            console.log(`Page ${pageCounter + 1}: Received ${data.value.length} properties, filtered to ${filteredProperties.length}`);
            allListings = [...allListings, ...filteredProperties]; // Append filtered listings
            console.log(`Total properties so far: ${allListings.length}/${targetListingCount}`);
          }

          // Check for next page
          nextPageUrl = data["@odata.nextLink"] || null;
          
          // If we have enough properties or there's no next page, break the loop
          if (allListings.length >= targetListingCount || !nextPageUrl) {
            if (allListings.length >= targetListingCount) {
              console.log(`✅ Reached target of ${targetListingCount} properties. Stopping pagination.`);
            } else if (!nextPageUrl) {
              console.log(`⚠️ No more pages available. Stopping with ${allListings.length} properties.`);
              if (allListings.length < 20) {
                console.log(`⚠️ Found fewer than 20 properties (${allListings.length}). This may indicate a very specific filter or limited inventory in this area.`);
              }
            }
            break;
          }
          
          pageCounter++;

        } catch (error) {
          console.error("❌ Error fetching page:", error);
          break; // Stop fetching if an error occurs
        }
      }

      console.log(`✅ Total Filtered Listings Fetched: ${allListings.length} from ${pageCounter + 1} pages`);
      console.log(`✅ Pagination stopped because: ${
        allListings.length >= targetListingCount 
          ? `Reached target of ${targetListingCount} properties` 
          : pageCounter >= maxPages 
            ? `Reached maximum page limit of ${maxPages}` 
            : `No more pages available`
      }`);

      // Return the filtered listings with proper filter status and pagination info
      res.status(200).json({
        value: allListings,
        totalCount: allListings.length,
        filterApplied: filtersApplied ? filterString : "none",
        pagination: {
          hasMoreProperties: !!nextPageUrl,
          nextPageToken: nextPageUrl ? encodeURIComponent(nextPageUrl) : null,
          currentPage: pageCounter + 1,
          totalFetched: allListings.length
        }
      });

    } catch (error) {
      console.error("❌ Error fetching listings:", error);
      res.status(500).json({ error: "Failed to fetch listings", details: error.message });
    }
  });

// Add a new endpoint for fetching additional pages
exports.getMoreListings = functions
  .region("us-central1")
  .runWith({ memory: "512MB", timeoutSeconds: 300 })
  .https.onRequest(async (req, res) => {
    try {
      // Get the next page token from the request
      const nextPageToken = req.query.nextPageToken;
      
      if (!nextPageToken) {
        return res.status(400).json({ error: "Missing nextPageToken parameter" });
      }
      
      // Decode the next page URL
      const nextPageUrl = decodeURIComponent(nextPageToken);
      console.log("Fetching more listings from:", nextPageUrl);
      
      // Make the request to the MLS API
      const response = await axios.get(nextPageUrl);
      const data = response.data;
      
      if (!data.value || !Array.isArray(data.value)) {
        return res.status(500).json({ error: "Invalid response from MLS API" });
      }
      
      // Process the properties (similar to the main function)
      const properties = data.value;
      console.log(`Received ${properties.length} additional properties`);
      
      // Return the properties and pagination info
      res.status(200).json({
        value: properties,
        totalCount: properties.length,
        pagination: {
          hasMoreProperties: !!data["@odata.nextLink"],
          nextPageToken: data["@odata.nextLink"] ? encodeURIComponent(data["@odata.nextLink"]) : null,
        }
      });
      
    } catch (error) {
      console.error("❌ Error fetching additional listings:", error);
      res.status(500).json({ error: "Failed to fetch additional listings", details: error.message });
    }
  });

// Add this new function to the functions/index.js file
exports.getPropertyById = functions
  .region("us-central1")
  .runWith({ memory: "256MB", timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    try {
      // Set CORS headers
      res.set('Access-Control-Allow-Origin', '*');
      
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.status(204).send('');
        return;
      }
      
      // Get the property ID from query parameters
      const propertyId = req.query.propertyId;
      
      if (!propertyId) {
        return res.status(400).json({ error: "Missing propertyId parameter" });
      }
      
      // Fetch server token from Firebase config
      const SERVER_TOKEN = functions.config().mls.server_token;
      if (!SERVER_TOKEN) {
        return res.status(500).json({ error: "Server token not configured." });
      }
      
      console.log(`Looking up property with ID: ${propertyId}`);
      
      // Try the direct URL approach first (preferred method)
      try {
        const directUrl = `https://api.bridgedataoutput.com/api/v2/OData/united/Property('${propertyId}')?access_token=${SERVER_TOKEN}`;
        console.log("Using direct property URL (preferred method):", directUrl);
        
        const directResponse = await axios.get(directUrl);
        
        if (directResponse.data) {
          console.log(`Found property with direct URL for ID ${propertyId}`);
          return res.status(200).json({
            property: directResponse.data,
            success: true
          });
        }
      } catch (directError) {
        console.log(`Direct URL approach failed: ${directError.message}. Trying fallback method...`);
        // Continue to fallback method
      }
      
      // Fallback: Try using ListingId and ListingKey filters
      const filterString = `(ListingId eq '${propertyId}' or ListingKey eq '${propertyId}')`;
      const url = `https://api.bridgedataoutput.com/api/v2/OData/united/Property?access_token=${SERVER_TOKEN}&$filter=${encodeURIComponent(filterString)}`;
      
      console.log("Fallback: Using filter-based property lookup URL:", url);
      
      const response = await axios.get(url);
      
      if (response.data && response.data.value && response.data.value.length > 0) {
        console.log(`Found property with ID ${propertyId} using fallback method`);
        
        // Return the first matching property
        return res.status(200).json({
          property: response.data.value[0],
          success: true
        });
      } else {
        console.log(`No property found with ID ${propertyId} using either method`);
        return res.status(404).json({
          error: "Property not found",
          success: false
        });
      }
    } catch (error) {
      console.error("Error fetching property:", error);
      res.status(500).json({ 
        error: "Failed to fetch property", 
        details: error.message,
        success: false
      });
    }
  });
