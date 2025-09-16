import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar
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

// Define the current step for this screen (3 out of 10)
const CURRENT_STEP = 3;
const TOTAL_STEPS = 10;

const TimeframeScreen = ({ navigation, route }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState(null);
  const credentials = route.params?.credentials || {};
  const preferences = route.params?.preferences || [];
  
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

  const timeframeOptions = [
    {
      value: 'In the next couple months',
      icon: 'calendar',
    },
    {
      value: 'In the next year',
      icon: 'hourglass',
    },
    {
      value: 'I\'m just looking at homes for now',
      icon: 'search',
    }
  ];

  const handleContinue = () => {
    console.log('TimeframeScreen passing params:', {
      credentials: credentials,
      preferences: preferences,
      timeframe: selectedTimeframe
    });
    navigation.navigate('Agent', {
      credentials: credentials,
      preferences: preferences,
      timeframe: selectedTimeframe
    });
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
        <Text style={styles.title}>When are you looking to get into a home?</Text>
        <Text style={styles.subtitle}>Select your timeline</Text>
      </Animated.View>
      
      <Animated.View style={[styles.optionsContainer, optionsAnimatedStyle]}>
        {timeframeOptions.map((option, index) => {
          const isSelected = selectedTimeframe === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionCard,
                isSelected && styles.selectedCard
              ]}
              onPress={() => setSelectedTimeframe(option.value)}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={isSelected ? "#fff" : "#666"} 
                  />
                </View>
                <Text style={[
                  styles.optionText,
                  isSelected && styles.selectedText
                ]}>
                  {option.value}
                </Text>
              </View>
              
              {isSelected && 
                <View style={styles.checkmarkContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                </View>
              }
            </TouchableOpacity>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedTimeframe && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={!selectedTimeframe}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('Agent', {
            credentials: credentials,
            preferences: preferences,
            timeframe: null
          })}
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
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: height * 0.05,
  },
  optionCard: {
    width: '100%',
    padding: height * 0.025,
    marginBottom: height * 0.03,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ececec',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  optionText: {
    fontSize: width * 0.045,
    fontWeight: '500',
    color: '#333',
    flex: 1,
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

export default TimeframeScreen; 