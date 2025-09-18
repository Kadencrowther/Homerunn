import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  StatusBar,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence
} from 'react-native-reanimated';
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 4;
const TOTAL_STEPS = 10;

const AgentScreen = ({ navigation, route }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [agentName, setAgentName] = useState('');
  const credentials = route.params?.credentials || {};
  const preferences = route.params?.preferences || [];
  const timeframe = route.params?.timeframe || null;
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const optionsOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const inputHeight = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

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

  const inputAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: inputHeight.value,
      opacity: inputOpacity.value,
      marginTop: inputHeight.value > 0 ? 10 : 0,
      overflow: 'hidden',
    };
  });

  // Animate elements on mount
  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 800 });
    optionsOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
    buttonsOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
  }, []);

  // Animate the input field appearance when "Yes" is selected
  useEffect(() => {
    if (selectedOption === 'Yes') {
      inputHeight.value = withTiming(60, { duration: 300 });
      inputOpacity.value = withDelay(100, withTiming(1, { duration: 200 }));
    } else {
      inputHeight.value = withTiming(0, { duration: 200 });
      inputOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [selectedOption]);

  const options = [
    {
      value: 'Yes',
      icon: 'person-circle-outline',
      description: 'I am already working with an agent'
    },
    {
      value: 'No',
      icon: 'close-circle-outline',
      description: 'I need to find an agent'
    },
    {
      value: 'I\'m not sure',
      icon: 'help-circle-outline',
      description: 'I\'m still deciding'
    }
  ];

  const handleContinue = () => {
    // Add comprehensive debugging to clearly show what credentials are being passed
    console.log('AgentScreen credentials check:', {
      email: credentials?.email,
      hasPassword: !!credentials?.password,
      credentialsType: typeof credentials,
      credentialsEmpty: Object.keys(credentials).length === 0
    });
    
    const params = {
      credentials: credentials,
      preferences: preferences,
      timeframe: timeframe,
      hasAgent: selectedOption,
      agentName: selectedOption === 'Yes' ? agentName : null
    };
    
    console.log('AgentScreen passing full parameters to Location:', params);
    
    navigation.navigate('Location', params);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Update the console log to include more information
  console.log('AgentScreen received from previous screen:', {
    credentialsExists: !!credentials,
    email: credentials?.email,
    hasPassword: !!credentials?.password,
    preferencesCount: preferences.length,
    timeframe: timeframe
  });

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
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
          <Text style={styles.title}>Are you already working with a real estate agent?</Text>
          <Text style={styles.subtitle}>Select an option below</Text>
        </Animated.View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.optionsContainer, optionsAnimatedStyle]}>
            {options.map((option) => {
              const isSelected = selectedOption === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    isSelected && styles.selectedCard
                  ]}
                  onPress={() => setSelectedOption(option.value)}
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
                    <View style={styles.textContainer}>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.selectedText
                      ]}>
                        {option.value}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        isSelected && styles.selectedDescription
                      ]}>
                        {option.description}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && 
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    </View>
                  }
                </TouchableOpacity>
              );
            })}

            <Animated.View style={[styles.inputContainer, inputAnimatedStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your agent's name"
                value={agentName}
                onChangeText={setAgentName}
                placeholderTextColor="#999"
              />
            </Animated.View>
          </Animated.View>
        </ScrollView>

        <Animated.View style={[styles.bottomContainer, buttonAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !selectedOption && styles.disabledButton,
              (selectedOption === 'Yes' && !agentName.trim()) && styles.disabledButton
            ]}
            onPress={handleContinue}
            disabled={!selectedOption || (selectedOption === 'Yes' && !agentName.trim())}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => {
              // Add detailed debugging for skip button too
              const skipParams = {
                credentials: credentials,
                preferences: preferences,
                timeframe: timeframe,
                hasAgent: null
              };
              
              console.log('AgentScreen skip full parameters to Location:', skipParams);
              
              navigation.navigate('Location', skipParams);
            }}
          >
            <Text style={styles.skipButtonText}>Skip this step</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: height * 0.05,
  },
  optionsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: height * 0.05,
  },
  optionCard: {
    width: '100%',
    padding: height * 0.02,
    marginBottom: height * 0.02,
    borderRadius: width * 0.025,
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
    width: Math.min(width * 0.12, 40),
    height: Math.min(width * 0.12, 40),
    borderRadius: Math.min(width * 0.06, 20),
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
    top: 12,
    right: 12,
  },
  optionText: {
    fontSize: Math.min(width * 0.045, 16),
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: Math.min(width * 0.035, 14),
    color: '#666',
    lineHeight: Math.min(width * 0.045, 18),
  },
  selectedText: {
    color: '#fff',
  },
  selectedDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputContainer: {
    width: '100%',
    borderRadius: width * 0.025,
    backgroundColor: '#f7f7f7',
    marginBottom: height * 0.02,
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: Math.min(width * 0.045, 16),
    color: '#333',
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

export default AgentScreen; 