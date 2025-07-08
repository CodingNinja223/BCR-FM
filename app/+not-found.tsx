// ✅ app/index.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    try {
      // Attempt to navigate to /Live
      router.replace('/(tabs)/live');
    } catch (err) {
      // If /Live fails, fallback to /feedback
      console.warn('Live screen failed, redirecting to feedback...');
      router.replace('/CatchUp');
    }
  }, []);

  return (
    <View>
      <Text>Redirecting...</Text>
    </View>
  );
}
