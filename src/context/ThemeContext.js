import React, { createContext, useEffect, useState, useMemo } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const value = useMemo(() => ({ dark, setDark, toggle: () => setDark(d => !d) }), [dark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
