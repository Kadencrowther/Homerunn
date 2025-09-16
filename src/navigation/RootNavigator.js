import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SetupNavigator from './SetupNavigator';
import AppNavigator from './AppNavigator';

const Stack = createStackNavigator();

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Setup" component={SetupNavigator} />
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
