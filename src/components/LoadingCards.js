import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, StatusBar, Text, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight + 60);
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 60;
const CARD_MARGIN = 10;
const BOTTOM_PADDING = 25;
const CARD_HEIGHT = height - HEADER_HEIGHT - TAB_BAR_HEIGHT - (CARD_MARGIN * 2) - BOTTOM_PADDING;

const LoadingCards = () => {
  console.log('LoadingCards component is rendering');
  const shimmerAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnimValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    return () => {
      shimmerAnimValue.stopAnimation();
    };
  }, []);

  const translateX = shimmerAnimValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width]
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/Homerunnhousecolorlogo.png')} style={styles.logo} />
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
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
              <View style={styles.address}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.yearBuilt}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
            </View>
          </View>
          
          {/* Middle card */}
          <View style={[styles.skeletonCard, styles.skeletonCardMiddle]}>
            <View style={styles.imageContainer}>
              <View style={styles.imageGrid}>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
              <View style={styles.address}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.yearBuilt}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
            </View>
          </View>
          
          {/* Top card */}
          <View style={[styles.skeletonCard, styles.skeletonCardTop]}>
            <View style={styles.imageContainer}>
              <View style={styles.imageGrid}>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.cardImage}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
            </View>
            <View style={styles.cardDetails}>
              <View style={styles.price}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailItem}>
                  <Animated.View 
                    style={[
                      styles.shimmerOverlay,
                      { transform: [{ translateX }] }
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
              </View>
              <View style={styles.address}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              </View>
              <View style={styles.yearBuilt}>
                <Animated.View 
                  style={[
                    styles.shimmerOverlay,
                    { transform: [{ translateX }] }
                  ]}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
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
    backgroundColor: '#E1E9EE',
    marginBottom: 0,
    overflow: 'hidden',
    position: 'relative'
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
    marginBottom: 1,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    height: 24,
    width: 70,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  address: {
    height: height * 0.021,
    marginTop: 4,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  yearBuilt: {
    height: height * 0.018,
    marginTop: 4,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    flex: 1,
    width: '200%',
  }
});

export default LoadingCards; 