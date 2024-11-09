import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FlashScreen from '../screens/FlashScreen';
import PropertyImages from '../screens/PropertyImages';
import SplashScreen from '../screens/SplashScreen';
import GetCashOffer from '../screens/GetCashOffer';
import FindAnAgent from '../screens/FindAnAgent';
import GetPrequalified from '../screens/GetPrequalified';
import PropertyDetails from '../screens/PropertyDetails';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Main tab navigation
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case 'HomeTab':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'SearchTab':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case 'SavedTab':
              iconName = focused ? 'heart' : 'heart-outline';
              break;
            case 'FlashTab':
              iconName = focused ? 'flash' : 'flash-outline';
              break;
            case 'ProfileTab':
              iconName = focused ? 'person' : 'person-outline';
              break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fc565b',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ 
          headerShown: false,
          title: 'Home'
        }} 
      />
      <Tab.Screen 
        name="SearchTab" 
        component={SearchScreen}
        options={{ title: 'Search' }} 
      />
      <Tab.Screen 
        name="SavedTab" 
        component={SavedScreen} 
        options={{ 
          headerShown: false,
          title: 'Saved'
        }} 
      />
      <Tab.Screen 
        name="FlashTab" 
        component={FlashScreen}
        options={{ 
          headerShown: true,
          title: 'Flash'
        }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen}
        options={{ title: 'Profile' }} 
      />
    </Tab.Navigator>
  );
};

// Root stack navigator
const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen 
        name="Splash" 
        component={SplashScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="PropertyImages" 
        component={PropertyImages} 
        options={{
          headerBackTitleVisible: false,
          headerTintColor: '#fc565b',
          headerTitle: '',
          headerTransparent: true,
          presentation: 'card',
        }} 
      />
      <Stack.Screen 
        name="PropertyDetails" 
        component={PropertyDetails} 
        options={{
          headerBackTitleVisible: false,
          headerTintColor: '#fc565b',
          headerTitle: 'Property Details',
          presentation: 'card'
        }} 
      />
      <Stack.Screen 
        name="GetCashOffer" 
        component={GetCashOffer} 
        options={{
          headerBackTitleVisible: false,
          headerTintColor: '#fc565b',
          headerTitle: 'Get Cash Offer',
        }} 
      />
      <Stack.Screen 
        name="FindAnAgent" 
        component={FindAnAgent} 
        options={{
          headerBackTitleVisible: false,
          headerTintColor: '#fc565b',
          headerTitle: 'Find an Agent',
        }} 
      />
      <Stack.Screen 
        name="GetPrequalified" 
        component={GetPrequalified} 
        options={{
          headerBackTitleVisible: false,
          headerTintColor: '#fc565b',
          headerTitle: 'Get Prequalified',
        }} 
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
