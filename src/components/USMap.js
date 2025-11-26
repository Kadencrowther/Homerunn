import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Dimensions, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { allStates, getAvailableStatesList } from '../data/statesData';

const { width } = Dimensions.get('window');

const StateSelector = ({ selectedState, onStatePress }) => {
  const sortedStates = Object.values(allStates).sort((a, b) => {
    if (a.available && !b.available) return -1;
    if (!a.available && b.available) return 1;
    return a.name.localeCompare(b.name);
  });

  const renderState = ({ item }) => {
    const isAvailable = item.available;
    const isSelected = selectedState === item.abbr;

    return (
      <TouchableOpacity
        style={[
          styles.stateButton,
          isAvailable && styles.availableState,
          isSelected && styles.selectedState,
          !isAvailable && styles.unavailableState
        ]}
        onPress={() => isAvailable && onStatePress(item.abbr)}
        disabled={!isAvailable}
      >
        <View style={styles.stateContent}>
          <Text style={[
            styles.stateName,
            isSelected && styles.selectedStateText,
            !isAvailable && styles.unavailableStateText
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.stateAbbr,
            isSelected && styles.selectedStateText,
            !isAvailable && styles.unavailableStateText
          ]}>
            {item.abbr}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        )}
        {!isAvailable && (
          <Text style={styles.comingSoonText}>Coming Soon</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Your State</Text>
        <Text style={styles.subtitle}>
          Choose from our available states
        </Text>
      </View>

      <FlatList
        data={sortedStates}
        renderItem={renderState}
        keyExtractor={(item) => item.abbr}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#fc565b' }]} />
          <Text style={styles.legendText}>Available Now</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#e8e8e8' }]} />
          <Text style={styles.legendText}>Coming Soon</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: width * 0.065,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: width * 0.038,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  stateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  availableState: {
    backgroundColor: '#fc565b',
    borderColor: '#fc565b',
  },
  selectedState: {
    backgroundColor: '#e63946',
    borderColor: '#e63946',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unavailableState: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e8e8e8',
    opacity: 0.6,
  },
  stateContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stateName: {
    fontSize: width * 0.042,
    fontWeight: '500',
    color: '#fff',
    flex: 1,
  },
  stateAbbr: {
    fontSize: width * 0.038,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  selectedStateText: {
    color: '#fff',
    fontWeight: '600',
  },
  unavailableStateText: {
    color: '#999',
  },
  comingSoonText: {
    fontSize: width * 0.032,
    color: '#999',
    fontStyle: 'italic',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 25,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: width * 0.035,
    color: '#666',
  },
});

export default StateSelector;

