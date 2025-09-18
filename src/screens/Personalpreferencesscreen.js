import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay 
} from 'react-native-reanimated';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen (2 out of 10)
const CURRENT_STEP = 2;
const TOTAL_STEPS = 10;

const PersonalPreferencesScreen = ({ navigation, route }) => {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const credentials = route.params?.credentials || {};
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: (1 - headerOpacity.value) * -30 }]
    };
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: contentOpacity.value,
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonsOpacity.value,
      transform: [{ translateY: (1 - buttonsOpacity.value) * 20 }]
    };
  });

  // Animate elements on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    contentOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
  }, []);

  const preferences = [
    'Multiple Bedrooms',
    'New Build',
    'Low Price',
    'Safe Area',
    'Multiple Bathrooms',
    'Investment',
    'Multi-Family',
    'Good Schools',
    'Pool',
    'Large Yard',
    'Open Plan',
    'Smart Home',
    'Energy Efficient',
    'Garage',
    'Basement',
    'High Ceiling',
    'Fireplace',
    'Quiet Street',
    'Near Parks',
    'Modern',
    'Traditional',
    'Luxury',
    'Fixer Upper',
    'Waterfront',
    'Mountain View',
    'City View',
    'Gated',
    'Corner Lot',
    'Cul-de-sac',
    'No HOA',
    'RV Parking',
    'Spacious',
    'Home Office',
    'Guest House',
    'Solar Ready',
    'Privacy',
    'Near Transit'
  ];

  const togglePreference = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(item => item !== preference));
    } else if (selectedPreferences.length < 5) {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  // For the visual indicator showing how many preferences are selected
  const renderSelectionIndicator = () => {
    return (
      <View style={styles.selectionIndicator}>
        {[...Array(5)].map((_, index) => (
          <View 
            key={index} 
            style={[
              styles.indicatorDot, 
              index < selectedPreferences.length && styles.activeDot
            ]} 
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header row with back button and progress bar */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.progressContainer}>
          <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
        </View>
      </View>
      
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        <Text style={styles.title}>What matters most to you in a home?</Text>
        <Text style={styles.subtitle}>Select up to 5 preferences</Text>
        {renderSelectionIndicator()}
      </Animated.View>
      
      <Animated.View style={[{ flex: 1 }, contentAnimatedStyle]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.preferencesGrid}>
            {preferences.map((preference, index) => {
              const isSelected = selectedPreferences.includes(preference);
              return (
                <TouchableOpacity
                  key={preference}
                  style={[
                    styles.preferenceCard,
                    isSelected && styles.selectedCard
                  ]}
                  onPress={() => togglePreference(preference)}
                  activeOpacity={0.7}
                >
                  {isSelected && 
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    </View>
                  }
                  <Text style={[
                    styles.preferenceText,
                    isSelected && styles.selectedText
                  ]}>
                    {preference}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedPreferences.length === 0 && styles.disabledButton
          ]}
          onPress={() => {
            console.log('PersonalPreferencesScreen passing params:', {
              credentials: route.params?.credentials,
              preferences: selectedPreferences
            });
            navigation.navigate('Timeframe', {
              credentials: route.params?.credentials,
              preferences: selectedPreferences
            });
          }}
          disabled={selectedPreferences.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            console.log('PersonalPreferencesScreen skipping with params:', {
              credentials: route.params?.credentials,
              preferences: []
            });
            navigation.navigate('Timeframe', {
              credentials: route.params?.credentials,
              preferences: []
            });
          }}
        >
          <Text style={styles.skipButtonText}>Skip this step</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: height * 0.06,
    marginBottom: height * 0.02,
  },
  progressContainer: {
    flex: 1,
    marginLeft: 10,
  },
  backButton: {
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
    zIndex: 10,
  },
  headerContainer: {
    marginTop: height * 0.03,
    marginBottom: height * 0.06,
    alignItems: 'center',
  },
  title: {
    fontSize: width * 0.075,
    fontWeight: '700',
    marginBottom: height * 0.01,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#666',
    textAlign: 'center',
    marginBottom: height * 0.02,
  },
  selectionIndicator: {
    flexDirection: 'row',
    marginTop: height * 0.02,
  },
  indicatorDot: {
    width: width * 0.03,
    height: width * 0.03,
    borderRadius: width * 0.015,
    backgroundColor: '#ddd',
    marginHorizontal: width * 0.01,
  },
  activeDot: {
    backgroundColor: '#fc565b',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: height * 0.05,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.01,
  },
  preferenceCard: {
    width: width * 0.26,
    height: width * 0.26,
    margin: width * 0.005,
    marginBottom: width * 0.025,
    borderRadius: width * 0.025,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.12,
    shadowRadius: 2.84,
    elevation: 2,
    overflow: 'hidden',
  },
  selectedCard: {
    backgroundColor: '#fc565b',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  preferenceText: {
    fontSize: Math.min(width * 0.032, 14),
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    paddingHorizontal: width * 0.015,
    lineHeight: Math.min(width * 0.04, 18),
  },
  selectedText: {
    color: '#fff',
  },
  bottomContainer: {
    marginTop: height * 0.02,
    paddingBottom: height * 0.04,
  },
  continueButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.018,
    borderRadius: width * 0.02,
    marginBottom: height * 0.02,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: 'rgba(252, 86, 91, 0.5)',
    shadowOpacity: 0.1,
  },
  continueButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: height * 0.01,
  },
  skipButtonText: {
    color: '#fc565b',
    textAlign: 'center',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
});

export default PersonalPreferencesScreen;
