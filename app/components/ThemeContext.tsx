import React from 'react';

const ThemeContext = React.createContext({
  isDark: false,
  toggleTheme: () => {}
});

export const useTheme = () => React.useContext(ThemeContext);
export default ThemeContext;