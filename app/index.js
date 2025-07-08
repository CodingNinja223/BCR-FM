import React, { useState, useEffect } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Updates from 'expo-updates';
import CustomSplashScreen from './CustomSplashScreen'; // import your splash screen component

export default function Index() {
  const router = useRouter();
  const [showSplash, setShowSplash] = useState(true);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      checkAndHandleUpdate();
    }
  }, [showSplash]);

  const checkAndHandleUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          'New Update Available',
          'A new version of the app is available. Would you like to update now?',
          [
            { text: 'Later', style: 'cancel', onPress: () => redirectToLive() },
            {
              text: 'Update',
              onPress: async () => {
                await Updates.fetchUpdateAsync();
                await Updates.reloadAsync();
              },
            },
          ]
        );
      } else {
        redirectToLive();
      }
    } catch (e) {
      console.warn('Update check failed:', e);
      redirectToLive();
    } finally {
      setCheckingUpdate(false);
    }
  };

  const redirectToLive = () => {
    setTimeout(() => {
      router.replace('/(tabs)/live'); // adjust path if needed
    }, 0);
  };

  if (showSplash) {
    // Show custom splash screen first
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (checkingUpdate) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Checking for updates...</Text>
      </View>
    );
  }

  // While update check runs, show nothing (or you can add a loader)
  return null;
}
