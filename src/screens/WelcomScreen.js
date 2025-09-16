import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Dimensions, Animated, Image, Easing, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest, ResponseType } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../context/AuthContext';
import { AntDesign } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import realdemovid from '../../assets/realdemovid.gif';

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
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [gifFinished, setGifFinished] = useState(false);
  const [gifKey, setGifKey] = useState(0);
  const [authError, setAuthError] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useAuthRequest({
    // Complete client IDs from Google Cloud Console
    expoClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    iosClientId: '1006467951298-2bjn4fe86g9iicshs130a0qjhdjao72a.apps.googleusercontent.com',
    androidClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    webClientId: '1006467951298-jkv87koms7i4od5jk3r49j53huvphqk9.apps.googleusercontent.com',
    responseType: ResponseType.IdToken,
    scopes: ['profile', 'email'],
    redirectUri: makeRedirectUri({ useProxy: true }),
    useProxy: true,
  });

  // Add this to see the actual redirect URI that will be used
  useEffect(() => {
    console.log("Redirect URI for Google Auth:", makeRedirectUri({ useProxy: true }));
    console.log("Expo Auth Redirect URI to add to Google Console:", 
                "https://auth.expo.io/@kadencrowther/homerunn");
  }, []);

  React.useEffect(() => {
    if (response?.type === 'success') {
      console.log("Google auth success response:", response);
      const { id_token } = response.params;
      
      if (!id_token) {
        console.error("No ID token received from Google");
        setAuthError("Authentication failed: No ID token received");
        return;
      }
      
      signInWithGoogle(id_token)
        .then(() => {
          navigation.navigate('UserInfo');
        })
        .catch((error) => {
          console.error('Google sign-in error:', error);
          setAuthError(error.message || "Authentication failed");
        });
    } else if (response?.type === 'error') {
      console.error("Google auth error:", response.error);
      setAuthError(response.error?.message || "Authentication failed");
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

  const handleAppleSignIn = async () => {
    try {
      setAuthError(null);
      // First check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        // Authenticate with biometrics first
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to continue with Apple',
          fallbackLabel: 'Use passcode',
        });

        if (!result.success) {
          console.log('Biometric authentication failed or was cancelled');
          setAuthError("Biometric authentication failed");
          return;
        }
      }

      // Proceed with Apple Sign In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await signInWithApple(credential.identityToken, credential.nonce);
        navigation.navigate('UserInfo');
      } else {
        setAuthError("No identity token received from Apple");
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        console.log('User cancelled Apple sign in');
      } else {
        console.error('Apple sign-in error:', error);
        setAuthError(error.message || "Authentication failed");
      }
    }
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
              source={realdemovid}
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

        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          >
            <View style={styles.appleButtonContent}>
              <AntDesign name="apple1" size={width * 0.05} color="#000" />
              <Text style={styles.appleButtonText}>Continue with Apple</Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailSignIn}
        >
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you are accepting all of Homerunn's
          <Text style={styles.linkText} onPress={() => setIsTermsModalVisible(true)}> Terms and Conditions</Text>.
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
              <Text>
                {/* Placeholder for actual Terms and Conditions text */}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla convallis pulvinar vestibulum.
                Aenean vehicula mi nec nisl fermentum, ut gravida urna venenatis.
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
    backgroundColor: '#fc565b',
    position: 'relative', 
    zIndex: 20,
  },
  contentContainer: {
    position: 'absolute',
    bottom: height * 0.06,
    left: 0,
    right: 0,
    alignItems: 'center',
    padding: width * 0.05,
    paddingBottom: height * 0.01,
    zIndex: 25,
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
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.02,
    width: width * 0.85,
    borderWidth: 0,
    zIndex: 20,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButton: {
    backgroundColor: '#fc565b',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.02,
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
  emailButtonText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: width * 0.04,
  },
  termsText: {
    marginTop: height * 0.01,
    fontSize: width * 0.035,
    textAlign: 'center',
    color: '#fff',
    marginBottom: height * 0.01,
    zIndex: 20,
  },
  linkText: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
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
    zIndex: 15,
    pointerEvents: 'none',
  },
  halfCircle: {
    position: 'absolute',
    bottom: -69,
    width: '100%',
    height: height * 0.18,
    backgroundColor: '#fc565b',
    borderTopLeftRadius: width * 0.5,
    borderTopRightRadius: width * 0.5,
    transform: [{ scaleX: 1.2 }],
  },
  bottomSalmonOverlay: {
    position: 'absolute',
    bottom: -450,
    left: 0,
    right: 0,
    height: height * 0.8,
    backgroundColor: '#fc565b',
    zIndex: 15,
  },
  gifContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  centerVideo: {
    width: width,
    height: width,
    borderRadius: width * 0.03,
  },
  appleButton: {
    backgroundColor: '#fff',
    paddingVertical: height * 0.016,
    borderRadius: width * 0.02,
    alignItems: 'center',
    marginBottom: height * 0.02,
    width: width * 0.85,
    borderWidth: 0,
    zIndex: 20,
  },
  appleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleButtonText: {
    color: '#000',
    fontWeight: '500',
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
  },
});

export default WelcomeScreen;
