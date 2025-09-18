import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import ShimmerEffect from './ShimmerEffect';

const { width } = Dimensions.get('window');
const cardWidth = width - 32; // Full width minus padding

const SavedScreenSkeleton = () => {
  // Create an array of 6 skeleton cards
  const skeletonCards = Array(6).fill(0);
  
  return (
    <View style={styles.container}>
      {skeletonCards.map((_, index) => (
        <View key={index} style={styles.card}>
          {/* Image placeholder */}
          <View style={styles.imageContainer}>
            <ShimmerEffect style={styles.image} />
          </View>
          
          {/* Price placeholder */}
          <View style={styles.detailsContainer}>
            <ShimmerEffect style={styles.priceShimmer} />
            
            {/* Property details placeholders */}
            <View style={styles.detailsRow}>
              <ShimmerEffect style={styles.detailShimmer} />
              <ShimmerEffect style={styles.detailShimmer} />
              <ShimmerEffect style={styles.detailShimmer} />
            </View>
            
            {/* Address placeholder */}
            <ShimmerEffect style={styles.addressShimmer} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
  detailsContainer: {
    padding: 12,
  },
  priceShimmer: {
    height: 24,
    width: '40%',
    marginBottom: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailShimmer: {
    height: 16,
    width: '30%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  addressShimmer: {
    height: 16,
    width: '80%',
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
});

export default SavedScreenSkeleton; 