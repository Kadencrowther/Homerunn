import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Easing } from 'react-native';

const ScheduleModal = ({ visible, onClose, property, onSubmit }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [agentInfo, setAgentInfo] = useState(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;
  
  // Generate time slots from 8am to 8pm
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    const hour = i + 8; // Start at 8am
    return {
      id: hour,
      time: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`
    };
  });
  
  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // Format date as YYYY-MM-DD
  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Check if date is today
  const isToday = (year, month, day) => {
    const today = new Date();
    return year === today.getFullYear() && 
           month === today.getMonth() && 
           day === today.getDate();
  };
  
  // Check if date is selectable (not in the past)
  const isSelectable = (year, month, day) => {
    const date = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };
  
  // Generate calendar for current month
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(year, month, day);
      const isSelected = dateString === selectedDate;
      const dayIsToday = isToday(year, month, day);
      const dayIsSelectable = isSelectable(year, month, day);
      
      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.calendarDay,
            dayIsToday && styles.todayDay,
            isSelected && styles.selectedDay,
            !dayIsSelectable && styles.disabledDay
          ]}
          onPress={() => dayIsSelectable && setSelectedDate(dateString)}
          disabled={!dayIsSelectable}
        >
          <Text style={[
            styles.calendarDayText,
            dayIsToday && styles.todayDayText,
            isSelected && styles.selectedDayText,
            !dayIsSelectable && styles.disabledDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return days;
  };
  
  // Get month name
  const getMonthName = (month) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month];
  };
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    
    // Don't allow going to past months
    const today = new Date();
    if (newMonth.getFullYear() < today.getFullYear() || 
        (newMonth.getFullYear() === today.getFullYear() && 
         newMonth.getMonth() < today.getMonth())) {
      return;
    }
    
    setCurrentMonth(newMonth);
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    
    // Limit to 3 months in the future
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    if (newMonth <= maxDate) {
      setCurrentMonth(newMonth);
    }
  };
  
  useEffect(() => {
    if (visible && property) {
      fetchAgentInfo();
    }
  }, [visible, property]);
  
  useEffect(() => {
    if (confirmationVisible) {
      // Reset animation values
      checkmarkScale.setValue(0);
      checkmarkOpacity.setValue(0);
      
      // Create animation sequence
      Animated.sequence([
        // Fade in
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Scale up with a bounce effect
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 4, // Lower friction for more bounce
          tension: 40, // Adjust tension for animation speed
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [confirmationVisible]);
  
  const fetchAgentInfo = async () => {
    try {
      setIsLoadingAgent(true);
      
      // Log the property data we received to debug
      console.log('Property data in ScheduleModal:', {
        address: property.address,
        listAgentName: property.listAgentName,
        listAgentPhone: property.listAgentPhone,
        listAgentEmail: property.listAgentEmail,
        zipCode: property.PostalCode || property.zipCode
      });
      
      // Extract zip code from property data or address
      let zipCode = property.PostalCode || property.zipCode;
      
      // If no zip code in property data, try to extract from address
      if (!zipCode) {
        const address = property.address || '';
        const zipCodeMatch = address.match(/\b\d{5}(?:-\d{4})?\b/);
        zipCode = zipCodeMatch ? zipCodeMatch[0] : null;
      }
      
      console.log('Looking for agent with zip code:', zipCode);
      
      if (zipCode) {
        // First try to find agents with ZipCodes array that includes this zip code
        const agentUsersRef = collection(db, 'AgentUsers');
        let querySnapshot = await getDocs(agentUsersRef);
        
        // Filter agents manually to check if zipCode is in their ZipCodes array
        let matchingAgents = querySnapshot.docs.filter(doc => {
          const data = doc.data();
          // Check if ZipCodes is an array and includes the property's zip code
          return data.ZipCodes && 
                 Array.isArray(data.ZipCodes) && 
                 data.ZipCodes.includes(zipCode);
        });
        
        // If no matches found with ZipCodes array, try the single ZipCode field
        if (matchingAgents.length === 0) {
          const q = query(agentUsersRef, where('ZipCode', '==', zipCode));
          querySnapshot = await getDocs(q);
          matchingAgents = querySnapshot.docs;
        }
        
        if (matchingAgents.length > 0) {
          // Found an agent for this zip code
          const agentDoc = matchingAgents[0];
          const agentData = agentDoc.data();
          console.log('Found agent for zip code:', agentData);
          
          setAgentInfo({
            id: agentDoc.id,
            name: `${agentData.FirstName || ''} ${agentData.LastName || ''}`.trim(),
            email: agentData.Email || '',
            phone: agentData.Phone || '',
            source: 'AgentUsers'
          });
        } else {
          // No agent found for this zip code, use listing agent info
          console.log('No agent found for zip code, using listing agent info:', {
            name: property.listAgentName,
            email: property.listAgentEmail,
            phone: property.listAgentPhone
          });
          
          setAgentInfo({
            id: null,
            name: property.listAgentName !== '-' ? property.listAgentName : 'Listing Agent',
            email: property.listAgentEmail !== '-' ? property.listAgentEmail : '',
            phone: property.listAgentPhone !== '-' ? property.listAgentPhone : '',
            source: 'ListingAgent'
          });
        }
      } else {
        // No zip code found, use listing agent info
        console.log('No zip code found, using listing agent info');
        
        setAgentInfo({
          id: null,
          name: property.listAgentName !== '-' ? property.listAgentName : 'Listing Agent',
          email: property.listAgentEmail !== '-' ? property.listAgentEmail : '',
          phone: property.listAgentPhone !== '-' ? property.listAgentPhone : '',
          source: 'ListingAgent'
        });
      }
    } catch (error) {
      console.error('Error fetching agent info:', error);
      
      // Fallback to listing agent info
      setAgentInfo({
        id: null,
        name: property.listAgentName !== '-' ? property.listAgentName : 'Listing Agent',
        email: property.listAgentEmail !== '-' ? property.listAgentEmail : '',
        phone: property.listAgentPhone !== '-' ? property.listAgentPhone : '',
        source: 'ListingAgent'
      });
    } finally {
      setIsLoadingAgent(false);
    }
  };
  
  // Add this function to format the date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  const handleSubmit = async () => {
    if (!selectedDate || selectedTime === null) {
      Alert.alert('Please select both a date and time');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // ... existing code to submit the request ...
      
      // Show the confirmation modal with the details
      setConfirmationMessage({
        address: property.address,
        date: formatDateForDisplay(selectedDate),
        time: timeSlots.find(slot => slot.id === selectedTime)?.time || '',
        agentName: agentInfo?.name || property.listAgentName || 'the listing agent'
      });
      
      setConfirmationVisible(true);
    } catch (error) {
      console.error('Error submitting showing request:', error);
      Alert.alert('Error', 'Failed to submit your request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { maxWidth: 600, maxHeight: '95%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule a Showing</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalBody}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.propertyAddress}>{property?.address}</Text>
            
            {/* Agent Information Section */}
            <View style={styles.agentInfoContainer}>
              {isLoadingAgent ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fc565b" />
                  <Text style={styles.loadingText}>Finding the best agent for you...</Text>
                </View>
              ) : agentInfo ? (
                <View style={styles.agentDetails}>
                  <Text style={styles.agentName}>{agentInfo.name}</Text>
                  {agentInfo.phone && (
                    <View style={styles.agentContactItem}>
                      <Ionicons name="call-outline" size={16} color="#666" />
                      <Text style={styles.agentContact}>{agentInfo.phone}</Text>
                    </View>
                  )}
                  {agentInfo.email && (
                    <View style={styles.agentContactItem}>
                      <Ionicons name="mail-outline" size={16} color="#666" />
                      <Text style={styles.agentContact}>{agentInfo.email}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.noAgentText}>Agent information unavailable</Text>
              )}
            </View>
            
            {/* Date Selection */}
            <Text style={styles.sectionTitle}>Select Date</Text>
            <View style={styles.dateContainer}>
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={goToPreviousMonth}>
                    <Ionicons name="chevron-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthText}>
                    {getMonthName(currentMonth.getMonth())} {currentMonth.getFullYear()}
                  </Text>
                  <TouchableOpacity onPress={goToNextMonth}>
                    <Ionicons name="chevron-forward" size={24} color="#333" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.calendarDaysOfWeek}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <Text key={day} style={styles.calendarDayOfWeekText}>{day}</Text>
                  ))}
                </View>
                
                <View style={styles.calendarGrid}>
                  {generateCalendar()}
                </View>
              </View>
            </View>
            
            {/* Time Selection */}
            <Text style={styles.sectionTitle}>Select time you would most prefer</Text>
            <View style={styles.timeContainer}>
              {timeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    selectedTime === slot.id && styles.selectedTimeSlot
                  ]}
                  onPress={() => setSelectedTime(slot.id)}
                >
                  <Text 
                    style={[
                      styles.timeSlotText,
                      selectedTime === slot.id && styles.selectedTimeSlotText
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes or questions for the agent..."
              multiline
              value={notes}
              onChangeText={setNotes}
            />
            
            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.modalButton, styles.submitButton]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, styles.submitText]}>Request Showing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
      
      {/* Confirmation Modal */}
      <Modal
        visible={confirmationVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.confirmationContainer}>
          <View style={[styles.confirmationContent, { maxWidth: 400 }]}>
            <View style={styles.successIconContainer}>
              <Animated.View style={{
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkOpacity,
              }}>
                <Ionicons name="checkmark-circle" size={70} color="#4CAF50" />
              </Animated.View>
            </View>
            <Text style={styles.confirmationTitle}>Request Sent</Text>
            <Text style={styles.confirmationText}>
              Your showing request for {confirmationMessage.address} on {confirmationMessage.date} at {confirmationMessage.time} has been sent to {confirmationMessage.agentName}. They will follow up with you shortly to confirm your appointment!
            </Text>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={() => {
                setConfirmationVisible(false);
                onClose();
              }}
            >
              <Text style={styles.confirmButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  propertyAddress: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  agentInfoContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 10,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  agentDetails: {
    marginTop: 10,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  agentContactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  agentContact: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  noAgentText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 5,
  },
  dateContainer: {
    marginBottom: 20,
  },
  calendarContainer: {
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 15,
    padding: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarDaysOfWeek: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  calendarDayOfWeekText: {
    flex: 1,
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  todayDay: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  todayDayText: {
    color: '#fc565b',
    fontWeight: 'bold',
  },
  selectedDay: {
    backgroundColor: '#fc565b',
    borderRadius: 20,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#999',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  timeSlot: {
    width: '31%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    marginBottom: 10,
  },
  selectedTimeSlot: {
    backgroundColor: '#fc565b',
  },
  timeSlotText: {
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#fff',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#fc565b',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#fc565b',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmationContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmationContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  confirmButton: {
    backgroundColor: '#fc565b',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScheduleModal; 