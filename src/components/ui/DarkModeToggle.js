import React, { useContext } from 'react';
import { ThemeContext } from '../../context/ThemeContext';

const DarkModeToggle = () => {
  const { dark, toggle } = useContext(ThemeContext);
  return (
    <button
      onClick={toggle}
      className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 text-sm"
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
};

export default DarkModeToggle;
