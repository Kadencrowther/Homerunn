import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Dimensions, Vibration, Easing } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons } from '@expo/vector-icons'; // Assuming you're using Expo for icons
import { useNavigation } from '@react-navigation/native';
import FilterModal from '../../src/components/FilterModal';
import { useSavedProperties } from '../../src/context/SavedPropertiesContext';
import { formatPrice } from '../../src/utils/formatters';
import SwipeTutorial from '../../src/components/SwipeTutorial';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Example data for properties (expanded to 5 properties)
const properties = [
  {
    id: '1',
    images: [
      require('../../assets/house1.jpeg'),
      require('../../assets/house1.jpeg'),
    ],
    price: 749000,  // Changed to number for easier filtering
    beds: 5,
    baths: 4,
    sqft: 3890,
    details: '5 bed • 4 bath • 3,890 sq ft',
    address: '1850 South 1600 West, Lehi, UT 84660',
  },
  {
    id: '2',
    images: [
      require('../../assets/house2.jpeg'),
      require('../../assets/house2.jpeg'),
    ],
    price: 1129000,
    beds: 5,
    baths: 4,
    sqft: 5000,
    details: '5 bed • 4 bath • 5,000 sq ft',
    address: '456 Oak Dr, Austin, TX',
  },
  {
    id: '3',
    images: [
      require('../../assets/house3.jpeg'),
      require('../../assets/house3.jpeg'),
    ],
    price: 899000,
    beds: 4,
    baths: 3,
    sqft: 3200,
    details: '4 bed • 3 bath • 3,200 sq ft',
    address: '789 Pine Lane, Salt Lake City, UT',
  },
  {
    id: '4',
    images: [
      require('../../assets/house4.jpeg'),
      require('../../assets/house4.jpeg'),
    ],
    price: 1450000,
    beds: 6,
    baths: 5,
    sqft: 4500,
    details: '6 bed • 5 bath • 4,500 sq ft',
    address: '321 Maple Ave, Draper, UT',
  },
  {
    id: '5',
    images: [
      require('../../assets/house5.jpeg'),
      require('../../assets/house5.jpeg'),
    ],
    price: 679000,
    beds: 4,
    baths: 3,
    sqft: 2800,
    details: '4 bed • 3 bath • 2,800 sq ft',
    address: '567 Elm Street, Sandy, UT',
  },
  {
    id: '6',
    images: [
      require('../../assets/house6.jpeg'),
      require('../../assets/house6.jpeg'),
    ],
    price: 1350000,
    beds: 6,
    baths: 4,
    sqft: 4800,
    details: '6 bed • 4 bath • 4,800 sq ft',
    address: '2234 Highland Drive, Holladay, UT 84124',
  },
  {
    id: '7',
    images: [
      require('../../assets/house7.jpeg'),
      require('../../assets/house7.jpeg'),
    ],
    price: 875000,
    beds: 4,
    baths: 3,
    sqft: 3500,
    details: '4 bed • 3 bath • 3,500 sq ft',
    address: '943 East 900 South, Salt Lake City, UT 84105',
  },
  {
    id: '8',
    images: [
      require('../../assets/house8.jpeg'),
      require('../../assets/house8.jpeg'),
    ],
    price: 1750000,
    beds: 7,
    baths: 5,
    sqft: 6500,
    details: '7 bed • 5 bath • 6,500 sq ft',
    address: '1122 South Temple, Salt Lake City, UT 84102',
  },
  {
    id: '9',
    images: [
      require('../../assets/house9.jpeg'),
      require('../../assets/house9.jpeg'),
    ],
    price: 950000,
    beds: 5,
    baths: 3,
    sqft: 4100,
    details: '5 bed • 3 bath • 4,100 sq ft',
    address: '3456 Walker Lane, Sandy, UT 84093',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [overlayIcon, setOverlayIcon] = useState(null);
  const [swipedCards, setSwipedCards] = useState([]); // Stack of swiped cards
  const [currentIndex, setCurrentIndex] = useState(0); // Track current card index
  const [currentDeck, setCurrentDeck] = useState([...properties]); // Current deck of cards
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 2000000 },
    beds: [],
    baths: [],
    sqft: { min: 0, max: 10000 }
  });
  const { addToSaved, removeFromSaved } = useSavedProperties();
  const [showTutorial, setShowTutorial] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showStarOverlay, setShowStarOverlay] = useState(false);
  const starScale = useState(new Animated.Value(0))[0];
  const [particles] = useState([...Array(8)].map(() => new Animated.ValueXY({ x: 0, y: 0 })));

  useEffect(() => {
    if (!hasInteracted) {
      const timer = setTimeout(() => {
        if (!hasInteracted) {
          setShowTutorial(true);
        }
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [hasInteracted]);

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    if (showTutorial) {
      setShowTutorial(false);
    }
  };

  const animateStarWithParticles = () => {
    // Reset values
    starScale.setValue(0);
    particles.forEach(particle => particle.setValue({ x: 0, y: 0 }));
    
    // Create particle animations with smoother contraction
    const particleAnimations = particles.map((particle, index) => {
      const angle = (index * Math.PI * 2) / particles.length;
      const distance = 120;
      
      return Animated.sequence([
        Animated.spring(particle, {
          toValue: {
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance
          },
          useNativeDriver: true,
          friction: 35,
          tension: 450
        }),
        Animated.spring(particle, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          friction: 22,    // Reduced friction for smoother contraction
          tension: 250,    // Reduced tension for smoother contraction
          restSpeedThreshold: 100,
          restDisplacementThreshold: 40,
          velocity: 0.5    // Added small velocity for smoother start of contraction
        })
      ]);
    });

    // Star animation with smoother contraction
    const starAnimation = Animated.sequence([
      Animated.spring(starScale, {
        toValue: 1.4,
        useNativeDriver: true,
        friction: 35,
        tension: 450
      }),
      Animated.spring(starScale, {
        toValue: 0.8,
        useNativeDriver: true,
        friction: 22,     // Reduced friction to match particles
        tension: 250,     // Reduced tension to match particles
        restSpeedThreshold: 100,
        restDisplacementThreshold: 40,
        velocity: 0.5     // Added small velocity for smoother start of contraction
      })
    ]);

    // Overlay animation
    const overlayAnimation = Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 10,
      useNativeDriver: true,
    });

    // Run all animations
    Animated.parallel([
      overlayAnimation,
      starAnimation,
      ...particleAnimations
    ]).start(() => {
      // Fade out overlay
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 10,
        delay: 15,
        useNativeDriver: true,
      }).start(() => setShowStarOverlay(false));
    });
  };

  const handleSwipe = (cardIndex, direction) => {
    handleInteraction();
    
    const swipedCard = currentDeck[cardIndex];
    if (!swipedCard) return;

    if (direction === 'top') {
      setShowStarOverlay(true);
      Vibration.vibrate(20);
      animateStarWithParticles();
    }

    setSwipedCards(prev => [{
      ...swipedCard,
      action: direction,
      swipeIndex: currentIndex
    }, ...prev]);

    setCurrentIndex(prev => prev + 1);

    if (direction === 'left') {
      removeFromSaved(swipedCard.id);
    } else if (direction === 'right' || direction === 'top') {
      addToSaved({ ...swipedCard, loved: direction === 'top' });
    }
  };

  const handleRedo = () => {
    handleInteraction(); // Dismiss tutorial on redo
    setHasInteracted(true);
    setShowTutorial(false);
    
    if (swipedCards.length === 0) return;
    
    const cardToRedo = swipedCards[0];
    setCurrentDeck(prev => [cardToRedo, ...prev]);
    setSwipedCards(prev => prev.slice(1));
    setCurrentIndex(prev => prev - 1);
  };

  const renderCard = (property) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('PropertyImages', { property })}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={property.images[0]}
          style={styles.image}
          resizeMode="cover"
        />
        <Image 
          source={property.images[1]}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      <View style={styles.cardDetails}>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        <Text style={styles.details}>{property.details}</Text>
        <Text style={styles.address}>{property.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    
    // Filter properties based on criteria
    const filteredProperties = properties.filter(property => {
      // Price filter
      const priceInRange = property.price >= newFilters.priceRange.min && 
                          property.price <= newFilters.priceRange.max;
      if (!priceInRange) return false;
      
      // Beds filter
      if (newFilters.beds?.length > 0) {
        const matchesBeds = newFilters.beds.some(bed => {
          const bedNum = parseInt(bed);
          if (bed === '5+') return property.beds >= 5;
          return property.beds === bedNum;
        });
        if (!matchesBeds) return false;
      }
      
      // Baths filter
      if (newFilters.baths?.length > 0) {
        const matchesBaths = newFilters.baths.some(bath => {
          const bathNum = parseInt(bath);
          if (bath === '5+') return property.baths >= 5;
          return property.baths === bathNum;
        });
        if (!matchesBaths) return false;
      }
      
      // Square footage filter
      const sqftInRange = property.sqft >= newFilters.sqft.min && 
                         property.sqft <= newFilters.sqft.max;
      if (!sqftInRange) return false;
      
      return true;
    });

    setCurrentDeck(filteredProperties);
    setCurrentIndex(0);
    setIsFilterModalVisible(false);
  };

  const clearFilters = () => {
    const defaultFilters = {
      priceRange: { min: 0, max: 2000000 },
      beds: [],
      baths: [],
      sqft: { min: 0, max: 10000 }
    };
    setFilters(defaultFilters);
    setCurrentIndex(0);
    setCurrentDeck([...properties]); // Reset to original properties
    setIsFilterModalVisible(false);
  };

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      onPress={handleInteraction}
      style={styles.container}
    >
      {/* Header with adjusted padding */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/Homerunnhousecolorlogo.png')} 
            style={styles.logo}
          />
          <Text style={styles.logoText}>HOMERUNN</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            onPress={handleRedo}
            style={[
              styles.redoButton,
              { opacity: swipedCards.length > 0 ? 1 : 0.5 }
            ]}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={swipedCards.length > 0 ? "black" : "#ccc"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsFilterModalVisible(true)}>
            <Ionicons name="filter" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipeable Cards Container */}
      <View style={styles.swiperContainer}>
        <Swiper
          cards={currentDeck}
          renderCard={(card) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('PropertyImages', { property: card })}
            >
              <View style={styles.imageContainer}>
                <Image 
                  source={card.images[0]}
                  style={styles.image}
                  resizeMode="cover"
                />
                <Image 
                  source={card.images[1]}
                  style={styles.image}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.price}>{formatPrice(card.price)}</Text>
                <Text style={styles.details}>{card.details}</Text>
                <Text style={styles.address}>{card.address}</Text>
              </View>
            </TouchableOpacity>
          )}
          stackSize={3}
          backgroundColor="transparent"
          cardVerticalMargin={0}
          cardHorizontalMargin={width * 0.04}
          marginBottom={60}
          marginTop={20}
          onSwipedLeft={(cardIndex) => handleSwipe(cardIndex, 'left')}
          onSwipedRight={(cardIndex) => handleSwipe(cardIndex, 'right')}
          onSwipedTop={(cardIndex) => handleSwipe(cardIndex, 'top')}
          disableBottomSwipe={true}
          disableTopSwipe={false}
          cardIndex={0}
          stackAnimationFriction={10}
          stackAnimationTension={20}
          stackSeparation={14}
          outputRotationRange={["-10deg", "0deg", "10deg"]}
          overlayLabels={{
            left: {
              title: '×',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  color: '#fff',
                  fontSize: height * 0.2,
                  borderWidth: 0,
                  position: 'absolute',
                  zIndex: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: height * 0.7,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 5,
                }
              }
            },
            right: {
              title: '♥',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  color: '#fff',
                  fontSize: height * 0.2,
                  borderWidth: 0,
                  position: 'absolute',
                  zIndex: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: height * 0.7,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 5,
                }
              }
            },
            top: {
              title: '★',
              style: {
                label: {
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                  color: '#fff',
                  fontSize: height * 0.2,
                  borderWidth: 0,
                  position: 'absolute',
                  zIndex: 10,
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: height * 0.7,
                  borderRadius: 10,
                  overflow: 'hidden',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  zIndex: 5,
                }
              }
            },
          }}
          overlayLabelStyle={{
            fontSize: height * 0.2,
            color: '#fff',
            fontWeight: 'bold',
          }}
          animateOverlayLabelsOpacity
          overlayOpacityHorizontalThreshold={width / 7}
          overlayOpacityVerticalThreshold={height / 8}
          inputOverlayLabelsOpacityRangeX={[-width / 3, -width / 7, 0, width / 7, width / 3]}
          inputOverlayLabelsOpacityRangeY={[-height / 4, -height / 8, 0, height / 8, height / 4]}
          outputOverlayLabelsOpacityRangeX={[1, 0.2, 0, 0.2, 1]}
          outputOverlayLabelsOpacityRangeY={[1, 0.2, 0, 0.2, 1]}
          overlayOpacityReverse={false}
          swipeAnimationDuration={400}
          animateCardOpacity={false}
          useViewOverflow={true}
          containerStyle={{
            backgroundColor: 'transparent',
            paddingHorizontal: width * 0.02,
          }}
          cardStyle={{
            position: 'absolute',
            top: 0,
            width: width * 0.92,
          }}
        />
      </View>

      {/* Star Overlay */}
      {showStarOverlay && (
        <Animated.View 
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            }
          ]}
        >
          {/* Particles */}
          {particles.map((particle, index) => (
            <Animated.View
              key={index}
              style={[
                styles.particle,
                {
                  transform: [
                    { translateX: particle.x },
                    { translateY: particle.y },
                    { scale: starScale }
                  ]
                }
              ]}
            />
          ))}
          
          {/* Main Star - using the same star symbol as the swipe overlay */}
          <Animated.View
            style={{
              transform: [{ scale: starScale }]
            }}
          >
            <Text style={styles.starSymbol}>★</Text>
          </Animated.View>
        </Animated.View>
      )}

      <FilterModal 
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={applyFilters}
        onClear={clearFilters}
        currentFilters={filters}
      />

      <SwipeTutorial 
        visible={showTutorial} 
        onDismiss={() => {
          setShowTutorial(false);
          setHasInteracted(true);
        }}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    height: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 6 
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  imageContainer: {
    height: height * 0.45, // 45% of screen height for images
    flexDirection: 'column',
  },
  image: {
    width: '100%',
    height: '50%', // Each image takes half of the imageContainer
    resizeMode: 'cover',
  },
  cardDetails: {
    padding: height * 0.02,
    height: height * 0.25,
    justifyContent: 'space-around',
    backgroundColor: '#f5f7fa', // Slightly lighter frosted gray
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 4
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  price: {
    fontSize: height * 0.045,
    fontWeight: 'bold',
    color: '#333',
  },
  details: {
    fontSize: height * 0.028,
    color: '#333',
    marginTop: height * 0.01,
    fontWeight: '600',
  },
  address: {
    fontSize: height * 0.02,
    color: '#333', // Changed from #999 to #333 to match other text
    marginTop: height * 0.01,
  },
  swiperContainer: {
    flex: 1,
    paddingTop: height * 0.01, // 1% of screen height
    paddingBottom: height * 0.01,
    backgroundColor: '#fff', // Added white background
  },
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    opacity: 0, // Start transparent
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF', // Changed from gold to white
    borderRadius: 4,
  },
  starSymbol: {
    fontSize: height * 0.15, // Reduced from 0.2
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
 