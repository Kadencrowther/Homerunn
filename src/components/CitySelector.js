import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions, FlatList, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

// All cities for all states (top cities per state)
const citiesByState = {
  MS: ['Jackson', 'Gulfport', 'Southaven', 'Hattiesburg', 'Biloxi', 'Meridian', 'Tupelo', 'Olive Branch', 'Pearl', 'Madison', 'Clinton', 'Ridgeland'],
  AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa', 'Hoover', 'Dothan', 'Auburn', 'Decatur', 'Madison'],
  AK: ['Anchorage', 'Fairbanks', 'Juneau', 'Sitka', 'Ketchikan', 'Wasilla', 'Kenai', 'Kodiak'],
  AZ: ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale', 'Gilbert', 'Tempe'],
  AR: ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro', 'Rogers', 'Conway', 'Bentonville'],
  CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Oakland', 'Fresno', 'Long Beach'],
  CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Boulder', 'Lakewood', 'Pueblo', 'Arvada'],
  CT: ['Bridgeport', 'New Haven', 'Stamford', 'Hartford', 'Waterbury', 'Norwalk', 'Danbury', 'New Britain'],
  DE: ['Wilmington', 'Dover', 'Newark', 'Middletown', 'Smyrna', 'Milford', 'Seaford', 'Georgetown'],
  FL: ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Tallahassee', 'Naples'],
  GA: ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell'],
  HI: ['Honolulu', 'Pearl City', 'Hilo', 'Kailua', 'Waipahu', 'Kaneohe', 'Mililani', 'Kahului'],
  ID: ['Boise', 'Meridian', 'Nampa', 'Idaho Falls', 'Pocatello', 'Caldwell', 'Coeur d\'Alene', 'Twin Falls'],
  IL: ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Elgin', 'Peoria'],
  IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel', 'Fishers', 'Bloomington', 'Hammond'],
  IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City', 'Iowa City', 'Waterloo', 'Council Bluffs', 'Ames'],
  KS: ['Wichita', 'Overland Park', 'Kansas City', 'Topeka', 'Olathe', 'Lawrence', 'Shawnee', 'Manhattan'],
  KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro', 'Covington', 'Richmond', 'Georgetown', 'Florence'],
  LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette', 'Lake Charles', 'Kenner', 'Bossier City', 'Monroe'],
  ME: ['Portland', 'Lewiston', 'Bangor', 'South Portland', 'Auburn', 'Biddeford', 'Sanford', 'Augusta'],
  MD: ['Baltimore', 'Columbia', 'Germantown', 'Silver Spring', 'Waldorf', 'Glen Burnie', 'Frederick', 'Rockville'],
  MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'New Bedford', 'Quincy'],
  MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint', 'Dearborn'],
  MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'Bloomington', 'Brooklyn Park', 'Plymouth', 'St. Cloud'],
  MO: ['Kansas City', 'St. Louis', 'Springfield', 'Columbia', 'Independence', 'Lee\'s Summit', 'O\'Fallon', 'St. Joseph'],
  MT: ['Billings', 'Missoula', 'Great Falls', 'Bozeman', 'Butte', 'Helena', 'Kalispell', 'Havre'],
  NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island', 'Kearney', 'Fremont', 'Hastings', 'Norfolk'],
  NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas', 'Sparks', 'Carson City', 'Fernley', 'Elko'],
  NH: ['Manchester', 'Nashua', 'Concord', 'Derry', 'Rochester', 'Salem', 'Dover', 'Merrimack'],
  NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River'],
  NM: ['Albuquerque', 'Las Cruces', 'Rio Rancho', 'Santa Fe', 'Roswell', 'Farmington', 'Clovis', 'Hobbs'],
  NY: ['New York City', 'Buffalo', 'Rochester', 'Albany', 'Syracuse', 'Yonkers', 'New Rochelle', 'Mount Vernon'],
  NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington'],
  ND: ['Fargo', 'Bismarck', 'Grand Forks', 'Minot', 'West Fargo', 'Williston', 'Dickinson', 'Mandan'],
  OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton'],
  OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow', 'Edmond', 'Lawton', 'Moore', 'Midwest City'],
  OR: ['Portland', 'Eugene', 'Salem', 'Gresham', 'Hillsboro', 'Beaverton', 'Bend', 'Medford'],
  PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster'],
  RI: ['Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence', 'Woonsocket', 'Coventry', 'Cumberland'],
  SC: ['Columbia', 'Charleston', 'North Charleston', 'Mount Pleasant', 'Rock Hill', 'Greenville', 'Summerville', 'Goose Creek'],
  SD: ['Sioux Falls', 'Rapid City', 'Aberdeen', 'Brookings', 'Watertown', 'Mitchell', 'Yankton', 'Pierre'],
  TN: ['Nashville', 'Memphis', 'Knoxville', 'Chattanooga', 'Clarksville', 'Murfreesboro', 'Franklin', 'Jackson'],
  TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Plano'],
  UT: ['Salt Lake City', 'West Valley City', 'Provo', 'West Jordan', 'Orem', 'Sandy', 'Ogden', 'St. George'],
  VT: ['Burlington', 'South Burlington', 'Rutland', 'Barre', 'Montpelier', 'Winooski', 'St. Albans', 'Newport'],
  VA: ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Roanoke'],
  WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton'],
  WV: ['Charleston', 'Huntington', 'Morgantown', 'Parkersburg', 'Wheeling', 'Weirton', 'Fairmont', 'Martinsburg'],
  WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha', 'Racine', 'Appleton', 'Waukesha', 'Eau Claire'],
  WY: ['Cheyenne', 'Casper', 'Laramie', 'Gillette', 'Rock Springs', 'Sheridan', 'Green River', 'Evanston'],
  DC: ['Washington'],
};

const CitySelector = ({ stateAbbr, stateName, selectedCity, onCityPress, onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topCities, setTopCities] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const cities = citiesByState[stateAbbr] || [];
    setTopCities(cities.slice(0, 6)); // Top 6 cities
  }, [stateAbbr]);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      // Use Expo Location API to search for ANY city
      searchCitiesWithGeocode(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Search for cities using Expo Location API (like FilterModal does)
  const searchCitiesWithGeocode = async (query) => {
    try {
      setIsSearching(true);
      
      // Add state name to the query for better results
      const searchQuery = `${query}, ${stateName}`;
      
      // Use the Location API to geocode the search query
      const locations = await Location.geocodeAsync(searchQuery);
      
      if (locations.length > 0) {
        // Get full address information for each result
        const resultsWithNames = await Promise.all(
          locations.slice(0, 8).map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            
            let cityName = query;
            if (address.length > 0) {
              const addr = address[0];
              
              // Only use cities from the selected state
              if (addr.city && addr.region) {
                // Check if this result is in the selected state
                const stateMatch = addr.region === stateName || 
                                 addr.region === stateAbbr;
                
                if (stateMatch) {
                  cityName = addr.city;
                  
                  return {
                    name: cityName,
                    fullAddress: `${addr.city}, ${addr.region}`,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    id: `${loc.latitude}-${loc.longitude}`
                  };
                }
              }
            }
            
            return null;
          })
        );
        
        // Filter out null results and duplicates
        const validResults = resultsWithNames
          .filter(result => result !== null)
          .filter((result, index, self) => 
            index === self.findIndex(r => r.name === result.name)
          );
        
        setSearchResults(validResults);
        setShowSearchResults(validResults.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const renderCity = ({ item }) => {
    const cityName = typeof item === 'string' ? item : item.name;
    const isSelected = selectedCity === cityName;

    return (
      <TouchableOpacity
        style={[
          styles.cityButton,
          isSelected && styles.selectedCity
        ]}
        onPress={() => onCityPress({ name: cityName })}
      >
        <View style={styles.cityContent}>
          <Ionicons 
            name="location" 
            size={20} 
            color={isSelected ? "#fff" : "#fc565b"} 
          />
          <Text style={[
            styles.cityName,
            isSelected && styles.selectedCityText
          ]}>
            {cityName}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    );
  };

  // Display search results if searching, otherwise show top cities
  const displayCities = showSearchResults ? searchResults : topCities.map(city => ({ name: city }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fc565b" />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{stateName}</Text>
          <Text style={styles.subtitle}>
            {selectedCity ? 'Selected city' : 'Select your city'}
          </Text>
        </View>
      </View>

      {/* Show selected city badge if a city is selected */}
      {selectedCity && (
        <View style={styles.selectedCityBadge}>
          <View style={styles.selectedCityContent}>
            <Ionicons name="location" size={24} color="#fc565b" />
            <Text style={styles.selectedCityText}>{selectedCity}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeCityButton}
            onPress={() => onCityPress({ name: null })}
          >
            <Text style={styles.changeCityText}>Change</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Only show search and city list if no city is selected */}
      {!selectedCity && (
        <>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search any city..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {isSearching && (
              <ActivityIndicator size="small" color="#fc565b" style={{ marginLeft: 5 }} />
            )}
            {searchQuery.length > 0 && !isSearching && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {!searchQuery.trim() && (
            <Text style={styles.sectionTitle}>Top Cities in {stateName}</Text>
          )}

          {searchQuery.trim() && showSearchResults && (
            <Text style={styles.sectionTitle}>Search Results in {stateName}</Text>
          )}

          <FlatList
            data={displayCities}
            renderItem={renderCity}
            keyExtractor={(item, index) => typeof item === 'string' ? item : item.id || `city-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            numColumns={2}
            ListEmptyComponent={
              searchQuery.trim() && !isSearching ? (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No cities found in {stateName}
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try a different search term
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width * 0.035,
    color: '#666',
  },
  listContent: {
    paddingBottom: 20,
  },
  cityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 10,
    marginRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    width: (width * 0.9 - 30) / 2,
  },
  selectedCity: {
    backgroundColor: '#fc565b',
    borderColor: '#fc565b',
  },
  cityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cityName: {
    fontSize: width * 0.038,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  selectedCityText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginBottom: 15,
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
  sectionTitle: {
    fontSize: width * 0.042,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  selectedCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#fc565b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedCityText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  changeCityButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeCityText: {
    fontSize: width * 0.038,
    color: '#fc565b',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: width * 0.04,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: width * 0.035,
    color: '#bbb',
    marginTop: 5,
    textAlign: 'center',
  },
});

export default CitySelector;

