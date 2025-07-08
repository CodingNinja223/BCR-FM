import { useEffect } from 'react';
import { Audio } from 'expo-av';
import { getSoundInstance } from './(tabs)/BackgroundAudioService';



export const useMediaControls = (setIsPlaying) => {
  useEffect(() => {
    const handleMediaButton = async () => {
      const sound = getSoundInstance();
      if (!sound) return;

      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
        setIsPlaying(!status.isPlaying);
      }
    };

    // Android media button listener
    Audio.addListener('remotePlay', handleMediaButton);
    Audio.addListener('remotePause', handleMediaButton);
    Audio.addListener('remoteStop', handleMediaButton);

    return () => {
      Audio.removeListeners('remotePlay');
      Audio.removeListeners('remotePause');
      Audio.removeListeners('remoteStop');
    };
  }, [setIsPlaying]);
};

export default useMediaControls; 