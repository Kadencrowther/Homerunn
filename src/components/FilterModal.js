import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';

const FilterModal = ({ visible, onClose, onApply, onClear, currentFilters }) => {
  const [filters, setFilters] = useState(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters]);

  const toggleBedSelection = (num) => {
    setFilters(prev => ({
      ...prev,
      beds: prev.beds && prev.beds.includes(num)
        ? prev.beds.filter(b => b !== num) // Remove if already selected
        : [...(prev.beds || []), num]      // Add if not selected
    }));
  };

  const toggleBathSelection = (num) => {
    setFilters(prev => ({
      ...prev,
      baths: prev.baths && prev.baths.includes(num)
        ? prev.baths.filter(b => b !== num) // Remove if already selected
        : [...(prev.baths || []), num]      // Add if not selected
    }));
  };

  const toggleLovedFilter = () => {
    setFilters(prev => ({
      ...prev,
      onlyLoved: !prev.onlyLoved
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleClear = () => {
    const clearedFilters = {
      ...filters,
      beds: [],
      baths: [],
      priceRange: { min: 0, max: 2000000 },
      sqft: { min: 0, max: 10000 }
    };
    setFilters(clearedFilters);
    onClear();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Filters</Text>
          
          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                style={styles.input}
                placeholder="Min"
                keyboardType="numeric"
                value={filters.priceRange.min.toString()}
                onChangeText={(text) => setFilters(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, min: parseInt(text) || 0 }
                }))}
              />
              <Text> - </Text>
              <TextInput
                style={styles.input}
                placeholder="Max"
                keyboardType="numeric"
                value={filters.priceRange.max.toString()}
                onChangeText={(text) => setFilters(prev => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, max: parseInt(text) || 0 }
                }))}
              />
            </View>
          </View>

          {/* Beds */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Bedrooms</Text>
            <View style={styles.buttonGroup}>
              {[1, 2, 3, 4, '5+'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.filterButton,
                    filters.beds?.includes(num) && styles.filterButtonActive
                  ]}
                  onPress={() => toggleBedSelection(num)}
                >
                  <Text style={filters.beds?.includes(num) ? styles.filterButtonTextActive : styles.filterButtonText}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Baths */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Bathrooms</Text>
            <View style={styles.buttonGroup}>
              {[1, 2, 3, 4, '5+'].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.filterButton,
                    filters.baths?.includes(num) && styles.filterButtonActive
                  ]}
                  onPress={() => toggleBathSelection(num)}
                >
                  <Text style={filters.baths?.includes(num) ? styles.filterButtonTextActive : styles.filterButtonText}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Square Feet */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Square Feet</Text>
            <View style={styles.rangeInputs}>
              <TextInput
                style={styles.input}
                placeholder="Min"
                keyboardType="numeric"
                value={filters.sqft.min.toString()}
                onChangeText={(text) => setFilters(prev => ({
                  ...prev,
                  sqft: { ...prev.sqft, min: parseInt(text) || 0 }
                }))}
              />
              <Text> - </Text>
              <TextInput
                style={styles.input}
                placeholder="Max"
                keyboardType="numeric"
                value={filters.sqft.max.toString()}
                onChangeText={(text) => setFilters(prev => ({
                  ...prev,
                  sqft: { ...prev.sqft, max: parseInt(text) || 0 }
                }))}
              />
            </View>
          </View>

          {/* Loved Properties Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Show Only Loved Properties</Text>
            <Switch
              value={filters.onlyLoved}
              onValueChange={toggleLovedFilter}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Text style={styles.buttonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#fc565b',
    borderColor: '#fc565b',
  },
  filterButtonText: {
    color: '#333',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#666',
    borderRadius: 8,
    marginRight: 10,
  },
  clearButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#999',
    borderRadius: 8,
    marginRight: 10,
  },
  applyButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fc565b',
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default FilterModal; 