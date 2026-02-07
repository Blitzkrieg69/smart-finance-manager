import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // 1. Initialize State from LocalStorage (dark/light)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  // 2. Persist Theme Change
  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  // 3. Define Theme Styles Dictionary
  const getThemeClasses = () => {
    if (theme === 'dark') {
      // DARK THEME = EXACT NEON (100% UNCHANGED)
      return {
        bg: 'bg-black',
        card: 'bg-black border',
        text: 'text-white',
        textSecondary: 'text-gray-400',
        borderSubtle: 'border-white/10',

        // Neon Glows (unchanged)
        shadowBlue: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
        shadowGreen: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
        shadowRed: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
        shadowPurple: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
        shadowPink: 'shadow-[0_0_30px_rgba(236,72,153,0.3)]',
        shadowYellow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',

        // Neon Borders (unchanged)
        borderBlue: 'border-blue-500/50',
        borderGreen: 'border-emerald-500/50',
        borderRed: 'border-red-500/50',
        borderPurple: 'border-purple-500/50',
        borderPink: 'border-pink-500/50',
        borderYellow: 'border-yellow-400/50',

        // Buttons (unchanged)
        buttonBlue: 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_#3b82f6] border border-blue-400',
        buttonGreen: 'bg-emerald-600 hover:bg-emerald-500 shadow-[0_0_20px_#10b981] border border-emerald-400',
        buttonRed: 'bg-red-600 hover:bg-red-500 shadow-[0_0_20px_#ef4444] border border-red-400',
        buttonPurple: 'bg-purple-600 hover:bg-purple-500 shadow-[0_0_20px_#a855f7] border border-purple-400',
        buttonPink: 'bg-pink-600 hover:bg-pink-500 shadow-[0_0_20px_#ec4899] border border-pink-400',
        buttonYellow: 'bg-yellow-500 hover:bg-yellow-400 shadow-[0_0_20px_#facc15] border border-yellow-300',

        // Backgrounds (unchanged)
        bgCard: 'bg-black',
        bgInput: 'bg-black',
        bgHover: 'hover:bg-white/5',

        // Text Colors (unchanged)
        textBlue: 'text-blue-500 drop-shadow-[0_0_10px_#3b82f6]',
        textGreen: 'text-emerald-500 drop-shadow-[0_0_10px_#10b981]',
        textRed: 'text-red-500 drop-shadow-[0_0_10px_#ef4444]',
        textPurple: 'text-purple-500 drop-shadow-[0_0_10px_#a855f7]',
        textPink: 'text-pink-500 drop-shadow-[0_0_10px_#ec4899]',
        textYellow: 'text-yellow-400 drop-shadow-[0_0_10px_#facc15]',
      };
    } else {
      // LIGHT THEME = BEIGE/DARK OAK WOOD
      return {
        bg: 'bg-[#FAF9F6]', // Warm off-white background
        card: 'bg-[#FFF8F0] border border-[#C9A87C]/50',
        text: 'text-[#4B3621]', // DARK OAK WOOD text
        textSecondary: 'text-[#654321]/80',
        borderSubtle: 'border-[#D2B48C]/30',

        // Oak Shadows (soft, natural)
        shadowBlue: 'shadow-lg shadow-[#654321]/20',
        shadowGreen: 'shadow-lg shadow-[#654321]/20',
        shadowRed: 'shadow-lg shadow-[#654321]/20',
        shadowPurple: 'shadow-lg shadow-[#654321]/20',
        shadowPink: 'shadow-lg shadow-[#654321]/20',
        shadowYellow: 'shadow-lg shadow-[#D2B48C]/30',

        // Oak Borders
        borderBlue: 'border-[#654321]/50',
        borderGreen: 'border-[#654321]/50',
        borderRed: 'border-[#654321]/50',
        borderPurple: 'border-[#654321]/50',
        borderPink: 'border-[#654321]/50',
        borderYellow: 'border-[#D2B48C]/50',

        // Beige Buttons with DARK OAK text
        buttonBlue: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',
        buttonGreen: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',
        buttonRed: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',
        buttonPurple: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',
        buttonPink: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',
        buttonYellow: 'bg-[#F5F5DC] hover:bg-[#F5F5DC]/80 shadow-lg shadow-[#D2B48C]/30 border border-[#654321]/30 text-[#4B3621]',

        // Backgrounds
        bgCard: 'bg-[#FFF8F0]',
        bgInput: 'bg-white',
        bgHover: 'hover:bg-[#F5F5DC]/50',

        // Text Colors (DARK OAK WOOD for everything)
        textBlue: 'text-[#4B3621]',
        textGreen: 'text-[#4B3621]',
        textRed: 'text-[#4B3621]',
        textPurple: 'text-[#4B3621]',
        textPink: 'text-[#4B3621]',
        textYellow: 'text-[#654321]',
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
