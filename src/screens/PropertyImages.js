import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Modal,
} from 'react-native';

const PropertyImages = ({ route, navigation }) => {
  const { property } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagePress = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {property.images.map((image, index) => (
          <TouchableOpacity key={index} onPress={() => handleImagePress(image)}>
            <View style={styles.imageContainer}>
              <Image
                source={image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        ))}
        {/* Add extra padding at bottom for button */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Static Property Details Button */}
      <TouchableOpacity 
        style={styles.detailsButton}
        onPress={() => navigation.navigate('PropertyDetails', { property })}
      >
        <Text style={styles.buttonText}>Property Details</Text>
      </TouchableOpacity>

      {/* Modal for full-screen image */}
      <Modal
        visible={modalVisible}
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>
          <Image source={selectedImage} style={styles.fullImage} resizeMode="contain" />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height / 3, // Adjust height for better fit
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0, // No margin for separation
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#fc565b',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default PropertyImages;