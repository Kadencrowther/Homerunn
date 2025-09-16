import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Animated, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Linking, Switch, Dimensions, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { signOut, updateEmail, updatePassword, verifyBeforeUpdateEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';
import MapView, { Circle, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { initializeUserMatchMetric } from '../utils/UserMatchMetric';

const { width } = Dimensions.get('window');

// Popular city suggestions
const popularCities = [
  { id: '1', name: 'New York, NY' },
  { id: '2', name: 'Los Angeles, CA' },
  { id: '3', name: 'Chicago, IL' },
  { id: '4', name: 'Houston, TX' },
  { id: '5', name: 'Phoenix, AZ' },
  { id: '6', name: 'Philadelphia, PA' },
  { id: '7', name: 'San Antonio, TX' },
  { id: '8', name: 'San Diego, CA' },
  { id: '9', name: 'Dallas, TX' },
  { id: '10', name: 'San Francisco, CA' },
  { id: '11', name: 'Austin, TX' },
  { id: '12', name: 'Seattle, WA' },
];

const ProfileScreen = ({ navigation }) => {
  const [isDeactivateModalVisible, setIsDeactivateModalVisible] = useState(false);
  const [isSignOutModalVisible, setIsSignOutModalVisible] = useState(false);
  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [isPreferencesModalVisible, setIsPreferencesModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [locationPreferences, setLocationPreferences] = useState([]);
  const [userPreferences, setUserPreferences] = useState([]);
  const [editablePreferences, setEditablePreferences] = useState([]);
  const [editableLocation, setEditableLocation] = useState({
    name: "Houston, TX",
    radiusMiles: 25
  });
  const [newPreference, setNewPreference] = useState('');
  const [preferenceSaving, setPreferenceSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCities, setFilteredCities] = useState(popularCities);
  const [showCitySelection, setShowCitySelection] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  
  // Map region state
  const [mapRegion, setMapRegion] = useState({
    latitude: 29.7604,
    longitude: -95.3698,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5
  });
  
  // Profile editing form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [editError, setEditError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  
  // Animation for shimmer effect
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Form scrolling ref
  const formScrollViewRef = useRef(null);
  
  // Start shimmer animation when loading
  useEffect(() => {
    if (loading) {
      const shimmerAnimation = Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500, // Slightly slower for a more subtle effect
          useNativeDriver: false,
        })
      );
      shimmerAnimation.start();
      
      return () => {
        shimmerAnimation.stop();
      };
    }
  }, [loading, shimmerAnim]);
  
  // Ask for location permissions on component mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);
  
  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          console.log('No user is signed in');
          setLoading(false);
          setUserName('GUEST');
          return;
        }

        console.log('Fetching user data for ID:', userId);
        const userDocRef = doc(db, 'Users', userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          console.log('User data retrieved:', data);
          
          // Extract location preferences if available
          if (data.Location) {
            const location = Array.isArray(data.Location) ? data.Location[0] : data.Location;
            
            // Set default map region based on location
            if (location.Coordinates) {
              setMapRegion({
                latitude: location.Coordinates.latitude,
                longitude: location.Coordinates.longitude,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5
              });
            }
            
            setLocationPreferences([{
              name: location.Name || "Houston, TX",
              coordinates: location.Coordinates || null,
              radiusMiles: location.RadiusMiles || 25
            }]);
            
            setEditableLocation({
              name: location.Name || "Houston, TX",
              radiusMiles: location.RadiusMiles || 25
            });
          } else {
            // Default location if none is set
            setLocationPreferences([{
              name: "Houston, TX",
              coordinates: null,
              radiusMiles: 25
            }]);
            
            setEditableLocation({
              name: "Houston, TX",
              radiusMiles: 25
            });
          }

          // Extract user preferences if available
          if (data.Preferences) {
            const prefs = Array.isArray(data.Preferences) ? data.Preferences : [];
            setUserPreferences(prefs);
            setEditablePreferences([...prefs]);
          } else {
            // Default preferences if none are set
            const defaultPrefs = ["New Build", "New Appliances", "Good Schools"];
            setUserPreferences(defaultPrefs);
            setEditablePreferences([...defaultPrefs]);
          }
          
          // Check if user data has a Profile object with FirstName and LastName
          let fName = '';
          let lName = '';
          let phone = '';
          
          if (data.Profile) {
            fName = data.Profile.FirstName || '';
            lName = data.Profile.LastName || '';
            phone = data.Profile.PhoneNumber || '';
            
            // Set form states
            setFirstName(fName);
            setLastName(lName);
            setPhoneNumber(phone);
            
            // Set address if available
            if (data.Profile.Address) {
              setAddress(data.Profile.Address);
            }
          } else {
            // If Profile doesn't exist, try to get from root level (as fallback)
            fName = data.FirstName || '';
            lName = data.LastName || '';
            
            // Set form states
            setFirstName(fName);
            setLastName(lName);
          }
          
          // Set email
          setEmail(auth.currentUser?.email ?? 'guest@homerunn.com');
          
          if (fName || lName) {
            setUserName(`${fName} ${lName}`.trim().toUpperCase());
          } else {
            setUserName('GUEST');
            console.log('FirstName and LastName not found in user data');
          }
        } else {
          console.log('No user document found for this user');
          setUserName('GUEST');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserName('GUEST');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Filter cities and get geocoding results based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCities(popularCities);
      setSearchResults([]);
    } else {
      // Filter local cities
      const filtered = popularCities.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCities(filtered);
      
      // If query is specific enough, search for additional locations
      if (searchQuery.length > 2) {
        searchLocations(searchQuery);
      } else {
        setSearchResults([]);
      }
    }
  }, [searchQuery]);

  // Search for locations using geocoding
  const searchLocations = async (query) => {
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      const locations = await Location.geocodeAsync(query);
      
      if (locations.length > 0) {
        // Get location names for each result
        const resultsWithNames = await Promise.all(
          locations.slice(0, 3).map(async (loc) => {
            const address = await Location.reverseGeocodeAsync({
              latitude: loc.latitude,
              longitude: loc.longitude,
            });
            
            let name = query;
            if (address.length > 0) {
              name = address[0].city 
                ? `${address[0].city}, ${address[0].region || address[0].country}`
                : address[0].region || query;
            }
            
            return {
              id: `geo-${loc.latitude}-${loc.longitude}`,
              name,
              latitude: loc.latitude,
              longitude: loc.longitude
            };
          })
        );
        
        // Filter out duplicates by name
        const uniqueResults = resultsWithNames.filter(result => 
          !popularCities.some(city => city.name.toLowerCase() === result.name.toLowerCase())
        );
        
        setSearchResults(uniqueResults);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeactivate = () => {
    setIsDeactivateModalVisible(true);
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsSignOutModalVisible(false);
      // Auth state change will automatically redirect to setup/login
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleEditProfile = () => {
    setEditError('');
    setIsEditProfileModalVisible(true);
  };

  const handleCloseEditProfile = () => {
    setIsEditProfileModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordFields(false);
    setEditError('');
  };

  const handleOpenNotificationSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening notification settings:', error);
    }
  };

  const handleOpenPreferences = () => {
    // Reset editable preferences to current preferences
    setEditablePreferences([...userPreferences]);
    setEditableLocation({
      name: locationPreferences[0]?.name || "Houston, TX",
      radiusMiles: locationPreferences[0]?.radiusMiles || 25
    });
    setNewPreference('');
    setShowCitySelection(false);
    setSearchQuery('');
    setIsPreferencesModalVisible(true);
  };

  const handleAddPreference = () => {
    if (newPreference.trim() === '') {
      return;
    }
    
    // Check if we already have 5 preferences
    if (editablePreferences.length >= 5) {
      Alert.alert('Maximum Reached', 'You can select up to 5 preferences only.');
      return;
    }
    
    setEditablePreferences([...editablePreferences, newPreference.trim()]);
    setNewPreference('');
  };

  const handleRemovePreference = (index) => {
    const updatedPreferences = [...editablePreferences];
    updatedPreferences.splice(index, 1);
    setEditablePreferences(updatedPreferences);
  };

  const handleEditPreference = (index, value) => {
    const updatedPreferences = [...editablePreferences];
    updatedPreferences[index] = value;
    setEditablePreferences(updatedPreferences);
  };

  const handleCitySelect = (city) => {
    // Update map region if coordinates are available
    if (city.latitude && city.longitude) {
      setMapRegion({
        latitude: city.latitude,
        longitude: city.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5
      });
    }
    
    setEditableLocation({
      ...editableLocation,
      name: city.name,
      coordinates: city.latitude && city.longitude ? { 
        latitude: city.latitude, 
        longitude: city.longitude 
      } : null
    });
    
    setShowCitySelection(false);
    setSearchQuery('');
  };

  const toggleCitySelection = () => {
    setShowCitySelection(!showCitySelection);
    if (!showCitySelection) {
      setSearchQuery('');
      setFilteredCities(popularCities);
    }
  };
  
  const togglePasswordFields = () => {
    // Toggle the password fields visibility
    const newVisibility = !showPasswordFields;
    setShowPasswordFields(newVisibility);
    
    // If we're showing the password fields, scroll to make them visible after a short delay
    // The delay ensures the fields are rendered before attempting to scroll
    if (newVisibility) {
      setTimeout(() => {
        if (formScrollViewRef.current) {
          formScrollViewRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setPreferenceSaving(true);
      const userId = auth.currentUser?.uid;
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        setPreferenceSaving(false);
        return;
      }

      // Update Firestore
      const userDocRef = doc(db, 'Users', userId);
      const updatedData = { ...userData };

      // Update preferences
      updatedData.Preferences = [...editablePreferences];

      // Update location with coordinates
      if (updatedData.Location) {
        if (Array.isArray(updatedData.Location)) {
          updatedData.Location[0] = {
            ...updatedData.Location[0],
            Name: editableLocation.name,
            RadiusMiles: editableLocation.radiusMiles,
            Coordinates: editableLocation.coordinates
          };
        } else {
          updatedData.Location = {
            ...updatedData.Location,
            Name: editableLocation.name,
            RadiusMiles: editableLocation.radiusMiles,
            Coordinates: editableLocation.coordinates
          };
        }
      } else {
        updatedData.Location = {
          Name: editableLocation.name,
          RadiusMiles: editableLocation.radiusMiles,
          Coordinates: editableLocation.coordinates
        };
      }

      await updateDoc(userDocRef, updatedData);

      // Update local state
      setUserPreferences([...editablePreferences]);
      setLocationPreferences([{
        name: editableLocation.name,
        radiusMiles: editableLocation.radiusMiles,
        coordinates: editableLocation.coordinates
      }]);
      setUserData(updatedData);
      setIsPreferencesModalVisible(false);
      setPreferenceSaving(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
      setPreferenceSaving(false);
    }
  };

  // Function to reset the user match metric algorithm
  const handleResetAlgorithm = () => {
    Alert.alert(
      'Reset Algorithm',
      'Are you sure you want to reset your User Match Metric Algorithm? This will clear all your property preferences.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes, Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              setPreferenceSaving(true);
              const userId = auth.currentUser?.uid;
              if (!userId) {
                Alert.alert('Error', 'User not authenticated');
                setPreferenceSaving(false);
                return;
              }
              
              // Reset the user match metric to default
              await initializeUserMatchMetric(userId);
              
              Alert.alert(
                'Success',
                'Your property matching algorithm has been reset to default settings.',
                [{ text: 'OK' }]
              );
              
              setPreferenceSaving(false);
            } catch (error) {
              console.error('Error resetting algorithm:', error);
              Alert.alert('Error', 'Failed to reset algorithm');
              setPreferenceSaving(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveProfile = async () => {
    try {
      setEditError('');
      const userId = auth.currentUser?.uid;
      if (!userId) {
        setEditError('User not authenticated');
        return;
      }

      // Validate fields
      if (!firstName.trim() || !lastName.trim()) {
        setEditError('First name and last name are required');
        return;
      }

      if (phoneNumber && !/^\(\d{3}\) \d{3}-\d{4}$/.test(phoneNumber)) {
        setEditError('Phone number format should be (XXX) XXX-XXXX');
        return;
      }

      // Check if password change is requested
      if (newPassword) {
        if (newPassword.length < 6) {
          setEditError('Password must be at least 6 characters');
          return;
        }
        
        if (newPassword !== confirmPassword) {
          setEditError('Passwords do not match');
          return;
        }
        
        // Verify the current password before allowing password change
        if (!currentPassword) {
          setEditError('Current password is required to change your password');
          return;
        }
        
        try {
          // Create credential with email and current password
          const credential = EmailAuthProvider.credential(
            auth.currentUser?.email ?? 'guest@homerunn.com',
            currentPassword
          );
          
          // Re-authenticate
          await reauthenticateWithCredential(auth.currentUser ?? guestUser, credential);
          
          // If re-authentication successful, update password
          await updatePassword(auth.currentUser ?? guestUser, newPassword);
          console.log('Password updated successfully');
          
          // Clear password fields
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setShowPasswordFields(false);
          
          Alert.alert('Success', 'Your password has been updated successfully');
        } catch (error) {
          console.error('Error updating password:', error);
          if (error.code === 'auth/wrong-password') {
            setEditError('Current password is incorrect');
          } else {
            setEditError('Failed to update password: ' + error.message);
          }
          return;
        }
      }

      // Check if email is changed
      if (email !== (auth.currentUser?.email ?? 'guest@homerunn.com')) {
        try {
          // Send verification email before updating email in Firebase Auth
          await verifyBeforeUpdateEmail(auth.currentUser ?? guestUser, email);
          
          // Show message to user about verification email
          Alert.alert(
            'Verification Email Sent',
            'We\'ve sent a verification link to your new email address. Please check your inbox and click the link to complete the email change.',
            [{ text: 'OK' }]
          );
          
          console.log('Verification email sent for email update');
          
          // We'll continue with the Firestore update since that can be done immediately
          // The actual Firebase Auth email will update once the user verifies their email
        } catch (error) {
          console.error('Error updating email in Firebase Auth:', error);
          
          // Check if re-authentication is required
          if (error.code === 'auth/requires-recent-login') {
            setEditError('Session expired. Please sign out and sign in again to change your email.');
            return;
          } else {
            setEditError('Failed to update email: ' + error.message);
            return;
          }
        }
      }

      // Update profile data in Firestore
      const userDocRef = doc(db, 'Users', userId);
      
      // Create updated data object
      let updatedData = { ...userData };
      
      // Update Profile object if it exists
      if (updatedData.Profile) {
        updatedData.Profile = {
          ...updatedData.Profile,
          FirstName: firstName,
          LastName: lastName,
          PhoneNumber: phoneNumber,
          Address: address
        };
      } else {
        // Create Profile object if it doesn't exist
        updatedData.Profile = {
          FirstName: firstName,
          LastName: lastName,
          PhoneNumber: phoneNumber,
          Address: address
        };
      }
      
      await updateDoc(userDocRef, updatedData);
      console.log('Profile updated in Firestore');
      
      // Update displayed name
      setUserName(`${firstName} ${lastName}`.trim().toUpperCase());
      
      // Close modal
      setIsEditProfileModalVisible(false);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(error.message || 'Failed to update profile');
    }
  };

  const renderOptionItem = (icon, title, onPress) => (
    <TouchableOpacity style={styles.optionItem} onPress={onPress}>
      <View style={styles.optionContent}>
        <Ionicons name={icon} size={22} color="#fc565b" />
        <Text style={styles.optionText}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#ccc" />
    </TouchableOpacity>
  );

  const renderCityItem = ({ item }) => {
    const isSelected = editableLocation.name === item.name;
    
    return (
      <TouchableOpacity 
        style={[styles.cityItem, isSelected && styles.selectedCityItem]} 
        onPress={() => handleCitySelect(item)}
      >
        <Ionicons 
          name="location" 
          size={18} 
          color={isSelected ? "#fff" : "#666"} 
          style={styles.cityItemIcon}
        />
        <Text style={[styles.cityItemText, isSelected && styles.selectedCityItemText]}>
          {item.name}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={18} color="#fff" style={styles.checkmark} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEditablePreferencesData = () => {
    // Combine popular cities and search results for FlatList
    const combinedResults = [...filteredCities, ...searchResults];
    
    return (
      <View style={styles.preferencesEditSection}>
        {/* Reset Algorithm Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Reset Your Algorithm</Text>
          <Text style={styles.cardSubtitle}>We will return your User Match Metric to default settings</Text>
          
          <TouchableOpacity
            style={styles.resetAlgorithmButton}
            onPress={handleResetAlgorithm}
          >
            <Ionicons name="refresh-circle" size={24} color="#fff" style={styles.resetIcon} />
            <Text style={styles.resetButtonText}>Reset Algorithm</Text>
          </TouchableOpacity>
        </View>
        
        {/* Preferences Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Property Preferences</Text>
          <Text style={styles.cardSubtitle}>Select up to 5 features that matter most to you</Text>
          
          {editablePreferences.map((preference, index) => (
            <View key={index} style={styles.preferenceEditItem}>
              <TextInput
                style={styles.preferenceInput}
                value={preference}
                onChangeText={(text) => handleEditPreference(index, text)}
                placeholder="Enter preference"
              />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePreference(index)}
              >
                <Ionicons name="close-circle" size={24} color="#fc565b" />
              </TouchableOpacity>
            </View>
          ))}
          
          {editablePreferences.length < 5 && (
            <View style={styles.addPreferenceContainer}>
              <TextInput
                style={styles.newPreferenceInput}
                value={newPreference}
                onChangeText={setNewPreference}
                placeholder="Add new preference"
                returnKeyType="done"
                onSubmitEditing={handleAddPreference}
              />
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddPreference}
              >
                <Ionicons name="add-circle" size={30} color="#fc565b" />
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.helperText}>
            {5 - editablePreferences.length} {5 - editablePreferences.length === 1 ? 'preference' : 'preferences'} remaining
          </Text>
        </View>
        
        {/* Location Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.cardTitle}>Location Preferences</Text>
          <Text style={styles.cardSubtitle}>Set your preferred location and search radius</Text>
          
          {/* Location Selection */}
          <Text style={styles.inputLabel}>Location</Text>
          <TouchableOpacity 
            style={styles.locationSelector}
            onPress={toggleCitySelection}
          >
            <Ionicons name="location-outline" size={20} color="#555" style={styles.locationIcon} />
            <Text style={styles.locationText}>{editableLocation.name}</Text>
            <Ionicons name={showCitySelection ? "chevron-up" : "chevron-down"} size={18} color="#555" />
          </TouchableOpacity>
          
          {showCitySelection && (
            <View style={styles.citySelectionContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#777" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search any city or location..."
                  clearButtonMode="while-editing"
                />
                {isSearching && (
                  <ActivityIndicator size="small" color="#fc565b" style={{marginLeft: 8}} />
                )}
              </View>
              
              {combinedResults.length > 0 ? (
                <FlatList
                  data={combinedResults}
                  renderItem={renderCityItem}
                  keyExtractor={(item) => item.id}
                  style={styles.cityList}
                  contentContainerStyle={styles.cityListContent}
                />
              ) : searchQuery.length > 0 ? (
                <Text style={styles.noResultsText}>No locations found. Try a different search.</Text>
              ) : null}
            </View>
          )}
          
          {/* Map Preview */}
          <View style={styles.mapPreviewContainer}>
            <MapView
              style={styles.mapPreview}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Circle
                center={mapRegion}
                radius={editableLocation.radiusMiles * 1609.34} // Convert miles to meters
                strokeWidth={1}
                strokeColor={'rgba(252, 86, 91, 0.5)'}
                fillColor={'rgba(252, 86, 91, 0.15)'}
              />
              <Marker
                coordinate={mapRegion}
                pinColor="#fc565b"
              />
            </MapView>
          </View>
          
          {/* Radius Slider */}
          <View style={styles.radiusContainer}>
            <Text style={styles.inputLabel}>Search Radius: {editableLocation.radiusMiles} miles</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={editableLocation.radiusMiles}
              onValueChange={(value) => setEditableLocation({...editableLocation, radiusMiles: value})}
              minimumTrackTintColor="#fc565b"
              maximumTrackTintColor="#d3d3d3"
              thumbTintColor="#fc565b"
            />
            <View style={styles.radiusLabels}>
              <Text style={styles.radiusLabel}>1 mi</Text>
              <Text style={styles.radiusLabel}>50 mi</Text>
              <Text style={styles.radiusLabel}>100 mi</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} ref={formScrollViewRef}>
        {/* Header with profile info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={40} color="white" />
          </View>
          <View style={styles.profileInfo}>
            {loading ? (
              <View style={[styles.shimmerContainer]}>
                <Animated.View
                  style={[
                    styles.shimmer,
                    {
                      left: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['-120%', '120%'],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    style={StyleSheet.absoluteFill}
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0.1, y: 0.5 }}
                    end={{ x: 0.9, y: 0.5 }}
                  />
                </Animated.View>
              </View>
            ) : (
              <Text style={styles.userName}>{userName}</Text>
            )}
            <Text style={styles.userEmail}>{auth.currentUser?.email ?? 'No email available'}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.cardContainer}>
            {renderOptionItem('person-outline', 'Edit Profile', handleEditProfile)}
            {renderOptionItem('notifications-outline', 'Notifications', handleOpenNotificationSettings)}
            {renderOptionItem('location-outline', 'Property Preferences', handleOpenPreferences)}
          </View>
        </View>

        {/* Help Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.cardContainer}>
            {renderOptionItem('help-circle-outline', 'Help and Feedback', () => {})}
            {renderOptionItem('document-text-outline', 'Terms of Use', () => {})}
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity 
          style={styles.signOutButton} 
          onPress={() => setIsSignOutModalVisible(true)}
        >
          <Ionicons name="log-out-outline" size={20} color="#fc565b" style={styles.signOutIcon} />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Deactivate Account Button */}
        <TouchableOpacity style={styles.deactivateButton} onPress={handleDeactivate}>
          <Text style={styles.deactivateButtonText}>Deactivate Account</Text>
        </TouchableOpacity>

        {/* Sign Out Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isSignOutModalVisible}
          onRequestClose={() => setIsSignOutModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Ionicons name="log-out-outline" size={40} color="#fc565b" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Sign Out</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to sign out?</Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsSignOutModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={handleSignOut}
                >
                  <Text style={styles.confirmButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Property Preferences Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isPreferencesModalVisible}
          onRequestClose={() => setIsPreferencesModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.preferencesModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Property Preferences</Text>
                <TouchableOpacity onPress={() => setIsPreferencesModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.preferencesContainer}>
                {renderEditablePreferencesData()}
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setIsPreferencesModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmButton, preferenceSaving && styles.savingButton]}
                  onPress={handleSavePreferences}
                  disabled={preferenceSaving}
                >
                  {preferenceSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Save Preferences</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditProfileModalVisible}
          onRequestClose={handleCloseEditProfile}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={handleCloseEditProfile}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.editFormContainer}
                ref={formScrollViewRef}
              >
                {editError ? (
                  <Text style={styles.errorText}>{editError}</Text>
                ) : null}

                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter first name"
                />

                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter last name"
                />

                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="(XXX) XXX-XXXX"
                  keyboardType="phone-pad"
                />

                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your address"
                  multiline
                />

                <View style={styles.spacer}></View>

                <TouchableOpacity 
                  style={styles.changePasswordButton}
                  onPress={togglePasswordFields}
                >
                  <Text style={styles.changePasswordButtonText}>
                    {showPasswordFields ? 'Hide Password Fields' : 'Change Password'}
                  </Text>
                </TouchableOpacity>

                {showPasswordFields && (
                  <>
                    <Text style={styles.inputLabel}>Current Password</Text>
                    <TextInput
                      style={styles.input}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter current password"
                      secureTextEntry
                    />

                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter new password"
                      secureTextEntry
                    />

                    <Text style={styles.inputLabel}>Confirm New Password</Text>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      secureTextEntry
                    />
                    <View style={[styles.spacer, styles.spacer2x]}></View>
                  </>
                )}
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCloseEditProfile}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.confirmButton} 
                  onPress={handleSaveProfile}
                >
                  <Text style={styles.confirmButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Deactivation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isDeactivateModalVisible}
          onRequestClose={() => setIsDeactivateModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Ionicons name="warning-outline" size={40} color="#fc565b" style={styles.modalIcon} />
              <Text style={styles.modalTitle}>Deactivate Account</Text>
              <Text style={styles.modalSubtitle}>This action cannot be undone. Please enter your password to confirm.</Text>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setIsDeactivateModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deactivateConfirmButton} onPress={handleDeactivate}>
                  <Text style={styles.confirmButtonText}>Deactivate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* App Version */}
        <Text style={styles.versionText}>ver 1</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fc565b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    marginLeft: 4,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  signOutIcon: {
    marginRight: 8,
  },
  signOutButtonText: {
    color: '#fc565b',
    fontWeight: '600',
    fontSize: 16,
  },
  deactivateButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  deactivateButtonText: {
    color: '#888',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  passwordInput: {
    width: '100%',
    padding: 14,
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 24,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  deactivateConfirmButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  versionText: {
    alignSelf: 'center',
    fontSize: 12,
    color: '#aaa',
    marginBottom: 8,
  },
  shimmerContainer: {
    height: 22,
    width: 150,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
    marginBottom: 4,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  editModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    padding: 16,
  },
  editModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editFormContainer: {
    padding: 16,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    width: '100%',
    padding: 14,
    borderColor: '#eeeeee',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  errorText: {
    color: '#fc565b',
    marginVertical: 8,
    fontSize: 14,
  },
  editModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  preferencesModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  preferencesContainer: {
    padding: 16,
    flex: 1,
  },
  preferencesEditSection: {
    padding: 10,
    backgroundColor: '#f8f8f8',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  preferenceEditItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  preferenceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  removeButton: {
    marginLeft: 10,
    padding: 4,
  },
  addPreferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  newPreferenceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  addButton: {
    marginLeft: 10,
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fafafa',
  },
  locationIcon: {
    marginRight: 8,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  citySelectionContainer: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 16,
  },
  cityList: {
    maxHeight: 200,
  },
  cityListContent: {
    paddingBottom: 5,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f9f9f9',
  },
  selectedCityItem: {
    backgroundColor: '#fc565b',
  },
  cityItemIcon: {
    marginRight: 8,
  },
  cityItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedCityItemText: {
    color: '#fff',
  },
  checkmark: {
    marginLeft: 8,
  },
  mapPreviewContainer: {
    height: 150,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject,
  },
  radiusContainer: {
    marginTop: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  radiusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  radiusLabel: {
    fontSize: 12,
    color: '#666',
  },
  savingButton: {
    opacity: 0.7,
  },
  noResultsText: {
    textAlign: 'center',
    padding: 15,
    color: '#666',
    fontStyle: 'italic',
  },
  changePasswordButton: {
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  changePasswordButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  spacer: {
    height: 20,
  },
  spacer2x: {
    height: 40,
  },
  resetAlgorithmButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#fc565b',
    marginTop: 10,
    marginBottom: 5,
  },
  resetIcon: {
    marginRight: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ProfileScreen;
