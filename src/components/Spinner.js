import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const Spinner = ({ size = 'md', color = 'grey', style }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  const sizeMap = {
    sm: 24,
    md: 40,
    lg: 48
  };

  const colorMap = {
    grey: '#E8E8E8',
    salmon: '#fc565b'
  };

  const spinnerSize = sizeMap[size];
  const borderWidth = size === 'sm' ? 3 : 4;
  const spinnerColor = colorMap[color] || color;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );
    spin.start();
  }, [spinValue]);

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: spinnerSize,
            height: spinnerSize,
            borderRadius: spinnerSize / 2,
            borderWidth: borderWidth,
            borderColor: spinnerColor,
            borderTopColor: 'transparent',
            transform: [{ rotate }],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {},
});

export default Spinner;

