import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const ShimmerEffect = ({ style }) => {
  const shimmerAnimation = new Animated.Value(-width);

  useEffect(() => {
    const loopShimmerAnimation = () => {
      Animated.timing(shimmerAnimation, {
        toValue: width,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        shimmerAnimation.setValue(-width);
        loopShimmerAnimation();
      });
    };

    loopShimmerAnimation();

    return () => {
      shimmerAnimation.stopAnimation();
    };
  }, []);

  return (
    <View style={[styles.container, style]}>
      <Animated.View 
        style={[
          styles.shimmer,
          { transform: [{ translateX: shimmerAnimation }] }
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    width: width * 2,
    height: '100%',
  },
});

export default ShimmerEffect; 