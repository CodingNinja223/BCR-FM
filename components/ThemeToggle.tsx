import { Pressable, Text } from 'react-native';
import { useTheme } from './theme';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <Pressable onPress={toggleTheme}>
      <Text style={{ fontSize: 24 }}>
        {isDark ? '☀️' : '🌙'}
      </Text>
    </Pressable>
  );
}