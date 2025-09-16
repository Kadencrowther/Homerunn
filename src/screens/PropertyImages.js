import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Text, Modal, BackHandler } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScheduleModal from '../components/ScheduleModal';
import { fetchMLSData } from '../api/fetchMLSData';
import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const PropertyImages = ({ route, navigation }) => {
  const { property: initialProperty, sourceScreen } = route.params;
  const [selectedImage, setSelectedImage] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [completeProperty, setCompleteProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  // Fetch complete property data when the screen loads
  useEffect(() => {
    const fetchPropertyData = async () => {
      try {
        setIsLoading(true);
        
        // Extract property ID
        let propertyId = initialProperty.ListingId || initialProperty.listingId || initialProperty.mlsNumber;
        
        // If the ID is a URL, extract the ID from it
        if (!propertyId && typeof initialProperty.id === 'string' && initialProperty.id.includes('api.bridgedataoutput.com')) {
          try {
            propertyId = initialProperty.id.split("('")[1].split("')")[0];
            console.log('Extracted property ID from URL:', propertyId);
          } catch (error) {
            console.error('Error extracting ID from URL:', error);
          }
        }
        
        console.log('Fetching complete data for property ID:', propertyId);
        
        if (propertyId) {
          const result = await fetchMLSData({ listingId: propertyId });
          
          if (result && result.properties && result.properties.length > 0) {
            const fetchedProperty = result.properties[0];
            console.log('Successfully fetched property data for ID:', propertyId);
            
            // Log the agent information to debug
            console.log('Agent info from API:', {
              name: fetchedProperty.ListAgentFullName,
              phone: fetchedProperty.ListAgentPreferredPhone || fetchedProperty.ListAgentDirectPhone,
              email: fetchedProperty.ListAgentEmail
            });
            
            // Merge the fetched data with the initial property
            const mergedProperty = {
              ...initialProperty,
              ...fetchedProperty,
              // Ensure these IDs are explicitly set
              ListingId: fetchedProperty.ListingId,
              listingId: fetchedProperty.ListingId,
              mlsNumber: fetchedProperty.ListingId,
              // Add listing agent information with proper fallbacks
              listAgentName: fetchedProperty.ListAgentFullName || fetchedProperty.listAgentName || 'Listing Agent',
              listAgentPhone: fetchedProperty.ListAgentPreferredPhone || fetchedProperty.ListAgentDirectPhone || fetchedProperty.listAgentPhone || '',
              listAgentEmail: fetchedProperty.ListAgentEmail || fetchedProperty.listAgentEmail || '',
              // Also extract the zip code from the address if available
              zipCode: fetchedProperty.PostalCode || ''
            };
            
            console.log('Merged property with agent info:', {
              listAgentName: mergedProperty.listAgentName,
              listAgentPhone: mergedProperty.listAgentPhone,
              listAgentEmail: mergedProperty.listAgentEmail
            });
            
            setCompleteProperty(mergedProperty);
          } else {
            console.warn('No property data returned from API');
            setCompleteProperty(initialProperty);
          }
        } else {
          console.warn('No property ID available for API call');
          setCompleteProperty(initialProperty);
        }
      } catch (error) {
        console.error('Error fetching property data:', error);
        setCompleteProperty(initialProperty);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPropertyData();
  }, [initialProperty]);
  
  // Use the complete property data or fall back to initial property
  const property = completeProperty || initialProperty;

  // Log navigation info when screen loads
  useEffect(() => {
    console.log('PropertyImages screen mounted');
    console.log('Source screen:', sourceScreen || 'Not specified');
    console.log('Property ID:', property?.id);
    
    // Return cleanup function
    return () => {
      console.log('PropertyImages screen unmounted');
    };
  }, []);
  
  // Use React Navigation's useFocusEffect for reliable focus handling
  useFocusEffect(
    useCallback(() => {
      console.log('PropertyImages screen focused');
      console.log('Source screen (on focus):', sourceScreen);
      
      // Add hardware back button handler for Android
      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        () => {
          handleBackNavigation();
          return true; // Prevent default behavior
        }
      );
      
      return () => {
        console.log('PropertyImages screen lost focus');
        backHandler.remove(); // Remove the event listener
      };
    }, [sourceScreen])
  );

  const handleImagePress = (image) => {
    setSelectedImage(image);
  };

  const handleBackNavigation = () => {
    console.log('Back button pressed on PropertyImages');
    console.log('Current source screen:', sourceScreen);
    
    try {
      if (sourceScreen === 'Home' || sourceScreen === 'Search' || sourceScreen === 'Saved') {
        // Simply go back instead of resetting the navigation stack
        console.log(`Navigating back to ${sourceScreen} using goBack()`);
        navigation.goBack();
      } else {
        // No source screen specified, try goBack
        console.log('No sourceScreen specified, trying goBack()');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          console.log('goBack failed, resetting to Home');
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          });
        }
      }
    } catch (error) {
      console.error('Navigation error:', error);
      // Ultimate fallback
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    }
  };

  // Update the Schedule button handler
  const handleSchedulePress = () => {
    setShowScheduleModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        style={[styles.backButton, { top: insets.top + 10 }]}
        onPress={handleBackNavigation}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      {/* Schedule Button */}
      <TouchableOpacity 
        style={[styles.scheduleButton, { top: insets.top + 10 }]}
        onPress={handleSchedulePress}
      >
        <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
        <Text style={styles.scheduleButtonText}>Schedule</Text>
      </TouchableOpacity>

      {/* Scrollable Images */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {property.images.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleImagePress(image)}
            activeOpacity={0.9}
            style={styles.imageWrapper}
          >
            <Image
              source={image}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Full Screen Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={[styles.modalCloseButton, { top: insets.top + 10 }]}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          {selectedImage && (
            <View style={styles.fullScreenImageContainer}>
              <Image
                source={selectedImage}
                style={styles.fullScreenImage}
                resizeMode="cover"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Schedule Modal */}
      <ScheduleModal 
        visible={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        property={completeProperty || initialProperty}
      />

      {/* Fixed Property Details Button */}
      <TouchableOpacity 
        style={[styles.detailsButton, { bottom: insets.bottom + 20 }]}
        onPress={() => {
          console.log('Navigating to PropertyDetails with complete property data');
          navigation.navigate('PropertyDetails', { 
            property: completeProperty || initialProperty
          });
        }}
      >
        <Text style={styles.detailsButtonText}>Property Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0
  },
  backButton: {
    position: 'absolute',
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
  scrollView: {
    flex: 1,
  },
  imageWrapper: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#f0f0f0',
    marginBottom: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#fc565b',
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 12,
  },
  fullScreenImageContainer: {
    width: width,
    height: width * 0.75,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  scheduleButton: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: '#fc565b',
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scheduleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PropertyImages;