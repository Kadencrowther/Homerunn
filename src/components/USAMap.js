import React from 'react';
import { View, StyleSheet, Text, Dimensions, ScrollView } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { allStates } from '../data/statesData';
import LocationSearch from './LocationSearch';
import usa from '@svg-maps/usa';

const { width } = Dimensions.get('window');

const USAMap = ({ selectedState, onStatePress, onCitySelect }) => {
  const handleStateSelect = (stateAbbr) => {
    onStatePress(stateAbbr);
  };

  const handleCitySelect = (cityName, stateAbbr) => {
    // First select the state, then the city
    onStatePress(stateAbbr);
    // Pass city to parent
    if (onCitySelect) {
      onCitySelect(cityName, stateAbbr);
    }
  };

  // Log to verify Hawaii is in the map
  React.useEffect(() => {
    const hawaiiLocation = usa.locations.find(loc => loc.id.toUpperCase() === 'HI');
    if (hawaiiLocation) {
      console.log('Hawaii found in map data!');
      console.log('Hawaii path:', hawaiiLocation.path.substring(0, 50) + '...');
    } else {
      console.log('Hawaii NOT found in map data');
    }
    console.log('Total states in map:', usa.locations.length);
    console.log('ViewBox:', usa.viewBox);
  }, []);

  const renderState = (location) => {
    const stateAbbr = location.id.toUpperCase();
    const state = allStates[stateAbbr];
    
    if (!state) return null;
    
    const isSelected = selectedState === stateAbbr;
    const isMississippi = stateAbbr === 'MS';

    return (
      <G key={stateAbbr}>
        <Path
          d={location.path}
          fill={isSelected ? '#e63946' : isMississippi ? '#fc565b' : '#e8e8e8'}
          stroke="#fff"
          strokeWidth="3"
          opacity={isMississippi ? 1 : 0.6}
          onPress={() => onStatePress(stateAbbr)}
        />
      </G>
    );
  };

  return (
    <View style={styles.container}>
      <LocationSearch
        placeholder="Search states or cities..."
        onStateSelect={handleStateSelect}
        onCitySelect={handleCitySelect}
        mode="both"
      />
      
      <ScrollView 
        style={styles.mapScrollView}
        contentContainerStyle={styles.mapContainer}
        showsVerticalScrollIndicator={false}
      >
        <Svg 
          width={width * 0.9} 
          height={width * 0.6}
          viewBox={usa.viewBox}
          style={styles.svg}
        >
          <G>
            {usa.locations.map(location => renderState(location))}
          </G>
        </Svg>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#fc565b' }]} />
          <Text style={styles.legendText}>Available Now (Mississippi)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: '#e8e8e8' }]} />
          <Text style={styles.legendText}>Request Integration</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapScrollView: {
    flex: 1,
    marginTop: 15,
  },
  mapContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  svg: {
    backgroundColor: '#fff',
  },
  legend: {
    flexDirection: 'column',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#999',
  },
  legendText: {
    fontSize: width * 0.035,
    color: '#666',
  },
});

export default USAMap;

