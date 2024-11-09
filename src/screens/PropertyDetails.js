import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { formatPrice } from '../utils/formatters';

const PropertyDetails = ({ route }) => {
  const { property } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.price}>{formatPrice(property.price)}</Text>
        <Text style={styles.details}>{property.details}</Text>
        <Text style={styles.address}>{property.address}</Text>
        {/* Add more property details as needed */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  details: {
    fontSize: 18,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    color: '#666',
  },
});

export default PropertyDetails; 