import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  Animated, Dimensions, Vibration, Platform, StatusBar, Easing 
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSavedProperties } from '../context/SavedPropertiesContext';
import { formatPrice } from '../utils/formatters';
import { auth } from '../config/firebase';
import { getHotdeck, getHotdeckProperties, markHotdeckAsViewed, trackHotdeckPropertyView, trackHotdeckSwipe } from '../services/HotdeckService';
import { getAgentUser } from '../services/AgentUserService';
import { fetchMLSData } from '../api/fetchMLSData';
import PlaceholderImage from '../components/PlaceholderImage';
import { LinearGradient } from 'expo-linear-gradient';

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
  const [viewedPropertyIds, setViewedPropertyIds] = useState(new Set());
  
  const { addToSaved, removeFromSaved } = useSavedProperties();
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const heartScale = useState(new Animated.Value(0))[0];
  const [overlayIcon, setOverlayIcon] = useState(null);
  const shimmerAnimValue = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (isLoading) {
      Animated.loop(
        Animated.timing(shimmerAnimValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }

    return () => {
      shimmerAnimValue.stopAnimation();
    };
  }, [isLoading]);

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
      
      // Handle criteria-based hotdeck (dynamic filtering)
      if (hotdeckData.selection_method === 'criteria' && hotdeckData.filter_criteria) {
        console.log('🔍 Filter-based hotdeck - fetching properties with criteria...');
        console.log('📋 Raw filter_criteria:', hotdeckData.filter_criteria);
        
        // Convert beds/baths to include all values from that number upward
        // If beds = [4], expand to [4, 5, 6, 7, 8, 9, 10] to mean "4 or more"
        const expandedBeds = hotdeckData.filter_criteria.beds?.length > 0 
          ? hotdeckData.filter_criteria.beds.flatMap(bed => {
              const bedNum = parseInt(bed);
              // Create array from bedNum to 10+ (covers most cases)
              return bedNum >= 10 ? ['10+'] : Array.from({length: 10 - bedNum + 1}, (_, i) => bedNum + i);
            })
          : [];
        
        const expandedBaths = hotdeckData.filter_criteria.baths?.length > 0
          ? hotdeckData.filter_criteria.baths.flatMap(bath => {
              const bathNum = parseInt(bath);
              // Create array from bathNum to 10+ (covers most cases)
              return bathNum >= 10 ? ['10+'] : Array.from({length: 10 - bathNum + 1}, (_, i) => bathNum + i);
            })
          : [];
        
        const filters = {
          priceRange: {
            min: hotdeckData.filter_criteria.price_range?.min || 0,
            max: hotdeckData.filter_criteria.price_range?.max || 2000000
          },
          beds: expandedBeds,
          baths: expandedBaths,
          homeType: hotdeckData.filter_criteria.home_type || [],
          sqft: {
            min: hotdeckData.filter_criteria.sqft?.min || 0,
            max: hotdeckData.filter_criteria.sqft?.max || 10000
          },
          yearBuilt: {
            min: hotdeckData.filter_criteria.year_built?.min || 1900,
            max: hotdeckData.filter_criteria.year_built?.max || new Date().getFullYear()
          },
          addressText: hotdeckData.filter_criteria.address_text || '',
          mapRegion: hotdeckData.filter_criteria.map_region ? {
            latitude: hotdeckData.filter_criteria.map_region.latitude,
            longitude: hotdeckData.filter_criteria.map_region.longitude,
            latitudeDelta: hotdeckData.filter_criteria.map_region.latitude_delta,
            longitudeDelta: hotdeckData.filter_criteria.map_region.longitude_delta
          } : null,
          radiusMiles: hotdeckData.filter_criteria.radius_miles || 10
        };
        
        console.log('🔧 Mapped filters for MLS (beds expanded):', filters);
        
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
      // Handle manual property selection hotdeck
      else if (hotdeckData.selection_method === 'manual' || hotdeckData.selection_method === 'properties') {
        console.log('🔍 Manual selection hotdeck - fetching pre-selected properties...');
        
        try {
          const response = await getHotdeckProperties(hotdeckData.id);
          console.log(`✅ Found ${response.properties?.length || 0} manually selected properties`);
          
          if (response.properties && response.properties.length > 0) {
            mappedProperties = response.properties.map((item, idx) => {
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
                id: item['@odata.id'] || item.ListingId || `property-${idx}`,
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
        } catch (apiError) {
          console.error('❌ Error fetching hotdeck properties from API:', apiError);
          // Fall back to empty if API fails
          mappedProperties = [];
        }
      }
      else {
        console.warn('⚠️ Unknown selection method:', hotdeckData.selection_method);
      }
      
      setCurrentDeck(mappedProperties);
      console.log(`✅ Loaded ${mappedProperties.length} properties into deck`);
      
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

  // Track property views when the current card changes
  useEffect(() => {
    if (currentDeck.length > 0 && currentIndex < currentDeck.length) {
      const currentProperty = currentDeck[currentIndex];
      const userId = auth.currentUser?.uid;
      
      // Only track if not already viewed and we have all required data
      if (currentProperty && !viewedPropertyIds.has(currentProperty.id) && userId && hotdeckId && agentId) {
        setViewedPropertyIds(prev => new Set([...prev, currentProperty.id]));
        
        // Track the view (fire and forget - don't await)
        trackHotdeckPropertyView(userId, agentId, hotdeckId, currentProperty.id);
      }
    }
  }, [currentIndex, currentDeck, hotdeckId, agentId, viewedPropertyIds]);

  const handleSwipe = useCallback((cardIndex, direction) => {
    const swipedCard = currentDeck[cardIndex];
    if (!swipedCard) return;

    setSwipedCards(prev => [...prev, { ...swipedCard, swipeDirection: direction }]);
    setCurrentIndex(cardIndex + 1);
    
    // Track the swipe with full property details
    const userId = auth.currentUser?.uid;
    if (userId && hotdeckId && agentId) {
      // Pass property details to store in subcollection
      const propertyDetails = {
        address: swipedCard.address,
        price: swipedCard.price,
        beds: swipedCard.beds,
        baths: swipedCard.baths,
        sqft: swipedCard.sqft,
        images: swipedCard.images ? swipedCard.images.slice(0, 3).map(img => 
          typeof img === 'object' ? img.uri : img
        ) : [],
        listingStatus: swipedCard.listingStatus,
        propertyMatchMetric: swipedCard.propertyMatchMetric
      };
      
      trackHotdeckSwipe(
        userId,
        agentId,
        hotdeckId,
        swipedCard.id,
        direction,
        propertyDetails
      );
    }
    
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
  }, [addToSaved, animateHeart, currentDeck, hotdeckId, agentId]);

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
    const translateX = shimmerAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, width]
    });

    return (
      <View style={styles.container}>
        {/* Header - Exactly like HomeScreen */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/Homerunnhousecolorlogo.png')} style={styles.logo} />
            <Text style={styles.logoText}>HOMERUNN</Text>
          </View>
          <View style={styles.headerIcons}>
            <View style={[styles.actionButton, styles.redoButton]}>
              <Ionicons name="refresh" size={24} color="#ccc" />
            </View>
          </View>
        </View>

        {/* Loading Cards with animated shimmer */}
        <View style={styles.swiperContainer}>
          <View style={styles.skeletonCardsContainer}>
            {/* Bottom card */}
            <View style={[styles.skeletonCard, styles.skeletonCardBottom]}>
              <View style={styles.imageContainer}>
                <View style={styles.imageGrid}>
                  <View style={styles.cardImage}>
                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                      <LinearGradient
                        colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.shimmerGradient}
                      />
                    </Animated.View>
                  </View>
                  <View style={styles.cardImage}>
                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                      <LinearGradient
                        colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.shimmerGradient}
                      />
                    </Animated.View>
                  </View>
                  <View style={styles.cardImage}>
                    <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
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
                <View style={styles.loadingPrice}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailsContainer}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.loadingDetailItem}>
                      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.shimmerGradient}
                        />
                      </Animated.View>
                    </View>
                  ))}
                </View>
                <View style={styles.loadingAddress}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.loadingYearBuilt}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
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

            {/* Middle card - same structure */}
            <View style={[styles.skeletonCard, styles.skeletonCardMiddle]}>
              <View style={styles.imageContainer}>
                <View style={styles.imageGrid}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.cardImage}>
                      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.shimmerGradient}
                        />
                      </Animated.View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Top card - same structure */}
            <View style={[styles.skeletonCard, styles.skeletonCardTop]}>
              <View style={styles.imageContainer}>
                <View style={styles.imageGrid}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.cardImage}>
                      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.shimmerGradient}
                        />
                      </Animated.View>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.loadingPrice}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.detailsContainer}>
                  {[1, 2, 3].map(i => (
                    <View key={i} style={styles.loadingDetailItem}>
                      <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                        <LinearGradient
                          colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={styles.shimmerGradient}
                        />
                      </Animated.View>
                    </View>
                  ))}
                </View>
                <View style={styles.loadingAddress}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
                    <LinearGradient
                      colors={['transparent', 'rgba(255, 255, 255, 0.3)', 'transparent']}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>
                </View>
                <View style={styles.loadingYearBuilt}>
                  <Animated.View style={[styles.shimmerOverlay, { transform: [{ translateX }] }]}>
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
    fontSize: 24,
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
  loadingPrice: {
    height: height * 0.035,
    marginBottom: 1,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  loadingDetailItem: {
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
  loadingAddress: {
    height: height * 0.021,
    marginTop: 4,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  loadingYearBuilt: {
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

export default HotdeckViewScreen;
