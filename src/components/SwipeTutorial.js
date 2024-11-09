import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const SwipeTutorial = ({ visible, onDismiss }) => {
  const [step, setStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [arrowAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      startStepAnimation();
      
      const timer = setTimeout(() => {
        if (step < 3) {
          setStep(prev => prev + 1);
        } else {
          onDismiss();
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [visible, step]);

  const startStepAnimation = () => {
    fadeAnim.setValue(0);
    arrowAnim.setValue(0);
    scaleAnim.setValue(1);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      step === 3 ? 
        Animated.loop(
          Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        ) :
        Animated.sequence([
          Animated.timing(arrowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(arrowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
    ]).start();
  };

  const getStepStyle = () => {
    switch(step) {
      case 0: // Swipe left - centered
        return { alignSelf: 'center', top: height * 0.4 };
      case 1: // Swipe right - centered
        return { alignSelf: 'center', top: height * 0.4 };
      case 2: // Swipe up
        return { top: height * 0.3, alignSelf: 'center' };
      case 3: // Tap
        return { top: height * 0.45, alignSelf: 'center' };
      default:
        return {};
    }
  };

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={onDismiss}
    >
      <Animated.View 
        style={[
          styles.tutorialContainer,
          getStepStyle(),
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View style={{
          transform: step === 3 
            ? [{ scale: scaleAnim }] 
            : [{ translateX: step === 0 ? arrowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -50]
              }) : step === 1 ? arrowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 50]
              }) : 0 },
              { translateY: step === 2 ? arrowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -50]
              }) : 0 }]
        }}>
          <Ionicons 
            name={step === 3 ? "finger-print" : step === 2 ? "arrow-up" : step === 1 ? "arrow-forward" : "arrow-back"} 
            size={step === 3 ? 60 : 50} 
            color="#fff"
          />
        </Animated.View>
        <Text style={styles.text}>
          {step === 0 ? "Swipe left to dislike" :
           step === 1 ? "Swipe right to like" :
           step === 2 ? "Swipe up to love" :
           "Tap to view property"}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tutorialContainer: {
    position: 'absolute',
    alignItems: 'center',
    padding: 20,
    width: width * 0.8,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 20,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

export default SwipeTutorial; 