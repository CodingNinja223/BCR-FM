import { ThemeProvider } from '../components/theme';
import { Slot } from 'expo-router';

export default function RootLayout() {
  return ( // <-- Don't forget this return!
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}