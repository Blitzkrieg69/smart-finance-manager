import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Initialize State from LocalStorage (or default to 'neon')
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'neon';
  });

  // 2. Persist Theme Change
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // 3. Define Theme Styles Dictionary
  const getThemeClasses = () => {
    if (theme === 'neon') {
      return {
        bg: 'bg-black',
        card: 'bg-black border',
        text: 'text-white',
        borderSubtle: 'border-white/10',
        
        // Neon Glows
        shadowBlue: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
        shadowGreen: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        shadowRed: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
        
        // Neon Borders
        borderBlue: 'border-blue-500/50',
        borderGreen: 'border-emerald-500/50',
        borderRed: 'border-red-500/50',
        
        // Buttons
        buttonBlue: 'bg-blue-600 shadow-[0_0_20px_#3b82f6]',
      };
    } else {
      // GLASS THEME (Alternative)
      return {
        bg: 'bg-[#0b0c15]',
        card: 'bg-[#12131e]/80 backdrop-blur-xl border border-white/5',
        text: 'text-gray-100',
        borderSubtle: 'border-white/5',
        
        // Soft Shadows
        shadowBlue: 'shadow-xl shadow-blue-900/10',
        shadowGreen: 'shadow-xl shadow-emerald-900/10',
        shadowRed: 'shadow-xl shadow-red-900/10',
        
        // Soft Borders
        borderBlue: 'border-white/10', 
        borderGreen: 'border-white/10',
        borderRed: 'border-white/10',
        
        // Buttons
        buttonBlue: 'bg-blue-600 shadow-lg',
      };
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, styles: getThemeClasses() }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);