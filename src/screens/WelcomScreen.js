import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions, Animated, Image, Easing } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../context/AuthContext';
import { AntDesign } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

// Google Logo Component with the official colors
const GoogleLogo = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {/* Blue */}
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      {/* Green */}
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      {/* Yellow */}
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      {/* Red */}
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
};

const WelcomeScreen = ({ navigation }) => {
  const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);
  const { signInWithGoogle } = useAuth();
  const [gifFinished, setGifFinished] = useState(false);
  const [gifKey, setGifKey] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Complete client IDs from Google Cloud Console
    expoClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    iosClientId: '1006467951298-2bjn4fe86g9iicshs130a0qjhdjao72a.apps.googleusercontent.com',
    androidClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    webClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    responseType: ResponseType.IdToken,
    scopes: ['profile', 'email'],
    // Explicitly set redirect URI to match what's registered in Google Cloud Console
    redirectUri: makeRedirectUri({
      native: 'homerunn://',
      useProxy: true,
    }),
    useProxy: true,
  });

  // Add this to see the actual redirect URI that will be used
  useEffect(() => {
    console.log("Redirect URI for Google Auth:", makeRedirectUri({
      native: 'homerunn://',
      useProxy: true
    }));
    console.log("Expo Auth Redirect URI to add to Google Console:", 
                "https://auth.expo.io/@kadencrowther/homerunn");
  }, []);

  React.useEffect(() => {
    if (response?.type === 'success') {
      console.log("Google auth success response:", response);
      const { id_token } = response.params;
      
      if (!id_token) {
        console.error("No ID token received from Google");
        return;
      }
      
      signInWithGoogle(id_token)
        .then(() => {
          navigation.navigate('UserInfo');
        })
        .catch((error) => {
          console.error('Google sign-in error:', error);
        });
    } else if (response?.type === 'error') {
      console.error("Google auth error:", response.error);
    }
  }, [response]);

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
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <View style={styles.googleButtonContent}>
            <GoogleLogo size={width * 0.05} />
            <Text style={styles.buttonText}>Continue with Google</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.appleButton}
          onPress={() => {
            // Apple Sign In logic here
            console.log('Apple Sign In pressed');
          }}
        >
          <View style={styles.appleButtonContent}>
            <Ionicons name="logo-apple" size={width * 0.05} color="#fff" />
            <Text style={styles.appleButtonText}>Continue with Apple</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailSignIn}
        >
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </TouchableOpacity>

        <Text style={styles.welcomeTermsText}>
          By continuing, you are accepting all of Homerunn's
        </Text>
        <Text style={styles.termsLinkText} onPress={() => setIsTermsModalVisible(true)}>
          Terms and Conditions
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
  googleButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.012,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.015,
    width: width * 0.85,
    borderWidth: 0,
    zIndex: 20,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButton: {
    backgroundColor: '#000',
    paddingVertical: height * 0.012,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.015,
    width: width * 0.85,
    borderWidth: 0,
    zIndex: 20,
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.012,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.015,
    width: width * 0.85,
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 20,
  },
  buttonText: {
    color: '#fc565b',
    fontWeight: '500',
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
  },
  appleButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
  },
  emailButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
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
