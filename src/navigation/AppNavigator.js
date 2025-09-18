import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import SavedScreen from '../screens/SavedScreen';
import SearchScreen from '../screens/SearchScreen';
import FlashScreen from '../screens/FlashScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PropertyImages from '../screens/PropertyImages';
import PropertyDetails from '../screens/PropertyDetails';
import GetListingOffer from '../screens/GetListingOffer';
import FindAnAgent from '../screens/FindAnAgent';
import GetPrequalified from '../screens/GetPrequalified';
import MyAgent from '../screens/myagent';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create a stack navigator for Home screen and PropertyImages
const HomeStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        screenListeners: {
          focus: (e) => {
            const currentRoute = e.target.split('-')[0];
            console.log(`[StackNav] Home stack screen focused: ${currentRoute}`);
          },
          state: (e) => {
            const routes = e.data.state?.routes || [];
            if (routes.length > 0) {
              const currentRoute = routes[routes.length - 1];
              console.log(`[StackNav] Home stack navigated to: ${currentRoute.name}`);
            }
          }
        }
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="PropertyImages" component={PropertyImages} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
    </Stack.Navigator>
  );
};

// Create a stack navigator for Search screen and its related screens
const SearchStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={({ route }) => ({ 
        // Hide headers completely for all screens in SearchStack
        headerShown: false,
        screenListeners: {
          focus: (e) => {
            const currentRoute = e.target.split('-')[0];
            console.log(`[StackNav] Search stack screen focused: ${currentRoute}`);
          },
          state: (e) => {
            const routes = e.data.state?.routes || [];
            if (routes.length > 0) {
              const currentRoute = routes[routes.length - 1];
              console.log(`[StackNav] Search stack navigated to: ${currentRoute.name}`);
            }
          }
        }
      })}
    >
      <Stack.Screen name="SearchMain" component={SearchScreen} />
      <Stack.Screen name="PropertyImages" component={PropertyImages} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
    </Stack.Navigator>
  );
};

// Create a stack navigator for Saved screen and its related screens
const SavedStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        screenListeners: {
          focus: (e) => {
            const currentRoute = e.target.split('-')[0];
            console.log(`[StackNav] Saved stack screen focused: ${currentRoute}`);
          },
          state: (e) => {
            const routes = e.data.state?.routes || [];
            if (routes.length > 0) {
              const currentRoute = routes[routes.length - 1];
              console.log(`[StackNav] Saved stack navigated to: ${currentRoute.name}`);
            }
          }
        }
      }}
    >
      <Stack.Screen name="SavedMain" component={SavedScreen} />
      <Stack.Screen name="PropertyImages" component={PropertyImages} />
      <Stack.Screen name="PropertyDetails" component={PropertyDetails} />
    </Stack.Navigator>
  );
};

// Create a stack navigator for Flash screen and its related screens
const FlashStack = () => {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        screenListeners: {
          focus: (e) => {
            const currentRoute = e.target.split('-')[0];
            console.log(`[StackNav] Flash stack screen focused: ${currentRoute}`);
          },
          state: (e) => {
            const routes = e.data.state?.routes || [];
            if (routes.length > 0) {
              const currentRoute = routes[routes.length - 1];
              console.log(`[StackNav] Flash stack navigated to: ${currentRoute.name}`);
            }
          }
        }
      }}
    >
      <Stack.Screen name="FlashMain" component={FlashScreen} />
      <Stack.Screen name="GetListingOffer" component={GetListingOffer} />
      <Stack.Screen name="FindAnAgent" component={FindAnAgent} />
      <Stack.Screen name="GetPrequalified" component={GetPrequalified} />
      <Stack.Screen name="MyAgent" component={MyAgent} />
    </Stack.Navigator>
  );
};

// Wrap screen components with navigation loggers
const withNavigationLogger = (ScreenComponent, screenName) => {
  return (props) => {
    useEffect(() => {
      console.log(`[Navigation] Tab selected: ${screenName}`);
      // Log that navigation has occurred to this screen
      const unsubscribe = props.navigation.addListener('focus', () => {
        console.log(`[Navigation] Screen focused: ${screenName}`);
      });
      
      return unsubscribe;
    }, [props.navigation]);
    
    return <ScreenComponent {...props} />;
  };
};

// Enhanced components with logging
const EnhancedHomeStack = (props) => {
  useEffect(() => {
    console.log('[Navigation] Tab selected: Home');
    const unsubscribe = props.navigation.addListener('focus', () => {
      console.log('[Navigation] Screen focused: Home');
    });
    
    return unsubscribe;
  }, [props.navigation]);
  
  return <HomeStack {...props} />;
};

const EnhancedSearchScreen = (props) => {
  useEffect(() => {
    console.log('[Navigation] Tab selected: Search');
    const unsubscribe = props.navigation.addListener('focus', () => {
      console.log('[Navigation] Screen focused: Search');
    });
    
    return unsubscribe;
  }, [props.navigation]);
  
  return <SearchStack {...props} />;
};

const EnhancedSavedScreen = (props) => {
  useEffect(() => {
    console.log('[Navigation] Tab selected: Saved');
    const unsubscribe = props.navigation.addListener('focus', () => {
      console.log('[Navigation] Screen focused: Saved');
    });
    
    return unsubscribe;
  }, [props.navigation]);
  
  return <SavedStack {...props} />;
};

const EnhancedFlashStack = (props) => {
  useEffect(() => {
    console.log('[Navigation] Tab selected: Flash');
    const unsubscribe = props.navigation.addListener('focus', () => {
      console.log('[Navigation] Screen focused: Flash');
    });
    
    return unsubscribe;
  }, [props.navigation]);
  
  return <FlashStack {...props} />;
};

const EnhancedProfileScreen = (props) => {
  useEffect(() => {
    console.log('[Navigation] Tab selected: Profile');
    const unsubscribe = props.navigation.addListener('focus', () => {
      console.log('[Navigation] Screen focused: Profile');
    });
    
    return unsubscribe;
  }, [props.navigation]);
  
  return <ProfileScreen {...props} />;
};

const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: route.name === 'Search' || 
                    route.name === 'Flash' || 
                    route.name === 'Profile',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Saved') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Flash') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#fc565b',
        tabBarInactiveTintColor: 'gray',
      })}
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          // Prevent default navigation
          e.preventDefault();
          
          // Log tab press
          console.log(`[Navigation] Tab pressed: ${route.name}`);
          
          // Get the target route name
          const tabName = route.name;
          
          // Reset the stack to the first screen before navigating to the tab
          if (tabName === 'Home') {
            // Reset the Home stack to HomeMain
            navigation.navigate('Home', {
              screen: 'HomeMain',
              merge: true,
            });
            console.log('[Navigation] Reset Home stack to HomeMain');
          } 
          else if (tabName === 'Search') {
            // Reset the Search stack to SearchMain
            navigation.navigate('Search', {
              screen: 'SearchMain',
              merge: true,
            });
            console.log('[Navigation] Reset Search stack to SearchMain');
          }
          else if (tabName === 'Saved') {
            // Reset the Saved stack to SavedMain
            navigation.navigate('Saved', {
              screen: 'SavedMain',
              merge: true,
            });
            console.log('[Navigation] Reset Saved stack to SavedMain');
          }
          else if (tabName === 'Flash') {
            // Reset the Flash stack to FlashMain
            navigation.navigate('Flash', {
              screen: 'FlashMain',
              merge: true,
            });
            console.log('[Navigation] Reset Flash stack to FlashMain');
          }
          else {
            // For Profile tab, just navigate normally
            navigation.navigate(tabName);
          }
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={EnhancedHomeStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Search" 
        component={EnhancedSearchScreen}
        options={{ 
          headerShown: false
        }}
      />
      <Tab.Screen 
        name="Saved" 
        component={EnhancedSavedScreen}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Flash" 
        component={EnhancedFlashStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Profile" component={EnhancedProfileScreen} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
