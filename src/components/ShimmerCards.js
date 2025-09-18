import React from 'react';
import { View, StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import ShimmerEffect from './ShimmerEffect';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// Layout constants for the Swiper cards - matching HomeScreen
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight + 60);
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 60;
const CARD_MARGIN = 10;
const BOTTOM_PADDING = 25;
const CARD_HEIGHT = height - HEADER_HEIGHT - TAB_BAR_HEIGHT - (CARD_MARGIN * 2) - BOTTOM_PADDING;

const ShimmerCards = () => {
  return (
    <View style={styles.container}>
      <View style={styles.skeletonCardsContainer}>
        <View style={[styles.skeletonCard, styles.skeletonCardBottom]}>
          <ShimmerEffect style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={[styles.skeletonCard, styles.skeletonCardMiddle]}>
          <ShimmerEffect style={{ width: '100%', height: '100%' }} />
        </View>
        <View style={[styles.skeletonCard, styles.skeletonCardTop]}>
          <View style={styles.skeletonImageContainer}>
            <ShimmerEffect style={{ width: '100%', height: '100%' }} />
          </View>
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonPrice}>
              <ShimmerEffect style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={styles.skeletonDetailsRow}>
              <View style={styles.skeletonDetailItem}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={styles.skeletonDetailItem}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={styles.skeletonDetailItem}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
            </View>
            <View style={styles.skeletonAddress}>
              <ShimmerEffect style={{ width: '100%', height: '100%' }} />
            </View>
            <View style={styles.skeletonYearBuilt}>
              <ShimmerEffect style={{ width: '100%', height: '100%' }} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  skeletonCardsContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    height: CARD_HEIGHT,
    width: width * 0.92,
    marginTop: 0 // Removed marginTop completely
  },
  skeletonCard: {
    position: 'absolute',
    width: width * 0.92,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    overflow: 'hidden'
  },
  skeletonCardBottom: {
    transform: [
      { scale: 0.9 },
      { translateY: 20 }
    ],
    zIndex: 1
  },
  skeletonCardMiddle: {
    transform: [
      { scale: 0.95 },
      { translateY: 10 }
    ],
    zIndex: 2
  },
  skeletonCardTop: {
    zIndex: 3
  },
  skeletonImageContainer: {
    height: CARD_HEIGHT * 0.6,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden'
  },
  skeletonDetails: {
    flex: 1,
    padding: 15
  },
  skeletonPrice: {
    height: 30,
    width: '50%',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 15
  },
  skeletonDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 15
  },
  skeletonDetailItem: {
    width: 70,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 15
  },
  skeletonAddress: {
    height: 18,
    width: '85%',
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginBottom: 8
  },
  skeletonYearBuilt: {
    height: 18,
    width: '40%',
    backgroundColor: '#f0f0f0',
    borderRadius: 4
  }
});

export default ShimmerCards; 