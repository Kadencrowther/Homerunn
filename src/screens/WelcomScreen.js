import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions, Animated, Image, Easing, Alert } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const { signInWithApple, continueAsGuest } = useAuth();
  const [gifFinished, setGifFinished] = useState(false);
  const [gifKey, setGifKey] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Create a function for the animation sequence that can be called recursively
    const startAnimationSequence = () => {
      // Reset animation state if needed
      setGifFinished(false);
      // Increment the key to force GIF reload
      setGifKey(prevKey => prevKey + 1);
      
      // Start with a slight delay to ensure proper animation
      setTimeout(() => {
        // Entry animation
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
          easing: Easing.out(Easing.cubic)
        }).start(() => {
          // Simulate the GIF playing time (adjust as needed)
          setTimeout(() => {
            setGifFinished(true);
            
            // Exit animation
            Animated.timing(animatedValue, {
              toValue: 2,
              duration: 1500,
              useNativeDriver: true,
              easing: Easing.in(Easing.cubic)
            }).start(() => {
              // Wait 1.5 seconds after it's gone off screen before restarting
              setTimeout(() => {
                // Reset animation value to start position
                animatedValue.setValue(0);
                // Restart the animation sequence
                startAnimationSequence();
              }, 1000);
            });
          }, 9500); // GIF center time
        });
      }, 300);
    };
    
    // Start the initial animation sequence
    startAnimationSequence();
    
    // Clean up any pending animations on unmount
    return () => {
      animatedValue.stopAnimation();
    };
  }, []);

  // Entry animation (from bottom right to center)
  const entryTranslateX = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [width, 0, -width]
  });
  
  const entryTranslateY = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [height, 0, height]
  });

  const handleEmailSignIn = () => {
    navigation.navigate('AccountCreation');
  };

  const handleAppleSignIn = async () => {
    try {
      // Check if Apple Authentication is available on the device
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Not Available', 'Apple Sign In is not available on this device.');
        return;
      }

      // This will trigger Face ID/Touch ID automatically if enabled
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      // Sign in with Apple credential
      await signInWithApple(credential);
      // Navigation will be handled by App.js based on auth state
      console.log('✅ Apple Sign In complete, App.js will handle navigation');
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // User canceled the sign-in flow
        console.log('Apple sign-in canceled');
      } else {
        console.error('Apple sign-in error:', error);
        Alert.alert('Sign In Error', 'Failed to sign in with Apple. Please try again.');
      }
    }
  };

  const handleGuestContinue = () => {
    continueAsGuest();
    // Navigate directly to the App (HomeScreen will be shown via tab navigator)
    navigation.navigate('App');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.salmonBackground}>
          <Animated.View
            style={[
              styles.gifContainer,
              {
                transform: [
                  { translateX: entryTranslateX },
                  { translateY: entryTranslateY }
                ]
              }
            ]}
          >
            <Image
              source={require('../../assets/realdemovid.gif')}
              style={styles.centerVideo}
              resizeMode="contain"
              key={gifKey}
            />
          </Animated.View>
        </View>
      </View>
      
      {/* Salmon half circle overlay */}
      <View style={styles.halfCircleContainer}>
        <View style={styles.halfCircle} />
      </View>
      
      {/* Salmon bottom section overlay */}
      <View style={styles.bottomSalmonOverlay} />
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Homerunn</Text>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={handleAppleSignIn}
        >
          <View style={styles.appleButtonContent}>
            <Ionicons name="logo-apple" size={width * 0.045} color="#fff" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailSignIn}
        >
          <View style={styles.emailButtonContent}>
            <Ionicons name="mail" size={width * 0.045} color="#fc565b" />
          <Text style={styles.emailButtonText}>Continue with Email</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestContinue}
        >
          <Text style={styles.guestButtonText}>Continue as Guest</Text>
        </TouchableOpacity>

        <Text style={styles.authExplanationText}>
          By continuing, you are accepting all of Homerunn's{' '}
          <Text style={styles.termsLinkTextInline} onPress={() => setIsTermsModalVisible(true)}>
            Terms and Conditions
        </Text>
        </Text>
      </View>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={isTermsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsTermsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.termsText}>
                <Text style={styles.termsSectionTitle}>1. Acceptance of Terms{'\n'}</Text>
                By downloading, installing, or using the Homerunn mobile application ("App"), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use the App.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>2. Service Description{'\n'}</Text>
                Homerunn is a real estate platform that connects users with real estate professionals, including agents, loan officers, and other industry professionals. Our services include property search, agent matching, loan prequalification, and related real estate services.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>3. User Consent and Communication{'\n'}</Text>
                By using the App, you expressly consent to being contacted by real estate professionals, including but not limited to real estate agents, loan officers, mortgage brokers, and other industry professionals who may assist you with your home search and financing needs. This consent includes contact via phone, email, text message, and other communication methods.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>4. Data Security and Privacy{'\n'}</Text>
                Homerunn is committed to protecting your personal information and maintaining the security of your data. We implement industry-standard security measures to safeguard your information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>5. Limitation of Liability{'\n'}</Text>
                Homerunn, its officers, directors, employees, and agents shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the App or any services provided through the App.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>6. Disclaimer of Warranties{'\n'}</Text>
                The App and all services are provided "as is" and "as available" without any warranties of any kind, either express or implied. Homerunn disclaims all warranties, including but not limited to warranties of merchantability, fitness for a particular purpose, and non-infringement.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>7. Third-Party Services{'\n'}</Text>
                The App may integrate with third-party services and platforms. Homerunn is not responsible for the content, privacy policies, or practices of any third-party services. Your interactions with third-party services are at your own risk.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>8. User Responsibilities{'\n'}</Text>
                You are responsible for providing accurate information and maintaining the security of your account. You agree not to use the App for any unlawful purpose or in any way that could damage, disable, or impair the App.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>9. Modifications to Terms{'\n'}</Text>
                Homerunn reserves the right to modify these Terms of Use at any time. We will notify users of any material changes through the App or via email. Your continued use of the App after such modifications constitutes acceptance of the updated terms.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>10. Governing Law{'\n'}</Text>
                These Terms of Use shall be governed by and construed in accordance with the laws of the jurisdiction in which Homerunn operates, without regard to conflict of law principles.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>11. Contact Information{'\n'}</Text>
                If you have any questions about these Terms of Use, please contact us through the App's support features or at our designated support channels.
                {'\n\n'}
                
                <Text style={styles.termsSectionTitle}>Thank You{'\n'}</Text>
                Thank you for trusting Homerunn with your real estate journey. We are committed to providing you with a secure, reliable, and valuable platform to help you find your perfect home and connect with trusted real estate professionals.
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsTermsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative', 
    zIndex: 20, // Ensure container has highest z-index
  },
  contentContainer: {
    position: 'absolute',
    bottom: height * 0.04,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: width * 0.05,
    paddingBottom: height * 0.01,
    zIndex: 20,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: '600',
    marginBottom: height * 0.03,
    color: '#fff',
    zIndex: 20,
  },
  authExplanationText: {
    fontSize: width * 0.028,
    color: '#fff',
    textAlign: 'center',
    marginTop: height * 0.015,
    marginBottom: height * 0.01,
    paddingHorizontal: width * 0.05,
    lineHeight: 16,
    zIndex: 20,
  },
  termsLinkTextInline: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: height * 0.01,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.012,
    width: width * 0.75,
    borderWidth: 0,
    zIndex: 20,
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.01,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.012,
    width: width * 0.75,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 20,
  },
  guestButton: {
    backgroundColor: 'transparent',
    paddingVertical: height * 0.01,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.015,
    width: width * 0.75,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 20,
  },
  buttonText: {
    color: '#fc565b',
    fontWeight: '500',
    fontSize: width * 0.035,
    marginLeft: width * 0.02,
  },
  appleButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.035,
    marginLeft: width * 0.02,
  },
  emailButtonText: {
    color: '#fc565b',
    fontWeight: '500',
    fontSize: width * 0.035,
    marginLeft: width * 0.02,
  },
  guestButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.035,
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    marginTop: 10,
    lineHeight: 20,
  },
  welcomeTermsText: {
    marginTop: height * 0.01,
    fontSize: width * 0.03,
    textAlign: 'center',
    color: '#fff',
    marginBottom: height * 0.01,
    zIndex: 20,
    lineHeight: 18,
  },
  termsLinkText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    fontSize: width * 0.03,
    textAlign: 'center',
    marginTop: height * 0.002,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: width * 0.03,
    padding: width * 0.05,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: '600',
    marginBottom: height * 0.02,
    color: '#333',
  },
  modalBody: {
    maxHeight: height * 0.4,
    marginBottom: height * 0.025,
  },
  closeButton: {
    alignSelf: 'center',
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.015,
    borderRadius: width * 0.02,
    width: width * 0.45,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
    fontSize: width * 0.04,
  },
  topSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    zIndex: 1,
  },
  salmonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: height * 0.04,
    backgroundColor: '#fcfcfc',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  halfCircleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    zIndex: 15, // Increased to ensure it's above the GIF
    pointerEvents: 'none',
  },
  halfCircle: {
    position: 'absolute',
    bottom: -height * 0.08,
    width: '100%',
    height: height * 0.12,
    backgroundColor: '#fc565b',
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    transform: [{ scaleX: 1.1 }],
  },
  bottomSalmonOverlay: {
    position: 'absolute',
    bottom: -height * 0.4,
    left: 0,
    right: 0,
    height: height * 0.68,
    backgroundColor: '#fc565b',
    zIndex: 12,
  },
  gifContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  centerVideo: {
    width: width,
    height: width,
    borderRadius: width * 0.03,
  },
  termsSectionTitle: {
    fontWeight: 'bold',
    fontSize: width * 0.04,
    marginBottom: height * 0.005,
  },
});

export default WelcomeScreen;
