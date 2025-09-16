import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatPrice } from '../utils/formatters';
import house1 from '../../assets/house1.jpeg';

const PropertyCard = ({ property, onPress, onHeartPress, isSaved = false }) => {
  return (
    <View style={styles.card}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={onPress}
        style={styles.imageContainer}
      >
        <Image 
          source={property.images && property.images.length > 0 ? 
            (typeof property.images[0] === 'string' || property.images[0].uri ? 
              { uri: typeof property.images[0] === 'string' ? property.images[0] : property.images[0].uri } : 
              property.images[0]) : 
            house1}
          style={styles.image}
          resizeMode="cover"
        />
        
        <TouchableOpacity 
          style={styles.heartIconContainer}
          onPress={onHeartPress}
        >
          <Ionicons 
            name={isSaved ? "heart" : "heart-outline"} 
            size={28}
            color="#fff"
          />
        </TouchableOpacity>
        
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {property.listingStatus || 'Active'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.cardDetails}
        onPress={onPress}
      >
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="bed-outline" size={16} color="#333" />
            <Text style={styles.detailText}>{property.beds} bed</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="shower" size={16} color="#333" />
            <Text style={styles.detailText}>{property.baths} bath</Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialCommunityIcons name="ruler-square" size={16} color="#333" />
            <Text style={styles.detailText}>
              {typeof property.sqft === 'number' ? 
                property.sqft.toLocaleString() : 
                property.sqft} sq ft
            </Text>
          </View>
        </View>
        
        <Text style={styles.address}>{property.address}</Text>
        
        <View style={styles.bottomRowContainer}>
          <Text style={styles.yearBuilt}>Built {property.yearBuilt}</Text>
          <Text style={styles.brokerageInfo}>{property.listingOffice || 'MLS Listing'}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartIconContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  statusBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: '#fc565b',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
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
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    marginLeft: 4,
  },
  address: {
    fontSize: 14,
    color: '#999',
  },
  bottomRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  yearBuilt: {
    fontSize: 12,
    color: '#999',
  },
  brokerageInfo: {
    fontSize: 12,
    color: '#999',
  },
});

export default PropertyCard; 