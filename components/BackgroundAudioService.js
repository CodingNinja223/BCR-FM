// app/services/BackgroundAudioService.js

import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

let soundInstance = null;

// Set up audio mode for background playback
export const initializeBackgroundAudio = async () => {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Error setting audio mode:', error);
  }
};

// Start audio playback
export const startBackgroundAudio = async (uri) => {
  try {
    if (soundInstance) {
      await soundInstance.unloadAsync();
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true },
      handlePlaybackStatus
    );

    soundInstance = sound;
    return sound;
  } catch (error) {
    console.error('Error starting background audio:', error);
    return null;
  }
};

// Playback status handler
const handlePlaybackStatus = (status) => {
  if (status.isLoaded) {
    updateNotification(status.isPlaying);
  }
};

// Show notification about playback state
const updateNotification = async (isPlaying) => {
  try {
    await Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'BCR-FM Radio',
        body: isPlaying ? 'Playing now' : 'Paused',
        sound: null,
        priority: Notifications.AndroidNotificationPriority.MAX,
        sticky: true,
        autoDismiss: false,
        color: '#FF0404',
      },
      trigger: null,
    });
  } catch (error) {
    console.error('Notification error:', error);
  }
};

// Get the current audio instance
export const getSoundInstance = () => soundInstance;


export default initializeBackgroundAudio;