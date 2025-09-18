import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Image, Dimensions, ActivityIndicator, FlatList, Animated } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { formatPrice } from '../utils/formatters';
import ScheduleModal from '../components/ScheduleModal';
import { fetchMLSData } from '../api/fetchMLSData';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

const PropertyDetails = ({ route, navigation }) => {
  const { property: initialProperty } = route.params;
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const flatListRef = useRef(null);

  // Add state for the full property data
  const [property, setProperty] = useState(initialProperty);

  // Add useEffect to fetch the complete property data when the component mounts
  useEffect(() => {
    const fetchCompletePropertyData = async () => {
      try {
        setIsLoading(true);
        
        // First try to get the ListingId directly
        let propertyId = initialProperty.ListingId || initialProperty.listingId || initialProperty.mlsNumber;
        
        // If no direct ID, try to extract from URL
        if (!propertyId && typeof initialProperty.id === 'string' && initialProperty.id.includes('api.bridgedataoutput.com')) {
          try {
            propertyId = initialProperty.id.split("('")[1].split("')")[0];
            console.log('Extracted property ID from URL:', propertyId);
          } catch (error) {
            console.error('Error extracting ID from URL:', error);
          }
        }
        
        console.log('Initial property:', initialProperty);
        console.log('Using property ID for API call:', propertyId);
        
        if (!propertyId) {
          console.error('No property ID found for API call');
          setIsLoading(false);
          setProperty(initialProperty);
          return;
        }
        
        // Call the API with the explicit listingId parameter
        console.log('Making API call with listingId:', propertyId);
        const result = await fetchMLSData({ listingId: propertyId });
        
        if (result && result.properties && result.properties.length > 0) {
          const completeProperty = result.properties[0];
          console.log('API returned property with ID:', completeProperty.ListingId);
          
          // Update the property state with the complete data
          setProperty({
            ...initialProperty,
            ...completeProperty,
            // Ensure these IDs are explicitly set
            ListingId: completeProperty.ListingId,
            listingId: completeProperty.ListingId,
            mlsNumber: completeProperty.ListingId
          });
        } else {
          console.warn('No property data returned from API');
          setProperty(initialProperty);
        }
      } catch (err) {
        console.error('Error fetching complete property data:', err);
        setError('Failed to load complete property data');
        setProperty(initialProperty);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCompletePropertyData();
  }, [initialProperty]);

  // Format data for display, handling missing values
  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    return `${value}${unit}`;
  };

  const calculateDaysOnMarket = () => {
    // First check if we have a valid listingContractDate
    if (property.ListingContractDate) {
      try {
        // Parse the date string
        const listDate = new Date(property.ListingContractDate);
        const today = new Date();
        
        // Check if the date is valid
        if (!isNaN(listDate.getTime())) {
          // Calculate difference in days
          const diffTime = Math.abs(today - listDate);
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return diffDays.toString();
        }
      } catch (error) {
        console.error('Error calculating days on market:', error);
      }
    }
    
    // If we don't have a valid date or calculation failed, return 0
    return '0';
  };

  const mapPropertyData = () => {
    // Create a mapped property object with standardized field names
    const mappedProperty = {
      ...property,
      
      // Add price with proper fallback
      price: property.ListPrice || property.price || 0,
      
      // Basic property info - map from MLS field names to your app's structure
      beds: property.BedroomsTotal || property.beds || 0,
      baths: property.BathroomsTotalInteger || property.BathroomsFull || property.baths || 0,
      sqft: property.BuildingAreaTotal || property.LivingArea || property.sqft || 0,
      lotSize: property.LotSizeSquareFeet || property.LotSizeArea || property.lotSize || 0,
      yearBuilt: property.YearBuilt || property.yearBuilt || '-',
      mlsNumber: property.ListingId || property.mlsNumber || '-',
      listingOffice: property.ListOfficeName || property.listingOffice || '-',
      propertyType: property.PropertyType || property.propertyType || '-',
      propertySubType: property.PropertySubType || property.propertySubType || '-',
      listingStatus: property.MlsStatus || property.StandardStatus || property.listingStatus || 'Active',
      
      // Add address with proper fallback
      address: property.UnparsedAddress || property.address || 'Address not available',
      
      // Add the ListingContractDate for display
      listingContractDate: property.ListingContractDate || null,
      
      // Add listing agent information with proper fallbacks
      listAgentName: property.ListAgentFullName || property.listAgentName || '-',
      listAgentPhone: property.ListAgentPreferredPhone || property.ListAgentDirectPhone || property.listAgentPhone || '-',
      listAgentEmail: property.ListAgentEmail || property.listAgentEmail || '-',
      
      // Map interior features - ensure all arrays have default empty arrays
      interiorFeatures: Array.isArray(property.InteriorFeatures) ? property.InteriorFeatures : [],
      flooring: Array.isArray(property.Flooring) ? property.Flooring : [],
      cooling: Array.isArray(property.Cooling) ? property.Cooling : [],
      heating: Array.isArray(property.Heating) ? property.Heating : [],
      fireplace: property.FireplaceYN || false,
      fireplaces: property.FireplacesTotal || 0,
      fireplaceFeatures: Array.isArray(property.FireplaceFeatures) ? property.FireplaceFeatures : [],
      
      // Map exterior features - ensure all arrays have default empty arrays
      exteriorFeatures: Array.isArray(property.ExteriorFeatures) ? property.ExteriorFeatures : [],
      architecturalStyle: Array.isArray(property.ArchitecturalStyle) ? property.ArchitecturalStyle : [],
      roof: Array.isArray(property.Roof) ? property.Roof : [],
      constructionMaterials: Array.isArray(property.ConstructionMaterials) ? property.ConstructionMaterials : [],
      patioAndPorchFeatures: Array.isArray(property.PatioAndPorchFeatures) ? property.PatioAndPorchFeatures : [],
      
      // Map community features - ensure all arrays have default empty arrays
      communityFeatures: Array.isArray(property.CommunityFeatures) ? property.CommunityFeatures : [],
      associationYN: property.AssociationYN || false,
      associationFee: property.AssociationFee || '-',
      associationFeeFrequency: property.AssociationFeeFrequency || '',
      associationFeeIncludes: Array.isArray(property.AssociationFeeIncludes) ? property.AssociationFeeIncludes : [],
      
      // Map other important fields - ensure all arrays have default empty arrays
      appliances: Array.isArray(property.Appliances) ? property.Appliances : [],
      parkingFeatures: Array.isArray(property.ParkingFeatures) ? property.ParkingFeatures : [],
      garageSpaces: property.GarageSpaces || 0,
      
      // Map laundry features
      laundryFeatures: Array.isArray(property.LaundryFeatures) ? property.LaundryFeatures : [],
      
      // Map room features
      roomBathroomFeatures: Array.isArray(property.RoomBathroomFeatures) ? property.RoomBathroomFeatures : [],
      roomKitchenFeatures: Array.isArray(property.RoomKitchenFeatures) ? property.RoomKitchenFeatures : [],
      
      // Map security features
      securityFeatures: Array.isArray(property.SecurityFeatures) ? property.SecurityFeatures : [],
      
      // Map window features
      windowFeatures: Array.isArray(property.WindowFeatures) ? property.WindowFeatures : [],
      
      // Map door features
      doorFeatures: Array.isArray(property.DoorFeatures) ? property.DoorFeatures : [],
      
      // Map utilities
      utilities: Array.isArray(property.Utilities) ? property.Utilities : [],
      
      // Map school information
      elementarySchool: property.ElementarySchool || '-',
      middleSchool: property.MiddleOrJuniorSchool || '-',
      highSchool: property.HighSchool || '-',
      schoolDistrict: property.ElementarySchoolDistrict || property.HighSchoolDistrict || '-',
      
      // Map tax information
      taxAnnualAmount: property.TaxAnnualAmount || '-',
      taxExemptions: Array.isArray(property.TaxExemptions) ? property.TaxExemptions : [],
      parcelNumber: property.ParcelNumber || '-',
      
      description: property.PublicRemarks || property.description || 'No description available',
      
      // Add back the customFeatures property
      customFeatures: extractFeaturesFromDescription(property.PublicRemarks || property.description || ''),
      
      // Ensure images is properly mapped
      images: property.Media && Array.isArray(property.Media) && property.Media.length > 0 ? property.Media.map(media => ({
        uri: media.MediaURL
      })) : property.images && Array.isArray(property.images) ? property.images : [],
    };
    
    // Add debugging for the specific field
    console.log('ListingContractDate from property:', property.ListingContractDate);
    console.log('listingContractDate in mappedProperty:', mappedProperty.listingContractDate);
    
    // Add a safeguard to ensure all properties are defined
    Object.keys(mappedProperty).forEach(key => {
      if (mappedProperty[key] === undefined) {
        if (Array.isArray(mappedProperty[key])) {
          mappedProperty[key] = [];
        } else if (typeof mappedProperty[key] === 'number') {
          mappedProperty[key] = 0;
        } else if (typeof mappedProperty[key] === 'boolean') {
          mappedProperty[key] = false;
        } else {
          mappedProperty[key] = '-';
        }
      }
    });
    
    console.log('Original property:', property);
    console.log('Mapped property:', mappedProperty);
    
    return mappedProperty;
  };

  // Add this helper function to extract features from the description
  const extractFeaturesFromDescription = (description) => {
    const features = [];
    
    // Split description into sentences
    const sentences = description.split(/\.\s+/);
    
    // Look for sentences that might contain features
    sentences.forEach(sentence => {
      if (sentence.includes('featuring') || 
          sentence.includes('includes') || 
          sentence.includes('offering') ||
          sentence.includes('with') ||
          sentence.includes('amenities')) {
        features.push(sentence.trim() + '.');
      }
    });
    
    // If no features found, add some default ones based on property type
    if (features.length === 0 && property.propertySubType === 'Multi Family') {
      features.push('Multi-family investment property.');
      if (property.beds && property.baths) {
        features.push(`${property.beds} bedroom, ${property.baths} bathroom units.`);
      }
    }
    
    return features;
  };

  // Add this helper function
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    
    try {
      // Log the input for debugging
      console.log('Formatting date:', dateString);
      
      // Try different date parsing approaches
      let date;
      
      // Try direct parsing
      date = new Date(dateString);
      
      // If that fails, try parsing as YYYY-MM-DD
      if (isNaN(date.getTime()) && dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        date = new Date(year, month - 1, day);
      }
      
      // If that fails, try parsing as MM/DD/YYYY
      if (isNaN(date.getTime()) && dateString.includes('/')) {
        const [month, day, year] = dateString.split('/');
        date = new Date(year, month - 1, day);
      }
      
      // If we have a valid date, format it
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
      
      // If all parsing attempts fail, return the original string
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const mappedProperty = mapPropertyData();

  const renderImageItem = ({ item, index }) => {
    return (
      <View style={styles.carouselItem}>
        <Image 
          source={typeof item.uri === 'string' ? { uri: item.uri } : item} 
          style={styles.propertyImage}
          resizeMode="cover"
        />
      </View>
    );
  };

  const handleScroll = (event) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeImageIndex) {
      setActiveImageIndex(index);
    }
  };

  // Alternative shimmer using color animation
  const Shimmer = ({ width, height, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      const startAnimation = () => {
        Animated.loop(
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          })
        ).start();
      };
      
      startAnimation();
      return () => shimmerAnim.stopAnimation();
    }, []);
    
    // Create animated background color
    const backgroundColor = shimmerAnim.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: ['#E0E0E0', '#F5F5F5', '#E0E0E0'],
    });
    
    return (
      <Animated.View 
        style={[
          { 
            width, 
            height, 
            backgroundColor,
            borderRadius: 4,
          },
          style
        ]}
      />
    );
  };

  const renderSkeletonScreen = () => {
    return (
      <View style={styles.container}>
        {/* Skeleton for image carousel */}
        <View style={styles.carouselContainer}>
          <Shimmer width={screenWidth} height={300} />
          
          {/* Fake pagination dots */}
          <View style={styles.paginationContainer}>
            {[1, 2, 3, 4, 5].map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.paginationDot,
                  index === 0 ? styles.paginationDotActive : {}
                ]} 
              />
            ))}
          </View>
        </View>
        
        <ScrollView style={styles.detailsContainer}>
          {/* Skeleton for price */}
          <View style={styles.priceContainer}>
            <Shimmer width={150} height={32} style={{ marginBottom: 8 }} />
            <Shimmer width={80} height={28} style={{ borderRadius: 20 }} />
          </View>
          
          {/* Skeleton for address */}
          <Shimmer width={'90%'} height={20} style={{ marginBottom: 24 }} />
          
          {/* Skeleton for stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Shimmer width={24} height={24} style={{ marginBottom: 4 }} />
              <Shimmer width={40} height={18} style={{ marginTop: 4 }} />
              <Shimmer width={60} height={14} style={{ marginTop: 2 }} />
            </View>
            <View style={styles.statItem}>
              <Shimmer width={24} height={24} style={{ marginBottom: 4 }} />
              <Shimmer width={40} height={18} style={{ marginTop: 4 }} />
              <Shimmer width={60} height={14} style={{ marginTop: 2 }} />
            </View>
            <View style={styles.statItem}>
              <Shimmer width={24} height={24} style={{ marginBottom: 4 }} />
              <Shimmer width={40} height={18} style={{ marginTop: 4 }} />
              <Shimmer width={60} height={14} style={{ marginTop: 2 }} />
            </View>
            <View style={styles.statItem}>
              <Shimmer width={24} height={24} style={{ marginBottom: 4 }} />
              <Shimmer width={40} height={18} style={{ marginTop: 4 }} />
              <Shimmer width={60} height={14} style={{ marginTop: 2 }} />
            </View>
          </View>
          
          {/* Skeleton for description */}
          <View style={styles.section}>
            <Shimmer width={120} height={24} style={{ marginBottom: 12 }} />
            <Shimmer width={'100%'} height={16} style={{ marginBottom: 8 }} />
            <Shimmer width={'100%'} height={16} style={{ marginBottom: 8 }} />
            <Shimmer width={'100%'} height={16} style={{ marginBottom: 8 }} />
            <Shimmer width={'80%'} height={16} style={{ marginBottom: 8 }} />
          </View>
          
          {/* Skeleton for property details */}
          <View style={styles.section}>
            <Shimmer width={150} height={24} style={{ marginBottom: 12 }} />
            <View style={styles.detailsGrid}>
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <View key={index} style={styles.detailItem}>
                  <Shimmer width={100} height={16} style={{ marginBottom: 4 }} />
                  <Shimmer width={80} height={20} />
                </View>
              ))}
            </View>
          </View>
          
          {/* Skeleton for features */}
          <View style={styles.section}>
            <Shimmer width={150} height={24} style={{ marginBottom: 12 }} />
            <View style={styles.featuresList}>
              {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={styles.featureItem}>
                  <Shimmer width={16} height={16} style={{ borderRadius: 8, marginRight: 8 }} />
                  <Shimmer width={120} height={16} />
                </View>
              ))}
            </View>
          </View>
          
          {/* Skeleton for contact section */}
          <View style={styles.contactSection}>
            <Shimmer width={200} height={20} style={{ marginBottom: 16 }} />
            <Shimmer 
              width={'100%'} 
              height={50} 
              style={{ borderRadius: 25 }} 
            />
          </View>
          
          {/* Bottom padding */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  };

  if (isLoading) {
    return renderSkeletonScreen();
  }
  
  // Show error message if there was an error
  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ fontSize: 18, color: '#fc565b', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#fc565b', borderRadius: 5 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: '#fff' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Property Images Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={mappedProperty.images || []}
          renderItem={renderImageItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScroll}
          keyExtractor={(_, index) => index.toString()}
        />
        
        {/* Image pagination dots */}
        <View style={styles.paginationContainer}>
          {(mappedProperty.images || []).map((_, index) => (
            <TouchableOpacity 
              key={index} 
              style={[
                styles.paginationDot, 
                index === activeImageIndex ? styles.paginationDotActive : {}
              ]} 
              onPress={() => {
                flatListRef.current?.scrollToIndex({ index, animated: true });
                setActiveImageIndex(index);
              }}
            />
          ))}
        </View>
      </View>

      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Schedule button */}
      <TouchableOpacity 
        style={styles.scheduleButton}
        onPress={() => setShowScheduleModal(true)}
      >
        <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
        <Text style={styles.scheduleButtonText}>Schedule</Text>
      </TouchableOpacity>

      {/* Property details */}
      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        {/* Price and status */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(mappedProperty.price)}</Text>
          <View style={[
            styles.statusBadge, 
            { backgroundColor: mappedProperty.listingStatus === 'Active' ? '#fc565b' : '#FFA500' }
          ]}>
            <Text style={styles.statusText}>{mappedProperty.listingStatus || 'Active'}</Text>
          </View>
        </View>
        
        <Text style={styles.address}>{mappedProperty.address}</Text>

        {/* Key stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="bed-outline" size={24} color="#666" />
            <Text style={styles.statValue}>{formatValue(mappedProperty.beds)}</Text>
            <Text style={styles.statLabel}>Beds</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="bath" size={22} color="#666" />
            <Text style={styles.statValue}>{formatValue(mappedProperty.baths)}</Text>
            <Text style={styles.statLabel}>Baths</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="ruler-square" size={24} color="#666" />
            <Text style={styles.statValue}>{formatValue(mappedProperty.sqft)}</Text>
            <Text style={styles.statLabel}>Sq Ft</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="home-outline" size={24} color="#666" />
            <Text style={styles.statValue}>{formatValue(mappedProperty.yearBuilt)}</Text>
            <Text style={styles.statLabel}>Year</Text>
          </View>
        </View>

        {/* Property description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            {mappedProperty.description || 'No description available for this property.'}
          </Text>
        </View>

        {/* Property Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Property Type</Text>
              <Text style={styles.detailValue}>{formatValue(mappedProperty.propertyType)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Property Subtype</Text>
              <Text style={styles.detailValue}>{formatValue(mappedProperty.propertySubType)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Lot Size</Text>
              <Text style={styles.detailValue}>{formatValue(mappedProperty.lotSize, ' sq ft')}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>List Date</Text>
              <Text style={styles.detailValue}>
                {formatDate(mappedProperty.listingContractDate)}
              </Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Days on Market</Text>
              <Text style={styles.detailValue}>{calculateDaysOnMarket()}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>MLS #</Text>
              <Text style={styles.detailValue}>{formatValue(mappedProperty.mlsNumber)}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Listing Office</Text>
              <Text style={styles.detailValue}>{formatValue(mappedProperty.listingOffice)}</Text>
            </View>
            
            {mappedProperty.yearBuilt && mappedProperty.yearBuilt !== '-' && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Year Built</Text>
                <Text style={styles.detailValue}>{formatValue(mappedProperty.yearBuilt)}</Text>
              </View>
            )}
            
            {mappedProperty.garageSpaces > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Garage Spaces</Text>
                <Text style={styles.detailValue}>{formatValue(mappedProperty.garageSpaces)}</Text>
              </View>
            )}
            
            {mappedProperty.fireplaces > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Fireplaces</Text>
                <Text style={styles.detailValue}>{formatValue(mappedProperty.fireplaces)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Listing Agent Information */}
        {(mappedProperty.listAgentName !== '-' || mappedProperty.listAgentPhone !== '-') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Listing Agent</Text>
            <View style={styles.detailsGrid}>
              {mappedProperty.listAgentName !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Agent</Text>
                  <Text style={styles.detailValue}>{mappedProperty.listAgentName}</Text>
                </View>
              )}
              
              {mappedProperty.listAgentPhone !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{mappedProperty.listAgentPhone}</Text>
                </View>
              )}
              
              {mappedProperty.listAgentEmail !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{mappedProperty.listAgentEmail}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* School Information */}
        {(mappedProperty.elementarySchool !== '-' || mappedProperty.middleSchool !== '-' || mappedProperty.highSchool !== '-') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>School Information</Text>
            <View style={styles.detailsGrid}>
              {mappedProperty.elementarySchool !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Elementary School</Text>
                  <Text style={styles.detailValue}>{mappedProperty.elementarySchool}</Text>
                </View>
              )}
              
              {mappedProperty.middleSchool !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Middle School</Text>
                  <Text style={styles.detailValue}>{mappedProperty.middleSchool}</Text>
                </View>
              )}
              
              {mappedProperty.highSchool !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>High School</Text>
                  <Text style={styles.detailValue}>{mappedProperty.highSchool}</Text>
                </View>
              )}
              
              {mappedProperty.schoolDistrict !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>School District</Text>
                  <Text style={styles.detailValue}>{mappedProperty.schoolDistrict}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tax Information */}
        {(mappedProperty.taxAnnualAmount !== '-' || mappedProperty.parcelNumber !== '-') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tax Information</Text>
            <View style={styles.detailsGrid}>
              {mappedProperty.taxAnnualAmount !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Annual Tax</Text>
                  <Text style={styles.detailValue}>${mappedProperty.taxAnnualAmount}</Text>
                </View>
              )}
              
              {mappedProperty.parcelNumber !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Parcel Number</Text>
                  <Text style={styles.detailValue}>{mappedProperty.parcelNumber}</Text>
                </View>
              )}
              
              {mappedProperty.taxExemptions && mappedProperty.taxExemptions.length > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Tax Exemptions</Text>
                  <Text style={styles.detailValue}>{mappedProperty.taxExemptions.join(', ')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* HOA Information */}
        {(mappedProperty.associationYN || mappedProperty.associationFee !== '-') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOA Information</Text>
            <View style={styles.detailsGrid}>
              {mappedProperty.associationFee !== '-' && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>HOA Fee</Text>
                  <Text style={styles.detailValue}>
                    ${mappedProperty.associationFee}
                    {mappedProperty.associationFeeFrequency ? `/${mappedProperty.associationFeeFrequency}` : ''}
                  </Text>
                </View>
              )}
              
              {mappedProperty.associationFeeIncludes && mappedProperty.associationFeeIncludes.length > 0 && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>HOA Includes</Text>
                  <Text style={styles.detailValue}>{mappedProperty.associationFeeIncludes.join(', ')}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Laundry Features */}
        {mappedProperty.laundryFeatures && mappedProperty.laundryFeatures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Laundry Features</Text>
            <View style={styles.featuresList}>
              {mappedProperty.laundryFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Room Features */}
        {(mappedProperty.roomBathroomFeatures && mappedProperty.roomBathroomFeatures.length > 0) || 
         (mappedProperty.roomKitchenFeatures && mappedProperty.roomKitchenFeatures.length > 0) ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Room Features</Text>
            
            {mappedProperty.roomKitchenFeatures && mappedProperty.roomKitchenFeatures.length > 0 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Kitchen</Text>
                <View style={styles.featuresList}>
                  {mappedProperty.roomKitchenFeatures.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {mappedProperty.roomBathroomFeatures && mappedProperty.roomBathroomFeatures.length > 0 && (
              <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>Bathroom</Text>
                <View style={styles.featuresList}>
                  {mappedProperty.roomBathroomFeatures.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        ) : null}

        {/* Utilities */}
        {mappedProperty.utilities && mappedProperty.utilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Utilities</Text>
            <View style={styles.featuresList}>
              {mappedProperty.utilities.map((utility, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{utility}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Security Features */}
        {mappedProperty.securityFeatures && mappedProperty.securityFeatures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Features</Text>
            <View style={styles.featuresList}>
              {mappedProperty.securityFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <FontAwesome5 name="check-circle" size={16} color="#4CAF50" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Interested in this property?</Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={() => setShowScheduleModal(true)}
          >
            <Text style={styles.contactButtonText}>Schedule a Showing</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom padding */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Schedule Modal */}
      <ScheduleModal 
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        property={mappedProperty}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  carouselContainer: {
    height: 300,
    width: '100%',
    position: 'relative',
  },
  carouselItem: {
    width: screenWidth,
    height: 300,
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    margin: 3,
  },
  paginationDotActive: {
    backgroundColor: '#fff',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: '#fc565b',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 15,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  address: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  contactSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  contactButton: {
    backgroundColor: '#fc565b',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scheduleModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scheduleModalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  agentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  agentIconContainer: {
    marginRight: 15,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  agentTitle: {
    fontSize: 14,
    color: '#666',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  calendarPlaceholder: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarPlaceholderText: {
    color: '#999',
    fontSize: 16,
  },
  modalCloseButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
    padding: 8,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  modalBackButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#fc565b',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600', 
    color: '#333',
  },
  submitText: {
    color: '#fff',
  },
  featureSection: {
    marginBottom: 24,
  },
  subSection: {
    marginBottom: 16,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
  successModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  successModalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  successButton: {
    backgroundColor: '#fc565b',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 8,
  },
  successButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyDetails; 