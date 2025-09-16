import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SavedFilterModal = ({ visible, onClose, onApply, onClear, currentFilters }) => {
  const [localFilters, setLocalFilters] = React.useState({
    onlyLoved: currentFilters.onlyLoved || false
  });

  React.useEffect(() => {
    setLocalFilters({
      onlyLoved: currentFilters.onlyLoved || false
    });
  }, [currentFilters, visible]);

  const handleToggleLoved = (value) => {
    setLocalFilters(prev => ({
      ...prev,
      onlyLoved: value
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Show Only</Text>
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Loved Properties</Text>
              <Switch
                value={localFilters.onlyLoved}
                onValueChange={handleToggleLoved}
                trackColor={{ false: "#ccc", true: "#fc565b" }}
                thumbColor="#fff"
              />
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={onClear}
            >
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={handleApply}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  toggleLabel: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#333',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#fc565b',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default SavedFilterModal; 