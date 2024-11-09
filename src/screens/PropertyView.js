import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertyView from '../screens/PropertyView';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack Navigator for Home screen with PropertyView screen
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} // Hide header for main home screen
      />
      <Stack.Screen 
        name="PropertyView" 
        component={PropertyView} 
        options={{
          title: 'Property Details',
          headerBackTitleVisible: false, // Hides the "Back" text next to the arrow (iOS-specific)
          headerTintColor: '#FF5733', // Customize back arrow color if needed
          tabBarVisible: false, // Hide bottom tab bar (React Navigation 5+ automatically hides it in a Stack view)
        }} 
      />
    </Stack.Navigator>
  );
};

const RootNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Search') {
            iconName = 'search';
          } else if (route.name === 'Saved') {
            iconName = 'heart';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF5733', // Customize active color
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator} 
        options={{ title: 'Home' }} 
      />
      <Tab.Screen 
        name="Search" 
        component={SearchScreen} 
        options={{ title: 'Search' }} 
      />
      <Tab.Screen 
        name="Saved" 
        component={SavedScreen} 
        options={{ title: 'Saved' }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
};

export default RootNavigator;
