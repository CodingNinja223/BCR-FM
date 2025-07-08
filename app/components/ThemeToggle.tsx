import { useTheme } from '../components/ThemeContext';

export default function ThemeToggle() {
  const { toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle</button>;
}