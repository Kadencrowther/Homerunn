import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay 
} from 'react-native-reanimated';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 7;
const TOTAL_STEPS = 10;

const MarketingSourceScreen = ({ navigation, route }) => {
  const [selectedSource, setSelectedSource] = useState(null);
  const userData = route.params || {};
  
  // Add debug logging
  console.log('MarketingSourceScreen received params:', {
    hasCredentials: !!userData.credentials,
    credentialsType: typeof userData.credentials,
    email: userData.credentials?.email,
    hasPassword: !!userData.credentials?.password
  });
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const optionsOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: (1 - headerOpacity.value) * -30 }]
    };
  });

  const optionsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: optionsOpacity.value,
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
    optionsOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
  }, []);

  const sources = [
    {
      value: 'Instagram',
      icon: 'logo-instagram',
      description: 'From posts or stories on Instagram'
    },
    {
      value: 'TikTok',
      icon: 'logo-tiktok',
      description: 'From videos on TikTok'
    },
    {
      value: 'Facebook',
      icon: 'logo-facebook',
      description: 'From posts or ads on Facebook'
    },
    {
      value: 'Web Search',
      icon: 'search',
      description: 'Found through a web search'
    },
    {
      value: 'Friend',
      icon: 'people',
      description: 'Recommended by a friend'
    },
    {
      value: 'Other',
      icon: 'ellipsis-horizontal',
      description: 'From another source'
    }
  ];

  const handleContinue = () => {
    const params = {
      ...userData,
      marketingSource: selectedSource
    };
    
    console.log('MarketingSourceScreen navigating to ProfileCompletion with params:', {
      hasCredentials: !!params.credentials,
      credentialsType: typeof params.credentials,
      email: params.credentials?.email,
      hasPassword: !!params.credentials?.password,
      marketingSource: params.marketingSource
    });
    
    navigation.navigate('ProfileCompletion', params);
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
        <Text style={styles.title}>How did you hear about us?</Text>
        <Text style={styles.subtitle}>Select an option below</Text>
      </Animated.View>
      
      <Animated.View style={[styles.optionsContainer, optionsAnimatedStyle]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {sources.map((source) => {
            const isSelected = selectedSource === source.value;
            return (
              <TouchableOpacity
                key={source.value}
                style={[
                  styles.optionCard,
                  isSelected && styles.selectedCard
                ]}
                onPress={() => setSelectedSource(source.value)}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                    <Ionicons 
                      name={source.icon} 
                      size={20} 
                      color={isSelected ? "#fff" : "#666"} 
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.selectedText
                    ]}>
                      {source.value}
                    </Text>
                    <Text style={[
                      styles.optionDescription,
                      isSelected && styles.selectedDescription
                    ]}>
                      {source.description}
                    </Text>
                  </View>
                </View>
                
                {isSelected && 
                  <View style={styles.checkmarkContainer}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </View>
                }
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedSource && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedSource}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            console.log('MarketingSourceScreen skipping, navigating to ProfileCompletion with params:', {
              hasCredentials: !!userData.credentials,
              credentialsType: typeof userData.credentials,
              email: userData.credentials?.email,
              hasPassword: !!userData.credentials?.password
            });
            
            navigation.navigate('ProfileCompletion', userData);
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
    marginBottom: height * 0.03,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '700',
    marginBottom: height * 0.01,
    color: '#333',
  },
  subtitle: {
    fontSize: width * 0.045,
    color: '#666',
  },
  optionsContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: height * 0.02,
  },
  optionCard: {
    width: '100%',
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.015,
    borderRadius: width * 0.03,
    backgroundColor: '#f7f7f7',
    justifyContent: 'center',
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
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ececec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  optionText: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#333',
  },
  optionDescription: {
    fontSize: width * 0.032,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
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

export default MarketingSourceScreen; 