import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const FlashScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* Home Value Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Home Value</Text>
        <Text style={styles.homeValue}>$638,100</Text>
        <Text style={styles.homeDetails}>4 Bed 3 Bath 3,309 Sq Feet</Text>
        <Text style={styles.homeDetails}>2088E 230th Spanish Fork Utah 84660</Text>
        <Image source={{ uri: 'https://via.placeholder.com/100' }} style={styles.homeImage} />
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GetCashOffer')}>
          <Text style={styles.buttonText}>Get a cash offer in minutes</Text>
        </TouchableOpacity>
      </View>

      {/* Agent Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Agent</Text>
        <Text style={styles.cardText}>Connect with a market friendly real estate agent to guide you through the process of finding your dream home!</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FindAnAgent')}>
          <Text style={styles.buttonText}>Find an Agent near you</Text>
        </TouchableOpacity>
      </View>

      {/* Loan Team Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Loan Team</Text>
        <Text style={styles.cardText}>Purchase your dream home today with only 3.5% down with a Homerunn trusted loan officer</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('GetPrequalified')}>
          <Text style={styles.buttonText}>Get requalified today</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  homeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fc565b',
    marginBottom: 8,
  },
  homeDetails: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  homeImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#fc565b',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default FlashScreen;
