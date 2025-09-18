import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const PersonalPreferencesScreen = ({ navigation, route }) => {
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const credentials = route.params?.credentials || {};

  const preferences = [
    'Beautiful View',
    'New Build',
    'Low Price',
    'Safe Area',
    'New Appliances',
    'Investment',
    'Multi-Family',
    'Good Schools',
    'Pool',
    'Large Yard',
    'Open Plan',
    'Smart Home',
    'Energy Efficient',
    'Garage',
    'Basement',
    'High Ceiling',
    'Fireplace',
    'Quiet Street',
    'Near Parks',
    'Modern',
    'Traditional',
    'Luxury',
    'Fixer Upper',
    'Waterfront',
    'Mountain View',
    'City View',
    'Gated',
    'Corner Lot',
    'Cul-de-sac',
    'No HOA',
    'RV Parking',
    'Workshop',
    'Home Office',
    'Guest House',
    'Solar Ready',
    'Garden',
    'Privacy',
    'Near Transit',
    'Near Shopping'
  ];

  const togglePreference = (preference) => {
    if (selectedPreferences.includes(preference)) {
      setSelectedPreferences(selectedPreferences.filter(item => item !== preference));
    } else if (selectedPreferences.length < 5) {
      setSelectedPreferences([...selectedPreferences, preference]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What matters most to you?</Text>
      <Text style={styles.subtitle}>Select up to 5 preferences</Text>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.preferencesGrid}>
          {preferences.map((preference) => (
            <TouchableOpacity
              key={preference}
              style={[
                styles.preferenceButton,
                selectedPreferences.includes(preference) && styles.selectedButton
              ]}
              onPress={() => togglePreference(preference)}
            >
              <Text style={[
                styles.preferenceText,
                selectedPreferences.includes(preference) && styles.selectedText
              ]}>
                {preference}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedPreferences.length === 0 && styles.disabledButton
          ]}
          onPress={() => navigation.navigate('ProfileCompletion', {
            credentials: route.params.credentials,
            preferences: selectedPreferences
          })}
          disabled={selectedPreferences.length === 0}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.navigate('ProfileCompletion', {
            credentials: route.params.credentials,
            preferences: []
          })}
        >
          <Text style={styles.skipButtonText}>Skip this step</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9F9F9',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  preferencesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  preferenceButton: {
    width: '48%', // Two items per row with small gap
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  preferenceText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
  },
  bottomContainer: {
    paddingVertical: 16,
  },
  continueButton: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#b0c4de',
  },
  continueButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: '#007bff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default PersonalPreferencesScreen;
