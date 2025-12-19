import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  Animated, Dimensions, Vibration, Platform, StatusBar 
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { formatPrice } from '../utils/formatters';
import { auth } from '../config/firebase';
import { getHotdeck, markHotdeckAsViewed } from '../services/HotdeckService';
import { getAgentUser } from '../services/AgentUserService';
import { fetchMLSData } from '../api/fetchMLSData';
import PlaceholderImage from '../components/PlaceholderImage';
import ShimmerEffect from '../components/ShimmerEffect';

const { width, height } = Dimensions.get('window');

const HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : (StatusBar.currentHeight + 60);
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 83 : 60;
const CARD_MARGIN = 10;
const BOTTOM_PADDING = 25;
const CARD_HEIGHT = height - HEADER_HEIGHT - TAB_BAR_HEIGHT - (CARD_MARGIN * 2) - BOTTOM_PADDING;

const HotdeckViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { hotdeckId, agentId } = route.params;
  
  const [hotdeck, setHotdeck] = useState(null);
  const [agent, setAgent] = useState(null);
  const [currentDeck, setCurrentDeck] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedCards, setSwipedCards] = useState([]);
  
  const { addToSaved, removeFromSaved } = useSavedProperties();
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const heartScale = useState(new Animated.Value(0))[0];
  const [overlayIcon, setOverlayIcon] = useState(null);

  const getStatusColor = (status) => {
    if (status === 'Active') return '#fc565b';
    if (status === 'Pending') return '#FFA500';
    if (status === 'Sold') return '#4CAF50';
    if (status === 'Closed') return '#1652F0';
    return '#888888';
  };

  useEffect(() => {
    loadHotdeck();
  }, [hotdeckId, agentId]);

  const loadHotdeck = async () => {
    try {
      setIsLoading(true);
      
      console.log('🔍 Loading hotdeck:', hotdeckId, 'from agent:', agentId);
      const hotdeckData = await getHotdeck(agentId, hotdeckId);
      if (!hotdeckData) {
        console.error('❌ Hotdeck not found');
        return;
      }
      
      console.log('✅ Hotdeck loaded:', hotdeckData);
      setHotdeck(hotdeckData);
      
      const agentData = await getAgentUser(hotdeckData.agent_id);
      setAgent(agentData);
      
      await markHotdeckAsViewed(agentId, hotdeckId);
      
      let mappedProperties = [];
      
      if (hotdeckData.selection_method === 'criteria' && hotdeckData.filter_criteria) {
        console.log('🔍 Filter-based hotdeck - fetching properties...');
        
        const filters = {
          priceRange: {
            min: hotdeckData.filter_criteria.PriceRange?.Min || 0,
            max: hotdeckData.filter_criteria.PriceRange?.Max || 2000000
          },
          beds: hotdeckData.filter_criteria.Beds || [],
          baths: hotdeckData.filter_criteria.Baths || [],
          homeType: hotdeckData.filter_criteria.HomeType || [],
          sqft: {
            min: hotdeckData.filter_criteria.Sqft?.Min || 0,
            max: hotdeckData.filter_criteria.Sqft?.Max || 10000
          },
          yearBuilt: {
            min: hotdeckData.filter_criteria.YearBuilt?.Min || 1900,
            max: hotdeckData.filter_criteria.YearBuilt?.Max || new Date().getFullYear()
          },
          addressText: hotdeckData.filter_criteria.AddressText || '',
          mapRegion: hotdeckData.filter_criteria.MapRegion ? {
            latitude: hotdeckData.filter_criteria.MapRegion.Latitude,
            longitude: hotdeckData.filter_criteria.MapRegion.Longitude,
            latitudeDelta: hotdeckData.filter_criteria.MapRegion.LatitudeDelta,
            longitudeDelta: hotdeckData.filter_criteria.MapRegion.LongitudeDelta
          } : null,
          radiusMiles: hotdeckData.filter_criteria.RadiusMiles || 10
        };
        
        const result = await fetchMLSData(filters);
        console.log(`✅ Found ${result.properties.length} properties from MLS`);
        
        mappedProperties = result.properties.map((item, idx) => {
          let images = [];
          
          if (item.Media && Array.isArray(item.Media)) {
            images = item.Media
              .filter(m => m.MediaCategory === 'Photo' && m.MediaURL)
              .map(m => ({ uri: m.MediaURL }));
          }
          
          if (images.length === 0) {
            images.push(require('../../assets/house1.jpeg'));
          }
          
          return {
            id: item['@odata.id'] || `property-${idx}`,
            listingId: item.ListingId || '',
            mlsNumber: item.ListingId || item.MLSNumber || '',
            price: item.ListPrice || 0,
            beds: item.BedroomsTotal || 0,
            baths: item.BathroomsTotalInteger || 0,
            sqft: item.LivingArea || 0,
            address: `${item.StreetNumber || ''} ${item.StreetName || ''}, ${item.City || ''}, ${item.StateOrProvince || ''}`,
            images: images,
            yearBuilt: item.YearBuilt ? item.YearBuilt.toString() : 'N/A',
            lotSize: item.LotSizeSquareFeet || 0,
            propertyType: item.PropertyType || '',
            propertySubType: item.PropertySubType || '',
            daysOnMarket: item.DaysOnMarket || 0,
            listingStatus: item.StandardStatus || 'Active',
            description: item.PublicRemarks || '',
            listingOffice: item.ListingOffice || item.ListOfficeName || 'MLS Listing'
          };
        });
      }
      
      setCurrentDeck(mappedProperties);
      console.log(`✅ Loaded ${mappedProperties.length} properties`);
      
    } catch (error) {
      console.error('❌ Error loading hotdeck:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const animateHeart = useCallback(() => {
    setShowHeartOverlay(true);
    setOverlayIcon('♥');
    
    Animated.timing(overlayOpacity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true
    }).start();
    
    heartScale.setValue(0.1);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.2,
        friction: 4,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.timing(heartScale, {
        toValue: 0,
        duration: 300,
        delay: 300,
        useNativeDriver: true
      })
    ]).start();
    
    setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setShowHeartOverlay(false);
        setOverlayIcon(null);
      });
    }, 800);
  }, [heartScale, overlayOpacity]);

  const handleSwipe = useCallback((cardIndex, direction) => {
    const swipedCard = currentDeck[cardIndex];
    if (!swipedCard) return;

    setSwipedCards(prev => [...prev, { ...swipedCard, swipeDirection: direction }]);
    setCurrentIndex(cardIndex + 1);
    
    if (direction === 'left') {
      Vibration.vibrate(50);
    } else if (direction === 'right') {
      addToSaved(swipedCard);
      Vibration.vibrate(50);
    } else if (direction === 'top') {
      addToSaved({ ...swipedCard, loved: true });
      animateHeart();
      Vibration.vibrate([0, 50, 50, 100]);
    }
  }, [addToSaved, animateHeart, currentDeck]);

  const handleRedo = useCallback(() => {
    if (swipedCards.length === 0) return;
    
    const lastSwipedCard = swipedCards[swipedCards.length - 1];
    const swipeDirection = lastSwipedCard.swipeDirection;
    
    setSwipedCards(prev => prev.slice(0, -1));
    setCurrentIndex(prev => Math.max(0, prev - 1));
    setCurrentDeck(prev => {
      const newDeck = [...prev];
      newDeck.splice(currentIndex - 1, 0, lastSwipedCard);
      return newDeck;
    });
    
    if (swipeDirection === 'right' || swipeDirection === 'top') {
      removeFromSaved(lastSwipedCard.id);
    }
  }, [swipedCards, currentIndex, removeFromSaved]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* Header - Exactly like loaded state */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/Homerunnhousecolorlogo.png')} style={styles.logo} />
            <Text style={styles.logoText}>HOMERUNN</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.redoButton
              ]} 
              disabled={true}
            >
              <Ionicons 
                name="refresh" 
                size={24} 
                color="#ccc"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Loading Cards */}
        <View style={styles.swiperContainer}>
          <View style={styles.skeletonCardsContainer}>
            {/* Bottom card */}
            <View style={[styles.skeletonCard, styles.skeletonCardBottom]}>
              <View style={styles.skeletonImageContainer}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
            </View>
            
            {/* Middle card */}
            <View style={[styles.skeletonCard, styles.skeletonCardMiddle]}>
              <View style={styles.skeletonImageContainer}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
            </View>
            
            {/* Top card with details */}
            <View style={[styles.skeletonCard, styles.skeletonCardTop]}>
              <View style={styles.skeletonImageContainer}>
                <ShimmerEffect style={{ width: '100%', height: '100%' }} />
              </View>
              <View style={styles.skeletonDetails}>
                <ShimmerEffect style={styles.skeletonPrice} />
                <View style={styles.skeletonDetailsRow}>
                  <ShimmerEffect style={styles.skeletonDetailItem} />
                  <ShimmerEffect style={styles.skeletonDetailItem} />
                  <ShimmerEffect style={styles.skeletonDetailItem} />
                </View>
                <ShimmerEffect style={styles.skeletonAddress} />
                <ShimmerEffect style={styles.skeletonYearBuilt} />
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={1} style={styles.container}>
      {/* Header - Exactly like HomeScreen without filter and bell */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/Homerunnhousecolorlogo.png')} style={styles.logo} />
          <Text style={styles.logoText}>HOMERUNN</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity 
            style={[
              styles.actionButton, 
              styles.redoButton
            ]} 
            onPress={handleRedo}
            disabled={swipedCards.length === 0}
          >
            <Ionicons 
              name="refresh" 
              size={24} 
              color={swipedCards.length === 0 ? '#ccc' : 'black'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Swiper */}
      <View style={styles.swiperContainer}>
        {currentDeck.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="home-outline" size={80} color="#ccc" />
            <Text style={styles.emptyText}>No properties found</Text>
            <Text style={styles.emptySubtext}>Try different filters or check back later</Text>
          </View>
        ) : (
          <Swiper
            cards={currentDeck}
            renderCard={(card) => {
              if (!card) return null;
              
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => {
                    navigation.navigate('PropertyImages', { property: card, sourceScreen: 'Hotdeck' });
                  }}
                  activeOpacity={1}
                >
                  <View style={styles.imageContainer}>
                    {card.images && card.images.length > 0 ? (
                      <View style={styles.imageGrid}>
                        <Image 
                          source={typeof card.images[0] === 'number' ? card.images[0] : { uri: card.images[0].uri }} 
                          style={styles.stackedImage} 
                          resizeMode="cover" 
                        />
                        {card.images.length > 1 ? (
                          <Image 
                            source={typeof card.images[1] === 'number' ? card.images[1] : { uri: card.images[1].uri }} 
                            style={styles.stackedImage} 
                            resizeMode="cover" 
                          />
                        ) : (
                          <PlaceholderImage style={styles.stackedImage} />
                        )}
                        {card.images.length > 2 ? (
                          <Image 
                            source={typeof card.images[2] === 'number' ? card.images[2] : { uri: card.images[2].uri }} 
                            style={styles.stackedImage} 
                            resizeMode="cover" 
                          />
                        ) : (
                          <PlaceholderImage style={styles.stackedImage} />
                        )}
                      </View>
                    ) : (
                      <View style={styles.imageGrid}>
                        <PlaceholderImage style={styles.stackedImage} />
                        <PlaceholderImage style={styles.stackedImage} />
                        <PlaceholderImage style={styles.stackedImage} />
                      </View>
                    )}
                    
                    {card.listingStatus && (
                      <View style={[
                        styles.statusBadge, 
                        { backgroundColor: getStatusColor(card.listingStatus) }
                      ]}>
                        <Text style={styles.statusText}>{card.listingStatus}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardDetails}>
                    <Text style={styles.price}>{formatPrice(card.price)}</Text>
                    <View style={styles.detailsContainer}>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="bed-outline" size={16} color="#333" />
                        <Text style={styles.details}>{card.beds} bed</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="shower" size={16} color="#333" />
                        <Text style={styles.details}>{card.baths} bath</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialCommunityIcons name="ruler-square" size={16} color="#333" />
                        <Text style={styles.details}>{card.sqft.toLocaleString()} sq ft</Text>
                      </View>
                    </View>
                    <Text style={styles.address}>{card.address}</Text>
                    <View style={styles.bottomRow}>
                      {card.yearBuilt !== 'N/A' && (
                        <Text style={styles.yearBuilt}>Built in {card.yearBuilt}</Text>
                      )}
                      <Text style={styles.brokerageText}>
                        {card.listingOffice || 'MLS Listing'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            stackSize={3}
            backgroundColor="transparent"
            cardVerticalMargin={0}
            cardHorizontalMargin={width * 0.04}
            marginBottom={BOTTOM_PADDING}
            marginTop={20}
            onSwipedLeft={(cardIndex) => handleSwipe(cardIndex, 'left')}
            onSwipedRight={(cardIndex) => handleSwipe(cardIndex, 'right')}
            onSwipedTop={(cardIndex) => handleSwipe(cardIndex, 'top')}
            disableBottomSwipe
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
                    color: '#fff',
                    fontSize: height * 0.2,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: CARD_HEIGHT,
                    borderRadius: 10,
                  }
                }
              },
              right: {
                title: '✓',
                style: {
                  label: {
                    backgroundColor: 'transparent',
                    color: '#fff',
                    fontSize: height * 0.2,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: CARD_HEIGHT,
                    borderRadius: 10,
                  }
                }
              },
              top: {
                title: '♥',
                style: {
                  label: {
                    backgroundColor: 'transparent',
                    color: '#fff',
                    fontSize: height * 0.2,
                  },
                  wrapper: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: CARD_HEIGHT,
                    borderRadius: 10,
                  }
                }
              }
            }}
            containerStyle={{
              backgroundColor: 'transparent',
              paddingHorizontal: width * 0.02
            }}
            cardStyle={{
              position: 'absolute',
              top: 0,
              width: width * 0.92
            }}
          />
        )}
      </View>

      {/* Heart Overlay */}
      {showHeartOverlay && (
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Text style={styles.heartSymbol}>{overlayIcon}</Text>
          </Animated.View>
        </Animated.View>
      )}
    </TouchableOpacity>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fc565b'
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8
  },
  actionButton: {
    // Empty for consistency with HomeScreen
  },
  redoButton: {
    marginHorizontal: 6
  },
  swiperContainer: {
    flex: 1,
    paddingTop: height * 0.01,
    paddingBottom: height * 0.01,
    backgroundColor: '#fff'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    elevation: 3,
    height: CARD_HEIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  imageContainer: {
    height: '82%',
    flexDirection: 'column'
  },
  imageGrid: {
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  stackedImage: {
    width: '100%',
    height: '33.33%',
    resizeMode: 'cover',
  },
  cardDetails: {
    flex: 1,
    padding: 8,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 247, 250, 0.95)',
  },
  price: {
    fontSize: height * 0.035,
    fontWeight: 'bold',
    color: '#333',
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
  details: {
    fontSize: height * 0.024,
    color: '#333',
    fontWeight: '600',
    marginLeft: 4
  },
  address: {
    fontSize: height * 0.021,
    color: '#333'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4
  },
  yearBuilt: {
    fontSize: height * 0.018,
    color: '#666',
    flex: 1,
    marginRight: 8
  },
  brokerageText: {
    fontSize: height * 0.018,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right'
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    padding: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: height * 0.018,
    fontWeight: 'bold',
    color: '#fff',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  heartSymbol: {
    fontSize: height * 0.15,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  skeletonCardsContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    height: CARD_HEIGHT,
    width: width * 0.92,
    marginTop: 30,
    alignSelf: 'center',
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
    height: CARD_HEIGHT * 0.82,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
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
  },
});

export default HotdeckViewScreen;
