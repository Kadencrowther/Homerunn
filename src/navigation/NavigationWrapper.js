import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const NavigationWrapper = () => {
  return (
    <NavigationContainer
      onStateChange={(state) => {
        if (state) {
          const currentRoute = state.routes[state.index];
          console.log("[NAVIGATION]", currentRoute.name);
        }
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="App" component={AppNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default NavigationWrapper; 