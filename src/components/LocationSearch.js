import React, { useState, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Text,
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { allStates } from '../data/statesData';

const { width } = Dimensions.get('window');

// Popular cities for each state (top 6-8 cities per state)
const popularCitiesByState = {
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian'],
  AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'Rogers'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder', 'Lakewood'],
  CT: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens'],
  HI: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe', 'Lawrence'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford'],
  MD: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Glen Burnie'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Salem'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington'],
  NY: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton'],
  OR: ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Beaverton'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket'],
  SC: ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy'],
  VT: ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan'],
  DC: ['Washington'],
};

const LocationSearch = ({ 
  placeholder = "Search states or cities...",
  onStateSelect,
  onCitySelect,
  selectedState = null,
  mode = 'both' // 'both', 'state', 'city'
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length >= 2) {
      searchLocationsWithGeocode(query);
    } else {
      setResults([]);
      setShowResults(false);
    }
  }, [query, mode]);

  // Search using Expo Location API (like FilterModal)
  const searchLocationsWithGeocode = async (searchQuery) => {
    try {
      setIsLoading(true);
      const searchResults = [];

      // First, search states if mode allows
      if (mode === 'both' || mode === 'state') {
        const query = searchQuery.toLowerCase();
        Object.entries(allStates).forEach(([abbr, state]) => {
          if (state.name.toLowerCase().includes(query) || 
              abbr.toLowerCase().includes(query)) {
            searchResults.push({
              type: 'state',
              id: abbr,
              name: state.name,
              abbr: abbr,
              available: state.available
            });
          }
        });
      }

      // Then search for cities using Geocoding API
      if (mode === 'both' || mode === 'city') {
        try {
          // Use the Location API to geocode the search query
          const locations = await Location.geocodeAsync(searchQuery);
          
          if (locations.length > 0) {
            // Get full address information for each result
            const cityResults = await Promise.all(
              locations.slice(0, 5).map(async (loc) => {
                const address = await Location.reverseGeocodeAsync({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                });
                
                if (address.length > 0) {
                  const addr = address[0];
                  
                  // Only include results with city and state
                  if (addr.city && addr.region) {
                    const stateAbbr = Object.keys(allStates).find(
                      key => allStates[key].name === addr.region
                    );
                    
                    return {
                      type: 'city',
                      id: `${loc.latitude}-${loc.longitude}`,
                      name: addr.city,
                      state: addr.region,
                      stateAbbr: stateAbbr || addr.region,
                      available: stateAbbr ? allStates[stateAbbr]?.available : false,
                      latitude: loc.latitude,
                      longitude: loc.longitude
                    };
                  }
                }
                return null;
              })
            );
            
            // Filter out null results and add to search results
            cityResults.forEach(result => {
              if (result) searchResults.push(result);
            });
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Continue with state results only
        }
      }

      setResults(searchResults);
      setShowResults(searchResults.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResultPress = (result) => {
    if (result.type === 'state') {
      onStateSelect?.(result.abbr);
    } else if (result.type === 'city') {
      onCitySelect?.(result.name, result.stateAbbr);
    }
    setQuery('');
    setShowResults(false);
  };

  const renderResult = ({ item }) => {
    const isState = item.type === 'state';
    const isMississippi = item.stateAbbr === 'MS' || item.abbr === 'MS';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleResultPress(item)}
      >
        <View style={styles.resultContent}>
          <Ionicons 
            name={isState ? "map" : "location"} 
            size={20} 
            color={isMississippi ? "#fc565b" : "#666"} 
          />
          <View style={styles.resultTextContainer}>
            <Text style={styles.resultName}>{item.name}</Text>
            {!isState && (
              <Text style={styles.resultState}>{item.state}</Text>
            )}
          </View>
        </View>
        {isMississippi && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>Available</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          placeholderTextColor="#999"
        />
        {isLoading && (
          <ActivityIndicator size="small" color="#fc565b" style={{ marginRight: 5 }} />
        )}
        {query.length > 0 && !isLoading && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              setQuery('');
              setShowResults(false);
            }}
          >
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderResult}
            keyExtractor={(item) => item.id}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {showResults && results.length === 0 && query.trim().length >= 2 && !isLoading && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No results found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: width * 0.04,
    color: '#333',
  },
  clearButton: {
    padding: 5,
  },
  resultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    maxHeight: 300,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  resultName: {
    fontSize: width * 0.04,
    fontWeight: '500',
    color: '#333',
  },
  resultState: {
    fontSize: width * 0.032,
    color: '#666',
    marginTop: 2,
  },
  availableBadge: {
    backgroundColor: '#fc565b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availableText: {
    color: '#fff',
    fontSize: width * 0.03,
    fontWeight: '600',
  },
  noResultsContainer: {
    position: 'absolute',
    top: 55,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: width * 0.038,
    color: '#999',
  },
});

export default LocationSearch;

