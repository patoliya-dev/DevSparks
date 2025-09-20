'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeDebug: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <div className="text-sm">
        <p className="text-gray-900 dark:text-white">Current Theme: <span className="font-bold">{theme}</span></p>
        <p className="text-gray-600 dark:text-gray-400">Document Class: <span className="font-mono">{document.documentElement.className}</span></p>
        <button
          onClick={toggleTheme}
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
        >
          Toggle Theme
        </button>
      </div>
    </div>
  );
};

export default ThemeDebug;
