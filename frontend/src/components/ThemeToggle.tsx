'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { tw } from '@/config/design-system'

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative w-14 h-8 rounded-full p-1 transition-all duration-300
        ${theme === 'dark' 
          ? 'bg-gray-700 hover:bg-gray-600' 
          : 'bg-gray-200 hover:bg-gray-300'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${theme === 'dark' ? 'focus:ring-offset-black' : 'focus:ring-offset-white'}
      `}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      {/* Track */}
      <div className="flex items-center justify-between h-6 px-1">
        {/* Sun icon */}
        <Sun 
          className={`h-4 w-4 transition-all duration-300 ${
            theme === 'light' ? 'text-yellow-500' : 'text-gray-400'
          }`}
        />
        
        {/* Moon icon */}
        <Moon 
          className={`h-4 w-4 transition-all duration-300 ${
            theme === 'dark' ? 'text-blue-400' : 'text-gray-400'
          }`}
        />
      </div>

      {/* Sliding toggle */}
      <motion.div
        className={`
          absolute top-1 w-6 h-6 rounded-full shadow-md transition-all duration-300
          ${theme === 'dark' 
            ? 'bg-blue-500 shadow-blue-500/20' 
            : 'bg-white shadow-gray-300'
          }
        `}
        animate={{
          x: theme === 'dark' ? 24 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </motion.button>
  )
}

// Alternative compact version for tight spaces
export const CompactThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-300
        ${tw.bg.nested} border ${tw.border.primary}
        ${tw.hover.subtle}
        focus:outline-none focus:ring-2 focus:ring-blue-500/40
      `}
      whileTap={{ scale: 0.95 }}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <motion.div
        initial={false}
        animate={{ 
          scale: theme === 'dark' ? 1 : 0,
          opacity: theme === 'dark' ? 1 : 0,
        }}
        className="absolute"
      >
        <Moon className={`h-4 w-4 ${tw.text.blue}`} />
      </motion.div>
      
      <motion.div
        initial={false}
        animate={{ 
          scale: theme === 'light' ? 1 : 0,
          opacity: theme === 'light' ? 1 : 0,
        }}
      >
        <Sun className={`h-4 w-4 ${tw.text.amber}`} />
      </motion.div>
    </motion.button>
  )
}

export default ThemeToggle 