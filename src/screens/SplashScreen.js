import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming, 
  Easing,
  withSequence,
  withDelay
} from 'react-native-reanimated';
import Svg, { Path, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Create an animated version of the SVG Path
const AnimatedPath = Animated.createAnimatedComponent(Path);

// More detailed house path drawn in the correct order to create a natural drawing animation
// Paths are designed to be drawn in a continuous motion where possible
const HOUSE_OUTLINE = "M150,60 L50,140 L50,250 L250,250 L250,140 L150,60";
const HOUSE_DOOR = "M130,250 L130,180 L170,180 L170,250";
const HOUSE_WINDOW = "M80,170 L80,210 L110,210 L110,170 L80,170";
const HOUSE_WINDOW2 = "M190,170 L190,210 L220,210 L220,170 L190,170";
const HOUSE_CHIMNEY = "M210,100 L210,70 L230,70 L230,120";

// Global static variables to track splash animation state
export let splashHasRun = false;
export let splashAnimationCompleted = false;

// Helper function to calculate the SVG path length approximately
const getPathLength = (path) => {
  // This is a simple approximation - real apps might use more accurate methods
  const parts = path.split(' ');
  if (parts.length < 4) return 100;
  return parts.length * 50;
};

const SplashScreen = ({ navigation }) => {
  // Animation progress values for each path
  const outlineProgress = useSharedValue(0);
  const doorProgress = useSharedValue(0);
  const windowProgress = useSharedValue(0);
  const window2Progress = useSharedValue(0);
  const chimneyProgress = useSharedValue(0);
  
  const pathOpacity = useSharedValue(splashAnimationCompleted ? 0 : 1);
  const logoOpacity = useSharedValue(splashAnimationCompleted ? 1 : 0);
  
  // State to control when to show the full logo
  const [showFullLogo, setShowFullLogo] = useState(splashAnimationCompleted);

  // Calculate approximate path lengths for better animation timing
  const outlineLength = getPathLength(HOUSE_OUTLINE);
  const doorLength = getPathLength(HOUSE_DOOR);
  const windowLength = getPathLength(HOUSE_WINDOW);
  const window2Length = getPathLength(HOUSE_WINDOW2);
  const chimneyLength = getPathLength(HOUSE_CHIMNEY);

  useEffect(() => {
    console.log('Splash screen mounted, animation completed:', splashAnimationCompleted);
    
    // If splash has already run in a previous mount, navigate immediately
    if (splashHasRun && navigation) {
      console.log('Splash already ran once, skipping to Welcome');
      navigation.navigate('Welcome');
      return;
    }
    
    // If animation has already completed but we haven't navigated yet,
    // just show the final state without animating
    if (splashAnimationCompleted) {
      console.log('Animation already completed, showing final state');
      return; // Skip all animations, just show the final logo state
    }
    
    // Mark that splash has run
    splashHasRun = true;
    
    // Start drawing animation sequence
    console.log('Starting splash animation for the first time');
    
    // 1. Draw house outline
    outlineProgress.value = withTiming(1, { 
      duration: 1500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    });
    
    // 2. Draw chimney after a short delay
    chimneyProgress.value = withDelay(1000, withTiming(1, { 
      duration: 600, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    // 3. Draw windows after outline is mostly done
    windowProgress.value = withDelay(1600, withTiming(1, { 
      duration: 500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    window2Progress.value = withDelay(1900, withTiming(1, { 
      duration: 500, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    // 4. Draw door last
    doorProgress.value = withDelay(2200, withTiming(1, { 
      duration: 600, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
    
    // After all drawing is complete, fade in the full logo
    setTimeout(() => {
      // Fade out the drawn path
      pathOpacity.value = withTiming(0, { duration: 800 });
      
      // Show the full logo and fade it in
      setShowFullLogo(true);
      logoOpacity.value = withTiming(1, { duration: 1000 });
      
      // Mark animation as completed
      splashAnimationCompleted = true;
      
      // Navigate to Welcome screen after logo is fully visible
      setTimeout(() => {
        if (navigation) {
          console.log('Animation complete, navigating to Welcome screen');
          navigation.navigate('Welcome');
        }
      }, 1200);
    }, 3100);
  }, [navigation]);

  // Animated props for the SVG paths
  const outlineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - outlineProgress.value) * outlineLength,
    opacity: pathOpacity.value
  }));
  
  const doorAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - doorProgress.value) * doorLength,
    opacity: pathOpacity.value
  }));
  
  const windowAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - windowProgress.value) * windowLength,
    opacity: pathOpacity.value
  }));
  
  const window2AnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - window2Progress.value) * window2Length,
    opacity: pathOpacity.value
  }));
  
  const chimneyAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - chimneyProgress.value) * chimneyLength,
    opacity: pathOpacity.value
  }));

  return (
    <View style={styles.container}>
      {/* Drawing animation SVG */}
      <Svg width={300} height={300} viewBox="0 0 300 300" style={styles.svg}>
        <G>
          <AnimatedPath
            d={HOUSE_OUTLINE}
            stroke="#FFFFFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={outlineLength}
            animatedProps={outlineAnimatedProps}
          />
          <AnimatedPath
            d={HOUSE_DOOR}
            stroke="#FFFFFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={doorLength}
            animatedProps={doorAnimatedProps}
          />
          <AnimatedPath
            d={HOUSE_WINDOW}
            stroke="#FFFFFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={windowLength}
            animatedProps={windowAnimatedProps}
          />
          <AnimatedPath
            d={HOUSE_WINDOW2}
            stroke="#FFFFFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={window2Length}
            animatedProps={window2AnimatedProps}
          />
          <AnimatedPath
            d={HOUSE_CHIMNEY}
            stroke="#FFFFFF"
            strokeWidth={5}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={chimneyLength}
            animatedProps={chimneyAnimatedProps}
          />
        </G>
      </Svg>
      
      {/* Full logo that fades in */}
      {(showFullLogo || splashAnimationCompleted) && (
        <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
          <Image
            source={require('../../assets/homerunnlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF5A5F', // Exact Homerunn brand color
  },
  svg: {
    position: 'absolute',
    zIndex: 1,
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: width * 0.9, // 90% of screen width
    height: height * 0.4, // 40% of screen height
  },
});

export default SplashScreen;
