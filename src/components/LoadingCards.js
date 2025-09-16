import React from 'react';
import { View, StyleSheet, Dimensions, Platform, StatusBar, Text, Image } from 'react-native';
import ShimmerEffect from './ShimmerEffect';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import homerunnLogo from '../../assets/Homerunnhousecolorlogo.png';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight + 60);
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 60;
const CARD_MARGIN = 10;
const BOTTOM_PADDING = 25;
const CARD_HEIGHT = height - HEADER_HEIGHT - TAB_BAR_HEIGHT - (CARD_MARGIN * 2) - BOTTOM_PADDING;

const LoadingCards = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={homerunnLogo} style={styles.logo} />
          <Text style={styles.logoText}>HOMERUNN</Text>
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.iconButton}>
            <Ionicons name="refresh" size={24} color="#ccc" />
          </View>
          <View style={styles.iconButton}>
            <FontAwesome name="bell-o" size={20} color="black" />
          </View>
          <View style={styles.iconButton}>
            <Ionicons name="filter" size={24} color="black" />
          </View>
        </View>
      </View>
      
      <View style={styles.swiperContainer}>
        <View style={styles.skeletonCardsContainer}>
          <View style={[styles.skeletonCard, styles.skeletonCardBottom]}>
            <View style={styles.imageContainer}>
              <View style={styles.imageGrid}>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <ShimmerEffect style={{ width: '60%', height: 30, borderRadius: 4 }} />
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
              </View>
              <View style={styles.address}>
                <ShimmerEffect style={{ width: '90%', height: 18, borderRadius: 4 }} />
              </View>
              <View style={styles.yearBuilt}>
                <ShimmerEffect style={{ width: '40%', height: 18, borderRadius: 4 }} />
              </View>
            </View>
          </View>
          <View style={[styles.skeletonCard, styles.skeletonCardMiddle]}>
            <View style={styles.imageContainer}>
              <View style={styles.imageGrid}>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <ShimmerEffect style={{ width: '60%', height: 30, borderRadius: 4 }} />
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
              </View>
              <View style={styles.address}>
                <ShimmerEffect style={{ width: '90%', height: 18, borderRadius: 4 }} />
              </View>
              <View style={styles.yearBuilt}>
                <ShimmerEffect style={{ width: '40%', height: 18, borderRadius: 4 }} />
              </View>
            </View>
          </View>
          <View style={[styles.skeletonCard, styles.skeletonCardTop]}>
            <View style={styles.imageContainer}>
              <View style={styles.imageGrid}>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
                <View style={styles.cardImage}>
                  <ShimmerEffect style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <ShimmerEffect style={{ width: '60%', height: 30, borderRadius: 4 }} />
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
                <View style={styles.detailItem}>
                  <ShimmerEffect style={{ width: 70, height: 24, borderRadius: 4 }} />
                </View>
              </View>
              <View style={styles.address}>
                <ShimmerEffect style={{ width: '90%', height: 18, borderRadius: 4 }} />
              </View>
              <View style={styles.yearBuilt}>
                <ShimmerEffect style={{ width: '40%', height: 18, borderRadius: 4 }} />
              </View>
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
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: HEADER_HEIGHT - 30,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 8
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fc565b'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8
  },
  iconButton: {
    marginHorizontal: 6
  },
  swiperContainer: {
    flex: 1,
    paddingTop: height * 0.01,
    paddingBottom: height * 0.01,
    backgroundColor: '#fff'
  },
  skeletonCardsContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    height: CARD_HEIGHT,
    width: width * 0.92,
    marginTop: 30,
    alignSelf: 'center'
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
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
  imageContainer: {
    height: '82%',
    flexDirection: 'column'
  },
  imageGrid: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  cardImage: {
    width: '100%',
    height: '33.33%',
    backgroundColor: '#f0f0f0',
    marginBottom: 0
  },
  cardDetails: {
    flex: 1,
    padding: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 247, 250, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 6
  },
  price: {
    height: height * 0.035,
    marginBottom: 1
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12
  },
  address: {
    height: height * 0.021,
    marginTop: 4
  },
  yearBuilt: {
    height: height * 0.018,
    marginTop: 4
  }
});

export default LoadingCards; 