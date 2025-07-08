import React, { useRef, useEffect } from 'react';
import {
  PanResponder,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BUTTON_SIZE = 72;
const STORAGE_KEY = 'wa_float_btn_pos';

const WhatsAppFloatButton = () => {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);

  // Default initial position: bottom-right with some margin
  const initialPosition = { x: screenWidth - BUTTON_SIZE - 20, y: screenHeight - BUTTON_SIZE - 100 };

  // WhatsApp URLs and fallback URLs
  const phoneNumber = '27818054237'; // Without plus sign
  const message = 'Hello!';
  const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
  const webUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  const androidIntentUrl = `intent://send?phone=${phoneNumber}&text=${encodeURIComponent(
    message
  )}#Intent;package=com.whatsapp;scheme=whatsapp;end`;

  // Load saved position from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const pos = JSON.parse(saved);
          pan.setValue(pos);
        } else {
          pan.setValue(initialPosition);
        }
      } catch {
        pan.setValue(initialPosition);
      }
    })();
  }, []);

  // Save position helper
  const savePosition = async (pos: { x: number; y: number }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // Ignore errors
    }
  };

  // PanResponder to handle drag gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 }); // Reset delta values
      },
      onPanResponderMove: (evt, gestureState) => {
        // Mark as dragging if movement exceeds threshold
        if (Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5) {
          isDragging.current = true;
        }
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();

        // Clamp position within screen bounds
        let x = Math.min(Math.max(0, pan.x._value), screenWidth - BUTTON_SIZE);
        let y = Math.min(Math.max(0, pan.y._value), screenHeight - BUTTON_SIZE);

        pan.setValue({ x, y });
        savePosition({ x, y });

        // Reset dragging flag shortly after release
        setTimeout(() => {
          isDragging.current = false;
        }, 100);
      },
    })
  ).current;

  // Open WhatsApp app or fallback to web or show alert
  const openWhatsApp = async () => {
    try {
      if (Platform.OS === 'android') {
        await Linking.openURL(androidIntentUrl);
        return true;
      }
      await Linking.openURL(whatsappUrl);
      return true;
    } catch {
      return false;
    }
  };

  const openWebWhatsApp = async () => {
    try {
      await Linking.openURL(webUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handlePress = async () => {
    if (isDragging.current) return; // Ignore press if dragging

    // Animate button press feedback
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (await openWhatsApp()) return;
    if (await openWebWhatsApp()) return;

    Alert.alert(
      'WhatsApp Not Installed',
      Platform.OS === 'ios'
        ? 'Please install WhatsApp from the App Store'
        : 'Please install WhatsApp from Play Store',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Install',
          onPress: () =>
            Linking.openURL(
              Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/whatsapp-messenger/id310633997'
                : 'https://play.google.com/store/apps/details?id=com.whatsapp'
            ),
        },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.floatButton,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.buttonInner} accessible={true} accessibilityLabel="Open WhatsApp chat">
        <Ionicons name="logo-whatsapp" size={45} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  floatButton: {
    position: 'absolute',
    backgroundColor: '#25D366',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
  },
  buttonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WhatsAppFloatButton;
