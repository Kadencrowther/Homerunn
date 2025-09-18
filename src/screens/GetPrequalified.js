import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const GetPrequalified = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [income, setIncome] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async () => {
    // Basic validation
    if (!name || !email || !phone) {
      Alert.alert('Missing Information', 'Please fill out all required fields.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create prequalification request
      const prequalData = {
        UserId: auth.currentUser.uid,
        Name: name,
        Email: email,
        Phone: phone,
        Income: income || 'Not provided',
        Status: 'Requested',
        CreatedAt: serverTimestamp(),
        Notes: 'User requested prequalification through app',
        TextSent: false,
        EmailSent: false,
        LastNotificationSent: null
      };
      
      // Add to Prequalified collection
      await addDoc(collection(db, 'Prequalified'), prequalData);
      
      console.log('Prequalification request sent');
      setRequestSent(true);
      
    } catch (error) {
      console.error('Error sending prequalification request:', error);
      Alert.alert('Error', 'There was a problem submitting your request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Current mortgage rates (these would typically come from an API)
  const mortgageRates = [
    { type: '30-Year Fixed', rate: '6.25%', apr: '6.38%' },
    { type: '15-Year Fixed', rate: '5.50%', apr: '5.65%' },
    { type: 'FHA 30-Year', rate: '6.12%', apr: '6.87%' },
    { type: 'VA 30-Year', rate: '5.75%', apr: '6.12%' }
  ];

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#000" />
      </TouchableOpacity>

      <Text style={styles.title}>Get Prequalified</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fc565b" />
          <Text style={styles.loadingText}>Submitting your request...</Text>
        </View>
      ) : requestSent ? (
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Request Sent!</Text>
          <Text style={styles.successText}>
            Your prequalification request has been submitted. A loan officer will contact you shortly to discuss your options.
          </Text>
          <TouchableOpacity 
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Rates Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Current Mortgage Rates</Text>
            <Text style={styles.cardSubtitle}>Today's best rates</Text>
            
            <View style={styles.ratesContainer}>
              {mortgageRates.map((item, index) => (
                <View key={index} style={styles.rateRow}>
                  <Text style={styles.rateType}>{item.type}</Text>
                  <View style={styles.rateDetails}>
                    <Text style={styles.rateValue}>{item.rate}</Text>
                    <Text style={styles.rateApr}>APR: {item.apr}</Text>
                  </View>
                </View>
              ))}
            </View>
            
            <Text style={styles.rateDisclaimer}>
              *Rates shown are for informational purposes only and are subject to change without notice.
            </Text>
          </View>
          
          {/* Benefits Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Why Get Prequalified?</Text>
            
            <View style={styles.benefitsContainer}>
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <FontAwesome name="check-circle" size={16} color="#fc565b" />
                </View>
                <Text style={styles.benefitText}>Know exactly how much home you can afford</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <FontAwesome name="check-circle" size={16} color="#fc565b" />
                </View>
                <Text style={styles.benefitText}>Strengthen your offer when you find your dream home</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <FontAwesome name="check-circle" size={16} color="#fc565b" />
                </View>
                <Text style={styles.benefitText}>Get personalized rate quotes based on your situation</Text>
              </View>
              
              <View style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                  <FontAwesome name="check-circle" size={16} color="#fc565b" />
                </View>
                <Text style={styles.benefitText}>Work with a dedicated loan officer throughout the process</Text>
              </View>
            </View>
          </View>
          
          {/* Request Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Request Prequalification</Text>
            <Text style={styles.formSubtitle}>
              Fill out the form below and a loan officer will contact you shortly.
            </Text>
            
            <View style={styles.formContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
              />
              
              <Text style={styles.label}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
              
              <Text style={styles.label}>Annual Income (optional)</Text>
              <TextInput
                style={styles.input}
                value={income}
                onChangeText={setIncome}
                placeholder="Enter your annual income"
                keyboardType="numeric"
              />
              
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Get Prequalified</Text>
              </TouchableOpacity>
              
              <Text style={styles.privacyText}>
                By submitting this form, you agree to be contacted by a loan officer. Your information will be kept confidential.
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  backButton: {
    padding: 10,
    marginLeft: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
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
    color: '#333',
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  ratesContainer: {
    marginBottom: 15,
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rateType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  rateDetails: {
    alignItems: 'flex-end',
  },
  rateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fc565b',
  },
  rateApr: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  rateDisclaimer: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 10,
  },
  benefitsContainer: {
    marginTop: 5,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  benefitIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  formContainer: {
    marginTop: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: '#fc565b',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyText: {
    fontSize: 12,
    color: '#999',
    marginTop: 15,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  doneButton: {
    backgroundColor: '#fc565b',
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default GetPrequalified; 