# Progress Bar Implementation Guide

This guide will help you implement the progress bar on all screens in the onboarding flow.

## Steps Already Implemented
1. `UserInfoScreen` - Step 1/10
2. `PersonalPreferencesScreen` - Step 2/10
3. `TimeframeScreen` - Step 3/10

## Steps To Be Implemented

For each remaining screen, follow these steps:

1. Import the ProgressBar component:
```javascript
import ProgressBar from '../components/ProgressBar';
```

2. Define constants for the current step:
```javascript
// Define the current step for this screen (X out of 10)
const CURRENT_STEP = X; // Replace X with the appropriate step number
const TOTAL_STEPS = 10;
```

3. Add the ProgressBar to the screen layout:
```javascript
<View style={styles.container}>
  <StatusBar barStyle="dark-content" />
  
  {/* Progress Bar */}
  <View style={styles.progressContainer}>
    <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
  </View>
  
  {/* Rest of your screen content */}
</View>
```

4. Add styles for the progress container:
```javascript
progressContainer: {
  paddingTop: height * 0.06,
  paddingBottom: height * 0.02,
},
```

## Remaining Screens and Their Step Numbers

4. `AgentScreen` - Step 4/10
5. `LocationScreen` - Step 5/10
6. `ReviewScreen` - Step 6/10
7. `MarketingSourceScreen` - Step 7/10
8. `ProfileCompletionScreen` - Step 8/10
9. `NotificationSetupScreen` - Step 9/10
10. `CongratulationsScreen` - Step 10/10

## Implementation Example for AgentScreen

```javascript
// At the top of the file
import ProgressBar from '../components/ProgressBar';

const { width, height } = Dimensions.get('window');

// Define the current step for this screen
const CURRENT_STEP = 4;
const TOTAL_STEPS = 10;

const AgentScreen = ({ navigation, route }) => {
  // ... existing code ...

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar step={CURRENT_STEP} totalSteps={TOTAL_STEPS} />
      </View>
      
      {/* Rest of your screen content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.05,
    backgroundColor: '#fff',
  },
  progressContainer: {
    paddingTop: height * 0.06,
    paddingBottom: height * 0.02,
  },
  // ... rest of your styles
});
```

## Notes
- Ensure the progress bar is placed at the top of the screen content
- Make sure to adjust the padding/margin of other elements if needed
- The progress bar automatically calculates the width based on the step/total ratio 