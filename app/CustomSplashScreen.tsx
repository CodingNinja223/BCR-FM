import React, { useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';

interface Props {
  onFinish: () => void;
}

export default function CustomSplashScreen({ onFinish }: Props) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000); // Show splash for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/splash.png')} style={styles.image} />
      <Text style={styles.slogan}>Pumpim The Beat Of eKasi!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  slogan: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4c1d95',
    textAlign: 'center',
  },
});
