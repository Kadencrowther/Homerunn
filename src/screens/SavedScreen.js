import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import FilterModal from '../../src/components/FilterModal';
import { useSavedProperties } from '../../src/context/SavedPropertiesContext';
import { formatPrice } from '../../src/utils/formatters';

const SavedScreen = () => {
  const navigation = useNavigation();
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const { savedProperties, updateSavedProperty } = useSavedProperties();
  const [currentProperties, setCurrentProperties] = useState(savedProperties);
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 2000000 },
    beds: [],
    baths: [],
    sqft: { min: 0, max: 10000 },
    onlyLoved: false,
  });

  useEffect(() => {
    applyFilters(filters);
  }, [savedProperties, filters]);

  const applyFilters = (newFilters) => {
    const filteredProperties = savedProperties.filter(property => {
      const matchesPrice = property.price >= newFilters.priceRange.min && property.price <= newFilters.priceRange.max;
      const matchesBeds = newFilters.beds.length === 0 || newFilters.beds.includes(property.beds);
      const matchesBaths = newFilters.baths.length === 0 || newFilters.baths.includes(property.baths);
      const matchesSqft = property.sqft >= newFilters.sqft.min && property.sqft <= newFilters.sqft.max;
      const matchesLoved = !newFilters.onlyLoved || property.loved;
      return matchesPrice && matchesBeds && matchesBaths && matchesSqft && matchesLoved;
    });
    setCurrentProperties(filteredProperties);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    setFilters({
      priceRange: { min: 0, max: 2000000 },
      beds: [],
      baths: [],
      sqft: { min: 0, max: 10000 },
      onlyLoved: false,
    });
    setCurrentProperties(savedProperties);
    setIsFilterModalVisible(false);
  };

  const toggleLovedStatus = (propertyId) => {
    const updatedProperties = currentProperties.map(property => {
      if (property.id === propertyId) {
        return { ...property, loved: !property.loved };
      }
      return property;
    });
    setCurrentProperties(updatedProperties);
    updateSavedProperty(propertyId, updatedProperties.find(p => p.id === propertyId).loved);
    applyFilters(filters);
  };

  const renderProperty = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PropertyImages', { property: item })}
    >
      <Image 
        source={item.images[0]}
        style={styles.image}
        resizeMode="cover"
      />
      <TouchableOpacity 
        style={styles.starIconContainer}
        onPress={() => toggleLovedStatus(item.id)}
      >
        <Ionicons 
          name={item.loved ? "star" : "star-outline"} 
          size={28}  // Made the star icon slightly larger
          color="#fff"  // White color for both filled and hollow
        />
      </TouchableOpacity>
      <View style={styles.cardDetails}>
        <Text style={styles.price}>{formatPrice(item.price)}</Text>
        <Text style={styles.details}>{item.details}</Text>
        <Text style={styles.address}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Homerunnhousecolorlogo.png')} 
            style={styles.logo}
          />
          <Text style={styles.logoText}>HOMERUNN</Text>
        </View>
      </View>

      {currentProperties.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You have no saved homes</Text>
        </View>
      ) : (
        <FlatList
          data={currentProperties}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProperty}
          contentContainerStyle={styles.propertyList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterModal 
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={applyFilters}
        onClear={clearFilters}
        currentFilters={filters}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fc565b',
  },
  propertyList: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  cardDetails: {
    padding: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  starIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
});

export default SavedScreen;
