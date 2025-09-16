import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * A progress bar component that shows the user's progress through the onboarding flow.
 * 
 * @param {Object} props
 * @param {number} props.step - Current step in the onboarding process (1-10)
 * @param {number} props.totalSteps - Total number of steps (defaults to 10)
 * @param {string} props.activeColor - Color of the filled portion (defaults to #fc565b)
 * @param {string} props.inactiveColor - Color of the unfilled portion (defaults to #f0f0f0)
 * @param {number} props.height - Height of the progress bar (defaults to 6)
 */
const ProgressBar = ({ 
  step, 
  totalSteps = 10, 
  activeColor = '#fc565b', 
  inactiveColor = '#f0f0f0',
  height = 6
}) => {
  // Calculate progress percentage
  const progress = Math.min(step / totalSteps, 1);
  
  return (
    <View style={[styles.container, { height }]}>
      <View 
        style={[
          styles.progressBar, 
          { 
            width: `${progress * 100}%`,
            backgroundColor: activeColor
          }
        ]} 
      />
      <View 
        style={[
          styles.remainingBar, 
          { 
            width: `${(1 - progress) * 100}%`,
            backgroundColor: inactiveColor
          }
        ]} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  remainingBar: {
    height: '100%',
  }
});

export default ProgressBar; 