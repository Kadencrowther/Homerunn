import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

// Sample data for properties
const properties = [
  {
    id: '1',
    coordinate: { latitude: 40.400, longitude: -111.800 }, // Replace with actual coordinates
    title: '$749,000 - 5 bed, 4 bath',
    description: '1850 South 1600 West, Lehi, UT',
  },
  {
    id: '2',
    coordinate: { latitude: 40.410, longitude: -111.810 },
    title: '$1,129,000 - 5 bed, 4 bath',
    description: '456 Oak Dr, Austin, TX',
  },
  // Add more properties as needed
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProperties, setFilteredProperties] = useState(properties);

  const handleSearch = () => {
    // Filter properties based on searchQuery
    const filtered = properties.filter((property) =>
      property.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProperties(filtered);
  };

  const handleSaveSearch = () => {
    // Logic to save search filters (e.g., to local storage or database)
    console.log('Search filters saved:', searchQuery);
  };

  const handleExtraOption = () => {
    // Placeholder action for other buttons
    console.log('Extra option clicked');
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color="gray" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Address"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch} // Search on enter
        />
        <TouchableOpacity onPress={handleExtraOption}>
          <Ionicons name="eye-outline" size={20} color="black" style={styles.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleExtraOption}>
          <Ionicons name="menu" size={20} color="black" style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* Updated Map View */}
      <MapView
        provider={PROVIDER_GOOGLE} // This enables Google Maps
        style={styles.map}
        initialRegion={{
          latitude: 40.401,
          longitude: -111.801,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        // Optional Google Maps styling
        customMapStyle={[
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ]}
      >
        {filteredProperties.map((property) => (
          <Marker
            key={property.id}
            coordinate={property.coordinate}
            title={property.title}
            description={property.description}
          />
        ))}
      </MapView>

      {/* Save Search Button */}
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveSearch}>
        <Text style={styles.saveButtonText}>Save Search</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
  },
  map: {
    flex: 1,
    marginBottom: 80, // Give space for the button
  },
  saveButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fc565b', // Customize color as needed
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 5, // Shadow for Android
    shadowColor: '#000', // Shadow for iOS
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;
