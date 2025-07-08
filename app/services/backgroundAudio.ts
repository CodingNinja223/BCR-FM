import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const setupAudioService = async () => {
  try {
    // Request permissions
    await Audio.requestPermissionsAsync();
    await Notifications.requestPermissionsAsync();

    // Configure audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Audio service setup error:', error);
  }
};

export const cleanupAudioService = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Audio.setAudioModeAsync({
      staysActiveInBackground: false,
    });
  } catch (error) {
    console.error('Audio service cleanup error:', error);
  }
};